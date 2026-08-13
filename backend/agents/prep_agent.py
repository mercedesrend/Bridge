"""BEFORE phase — build the pre-visit brief.

Pipeline:
  1. Pull real evidence from PubMed + ClinicalTrials.gov.
  2. Ask the model to turn it into plain language at the requested reading
     level, in the requested language, with a question list.
  3. Attach real source URLs to everything.

The model is explicitly told to work only from the supplied evidence and to
never invent a study — the citation-hallucination problem is the whole reason
this app attaches sources rather than free-styling answers.
"""

from __future__ import annotations

import copy

from data.fixtures import (
    FALLBACK_BRIEF,
    FALLBACK_TRIALS,
    LANGUAGES,
    READING_LEVELS,
    format_history,
)
from services.llm import complete_json
from services.research import gather_evidence

SYSTEM = """You write pre-appointment briefings for patients. You are not a \
doctor and you never diagnose, never tell someone what treatment to take, and \
never predict outcomes. You explain what exists and what to ask.

Hard rules:
- Use ONLY the evidence provided in the prompt. Never invent a study, a drug, \
a statistic, or a source. If the evidence does not cover something, leave it out.
- Never state or imply that the patient has a condition. Say "people with X" \
or "if you have X".
- Frame every treatment as something to ASK ABOUT, not something to take.
- Write for a first-generation patient or family translator who may be \
scared, polite in the exam room, and deciding with relatives afterward.
- Never mention symptoms they did not write. If they wrote tiredness and \
weak joints, do not add thirst, blurry vision, or any other symptom.
- Output valid JSON only. No prose, no markdown fences."""

SCHEMA = """{
  "plain_summary": "2-4 sentences explaining the condition in everyday words",
  "personalized_note": "2 sentences tying THEIR history and symptoms to what to ask first. Empty if they shared nothing.",
  "key_numbers": [{"label": "", "meaning": "", "typical_target": ""}],
  "standard_treatments": [{"name": "", "what_it_is": "", "why_it_matters": "", "common_side_effects": "", "status": ""}],
  "emerging_options": [{"name": "", "what_it_is": "", "why_ask": "", "status": ""}],
  "questions": [{"question": "", "why": "", "priority": "high|medium|low"}],
  "visit_tips": [{"tip": ""}],
  "red_flags": [{"sign": "", "action": ""}]
}"""


def _language_name(code: str) -> str:
    for lang in LANGUAGES:
        if lang["code"] == code:
            return f"{lang['label']} ({lang['native']})"
    return "English"


def _reading_hint(code: str) -> str:
    for level in READING_LEVELS:
        if level["code"] == code:
            return level["hint"]
    return READING_LEVELS[0]["hint"]


def _looks_like_diabetes(condition: str) -> bool:
    c = (condition or "").lower()
    return any(w in c for w in ("diabetes", "diabet", "a1c", "metformin", "glucosa"))


# Fixture leftovers we must never add unless the patient wrote them.
_SYMPTOM_MARKERS = (
    ("thirst", "thirsty", "polidipsia", " sed", "sed "),
    ("blurr", "vision", "retinal", "eye exam", "eye doctor", "vista", "ojos"),
)


def _user_blob(condition: str, symptoms: str, context: str, history: dict | None) -> str:
    return " ".join(
        p for p in (condition, symptoms, context, format_history(history)) if p
    ).lower()


def _invents_symptoms(text: str, user: str) -> bool:
    blob = (text or "").lower()
    for markers in _SYMPTOM_MARKERS:
        if any(m in blob for m in markers) and not any(m in user for m in markers):
            return True
    return False


def _note_from_user(symptoms: str, history: dict | None, context: str, language: str) -> str:
    bits = [s for s in ((symptoms or "").strip(), (context or "").strip()) if s]
    hist = format_history(history)
    if hist:
        bits.append(hist.replace("\n", "; "))
    if not bits:
        return ""
    what = "; ".join(bits)
    if (language or "en").startswith("es"):
        return (
            f"Usted escribió: {what}. Pregunte por eso primero. "
            "Si la cita es corta, diga que tiene dos preguntas más."
        )
    return (
        f"You wrote: {what}. Ask about that first. "
        "If the visit is short, say you have two more questions."
    )


def _generic_scripted_brief(
    *,
    condition: str,
    symptoms: str,
    context: str,
    history: dict | None,
    language: str,
) -> dict:
    """Offline brief that does not dump the diabetes demo onto another visit."""
    spanish = (language or "en").startswith("es")
    topic = (condition or "this visit").strip()
    note = _note_from_user(symptoms, history, context, language)
    if spanish:
        symptom_q = (
            f"He notado esto: {symptoms.strip()}. ¿Qué debemos revisar primero?"
            if symptoms.strip()
            else f"¿Qué debemos tratar primero en esta cita sobre {topic}?"
        )
        return {
            "plain_summary": (
                f"Esta cita es sobre {topic}. Bridge no dice lo que usted tiene. "
                "Las preguntas abajo salen de lo que usted escribió, para usarlas "
                "en una visita corta."
            ),
            "personalized_note": note,
            "key_numbers": [],
            "standard_treatments": [
                {
                    "name": "Lo que suelen ofrecer primero",
                    "what_it_is": "El plan más común para esta clase de visita.",
                    "why_it_matters": "Pregunte por qué es el primer paso, no asuma que es el único.",
                    "common_side_effects": "Pregunte qué vigilar.",
                    "status": "Pregunte en la cita",
                }
            ],
            "emerging_options": [
                {
                    "name": "Opciones más nuevas o estudios",
                    "what_it_is": "Tratamientos o ensayos que a veces no se mencionan a menos que pregunte.",
                    "why_ask": "No es una coincidencia. Pregunte si alguno aplica a usted.",
                    "status": "Pregunte — el equipo decide",
                }
            ],
            "questions": [
                {"question": symptom_q, "why": "Lo que usted siente debe salir primero.", "priority": "high"},
                {
                    "question": "¿Qué opciones hay además de lo que suelen ofrecer primero?",
                    "why": "Las opciones nuevas a menudo no se ofrecen si no pregunta.",
                    "priority": "high",
                },
                {
                    "question": "¿Hay un estudio clínico que debería preguntar?",
                    "why": "Bridge no dice que califica. El sitio del estudio decide.",
                    "priority": "medium",
                },
                {
                    "question": "¿Qué debo vigilar después de esta cita, y cuándo debo llamar?",
                    "why": "Sale con un plan concreto.",
                    "priority": "medium",
                },
            ],
            "visit_tips": copy.deepcopy(FALLBACK_BRIEF.get("visit_tips") or []),
            "red_flags": [],
        }
    symptom_q = (
        f"I've been having this: {symptoms.strip()}. What should we look at first?"
        if symptoms.strip()
        else f"What should we take care of first at this visit about {topic}?"
    )
    return {
        "plain_summary": (
            f"This visit is about {topic}. Bridge never says what you have. "
            "The questions below come from what you wrote, so you can use them "
            "in a short appointment."
        ),
        "personalized_note": note,
        "key_numbers": [],
        "standard_treatments": [
            {
                "name": "What is usually offered first",
                "what_it_is": "The most common first plan for this kind of visit.",
                "why_it_matters": "Ask why it is the first step — not only whether it is the default.",
                "common_side_effects": "Ask what to watch for.",
                "status": "Ask at the visit",
            }
        ],
        "emerging_options": [
            {
                "name": "Newer options or studies",
                "what_it_is": "Treatments or trials that often are not mentioned unless you ask.",
                "why_ask": "Not a match. Ask if any of this applies to you.",
                "status": "Ask — your care team decides",
            }
        ],
        "questions": [
            {"question": symptom_q, "why": "What you are feeling should come first.", "priority": "high"},
            {
                "question": "What options exist besides what is usually offered first?",
                "why": "Newer options often are not offered unless you ask.",
                "priority": "high",
            },
            {
                "question": "Is there a clinical trial I should ask about?",
                "why": "Bridge never says you qualify. The trial site decides.",
                "priority": "medium",
            },
            {
                "question": "What should I watch for after this visit, and when should I call?",
                "why": "Leaves you with a concrete plan.",
                "priority": "medium",
            },
        ],
        "visit_tips": copy.deepcopy(FALLBACK_BRIEF.get("visit_tips") or []),
        "red_flags": [],
    }


def _ground_in_what_they_wrote(
    brief: dict,
    *,
    symptoms: str,
    condition: str,
    context: str,
    history: dict | None,
    language: str,
) -> dict:
    user = _user_blob(condition, symptoms, context, history)
    note = brief.get("personalized_note") or ""
    if _invents_symptoms(note, user) or (not note.strip() and (symptoms or format_history(history))):
        brief["personalized_note"] = _note_from_user(symptoms, history, context, language)
    kept = []
    for q in brief.get("questions") or []:
        if _invents_symptoms(f"{q.get('question', '')} {q.get('why', '')}", user):
            continue
        kept.append(q)
    if (symptoms or "").strip():
        already = " ".join(q.get("question", "") for q in kept).lower()
        snippet = symptoms.strip()[:80]
        if snippet.lower() not in already:
            q = (
                {
                    "question": f"He notado esto: {snippet}. ¿Qué debemos revisar primero?",
                    "why": "Lo que usted escribió debe salir en la cita.",
                    "priority": "high",
                }
                if (language or "en").startswith("es")
                else {
                    "question": f"I've been having this: {snippet}. What should we look at first?",
                    "why": "What you wrote should come up in the visit.",
                    "priority": "high",
                }
            )
            highs = [x for x in kept if x.get("priority") == "high"]
            rest = [x for x in kept if x.get("priority") != "high"]
            kept = [q] + highs + rest
    brief["questions"] = kept
    return brief


_TRIAL_WORDS = (
    "trial",
    "study",
    "studies",
    "clinicaltrials",
    "estudio",
    "ensayo",
    "investigación",
)


def _ensure_trial_question(brief: dict, trials: list, language: str) -> None:
    """One question about studies if we found any — never a match verdict."""
    if not trials:
        return
    questions = brief.setdefault("questions", [])
    blob = " ".join(q.get("question", "") for q in questions).lower()
    if any(word in blob for word in _TRIAL_WORDS):
        return
    spanish = (language or "en").startswith("es")
    item = {
        "question": (
            "¿Hay un estudio clínico que debería preguntar, o el tratamiento "
            "habitual es el primer paso correcto?"
            if spanish
            else "Is there a clinical trial I should ask about, or is the usual treatment the right first step?"
        ),
        "why": (
            "No decimos que califique. El sitio del estudio decide. Pregunte si "
            "alguno aplica a usted."
            if spanish
            else "Not a match. The trial site decides. Ask if any of this applies to you."
        ),
        "priority": "medium",
    }
    highs = [q for q in questions if q.get("priority") == "high"]
    rest = [q for q in questions if q.get("priority") != "high"]
    brief["questions"] = highs + [item] + rest


def _format_evidence(evidence: dict) -> str:
    lines = []
    if evidence["papers"]:
        lines.append("PUBLISHED LITERATURE (PubMed):")
        for p in evidence["papers"]:
            types = ", ".join(p.get("publication_types", [])[:3])
            lines.append(
                f"- [{p['id']}] {p['title']} — {p['journal']} {p['year']}"
                + (f" ({types})" if types else "")
            )
    if evidence["trials"]:
        lines.append("\nACTIVE CLINICAL TRIALS (ClinicalTrials.gov):")
        for t in evidence["trials"]:
            phases = ", ".join(t.get("phases", [])) or t.get("study_type", "")
            interventions = ", ".join(t.get("interventions", [])[:3])
            lines.append(
                f"- [{t['id']}] {t['title']} — {t['status']}"
                + (f", {phases}" if phases else "")
                + (f" | studying: {interventions}" if interventions else "")
            )
            if t.get("summary"):
                lines.append(f"    {t['summary'][:320]}")
    return "\n".join(lines) if lines else "(no evidence retrieved)"


async def build_brief(
    *,
    condition: str,
    language: str = "en",
    reading_level: str = "simple",
    symptoms: str = "",
    context: str = "",
    history: dict | None = None,
) -> dict:
    evidence = await gather_evidence(condition)
    hist = format_history(history)

    prompt = f"""A patient is preparing for a doctor's appointment.

CONDITION OR CONCERN: {condition}
WHAT THEY'RE EXPERIENCING (quote this; do not add other symptoms): {symptoms or "(not specified)"}
THEIR CONTEXT: {context or "(not specified)"}
HISTORY THEY SHARED (optional — never diagnose from this):
{hist or "(none)"}

Do not mention thirst, blurry vision, or any symptom that is not in the lines above.

WRITE THE ENTIRE OUTPUT IN: {_language_name(language)}
READING LEVEL: {_reading_hint(reading_level)}

EVIDENCE RETRIEVED (use only this):
{_format_evidence(evidence)}

Produce a briefing they can read before the visit and a list of 5-7 questions \
to bring with them. Order questions by priority — the ones that would change \
their care most go first. If they shared history, write personalized_note and \
put matching questions first (symptoms, medicines they already take, family \
history, language). Mention possible medicine overlap only as a question to \
ask, never as a fact. Include 3-4 visit_tips on how to make the most of a \
short appointment (including language access). Include red flags only if the \
evidence supports them.

Return JSON matching exactly this shape:
{SCHEMA}"""

    result = await complete_json(
        system=SYSTEM, prompt=prompt, fallback=FALLBACK_BRIEF, max_tokens=3500
    )

    scripted = result.source in {"scripted", "scripted_after_error"}
    diabetes = _looks_like_diabetes(condition)

    if scripted and not diabetes:
        brief = _generic_scripted_brief(
            condition=condition,
            symptoms=symptoms,
            context=context,
            history=history,
            language=language,
        )
    else:
        brief = (
            copy.deepcopy(result.data)
            if isinstance(result.data, dict)
            else copy.deepcopy(FALLBACK_BRIEF)
        )

    brief = _ground_in_what_they_wrote(
        brief,
        symptoms=symptoms,
        condition=condition,
        context=context,
        history=history,
        language=language,
    )

    sources = [
        {
            "id": p["id"],
            "title": p["title"],
            "url": p["url"],
            "source": p["source"],
            "detail": f"{p['journal']} {p['year']}".strip(),
        }
        for p in evidence["papers"]
    ] + [
        {
            "id": t["id"],
            "title": t["title"],
            "url": t["url"],
            "source": t["source"],
            "detail": f"{t['status']} · {', '.join(t.get('phases', [])) or t.get('study_type', '')}".strip(
                " ·"
            ),
        }
        for t in evidence["trials"]
    ]
    live_trials = evidence["trials"][:2]
    trials = live_trials if live_trials else (FALLBACK_TRIALS[:2] if diabetes else [])
    _ensure_trial_question(brief, trials, language)
    if not sources and diabetes:
        sources = list(FALLBACK_BRIEF["sources"]) + [
            {
                "id": t["id"],
                "title": t["title"],
                "url": t["url"],
                "source": t["source"],
                "detail": f"{t.get('status', '')} · {', '.join(t.get('phases', [])) or t.get('study_type', '')}".strip(
                    " ·"
                ),
            }
            for t in trials
        ]
    brief["sources"] = sources
    brief["trials"] = trials
    if not brief.get("visit_tips"):
        brief["visit_tips"] = copy.deepcopy(FALLBACK_BRIEF.get("visit_tips", []))
    brief["_meta"] = {
        "llm_source": result.source,
        "llm_error": result.error,
        "papers_found": len(evidence["papers"]),
        "trials_found": len(trials),
        "language": language,
        "reading_level": reading_level,
        "condition": condition,
    }
    return brief
