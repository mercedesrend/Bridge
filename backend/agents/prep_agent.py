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

import json

from data.fixtures import FALLBACK_BRIEF, FALLBACK_TRIALS, LANGUAGES, READING_LEVELS
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
- Output valid JSON only. No prose, no markdown fences."""

SCHEMA = """{
  "plain_summary": "2-4 sentences explaining the condition in everyday words",
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
) -> dict:
    evidence = await gather_evidence(condition)

    prompt = f"""A patient is preparing for a doctor's appointment.

CONDITION OR CONCERN: {condition}
WHAT THEY'RE EXPERIENCING: {symptoms or "(not specified)"}
THEIR CONTEXT: {context or "(not specified)"}

WRITE THE ENTIRE OUTPUT IN: {_language_name(language)}
READING LEVEL: {_reading_hint(reading_level)}

EVIDENCE RETRIEVED (use only this):
{_format_evidence(evidence)}

Produce a briefing they can read before the visit and a list of 5-7 questions \
to bring with them. Order questions by priority — the ones that would change \
their care most go first. Include 3-4 visit_tips on how to make the most of a \
short appointment (including language access). Include red flags only if the \
evidence supports them.

Return JSON matching exactly this shape:
{SCHEMA}"""

    result = await complete_json(
        system=SYSTEM, prompt=prompt, fallback=FALLBACK_BRIEF, max_tokens=3500
    )

    brief = dict(result.data) if isinstance(result.data, dict) else dict(FALLBACK_BRIEF)

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
    trials = evidence["trials"] or FALLBACK_TRIALS
    if not sources:
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
        brief["visit_tips"] = FALLBACK_BRIEF.get("visit_tips", [])
    if not brief.get("red_flags"):
        brief["red_flags"] = FALLBACK_BRIEF.get("red_flags", [])
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
