"""AFTER phase — turn the visit into something the patient can actually use.

The distinctive part is gap detection: we hold the questions the patient
prepared in the Before phase, and check the transcript for which ones actually
got answered. People forget most of what they're told in a visit, and rarely
notice in the moment that their own question never came up. This closes that
loop.
"""

from __future__ import annotations

import json

from data.fixtures import FALLBACK_RECAP, LANGUAGES, format_history
from services.llm import complete_json

SYSTEM = """You write after-visit summaries for patients, in their own language.

Hard rules:
- Use ONLY what was actually said in the transcript. Never add a diagnosis, a \
dose, an instruction, or a reassurance that was not spoken. If something was \
unclear or never stated, say so plainly rather than filling the gap.
- Do not give medical advice of your own. You are reporting what happened.
- For unanswered questions, do not answer them yourself — say how and when to \
follow up.
- On second opinions: only suggest one when the transcript shows a genuine \
reason (a serious diagnosis with no options discussed, a plan the patient said \
they did not understand, or a question left open that materially affects care). \
Do not suggest one reflexively — that erodes trust in the doctor for no reason.
- Output valid JSON only. No prose, no markdown fences."""

SCHEMA = """{
  "headline": "one sentence: what happened at this visit",
  "family_note": "a short paragraph a patient can forward to family, in their language",
  "what_was_decided": [{"item": "", "detail": ""}],
  "medications": [{"name": "", "dose": "", "frequency": "", "instructions": "", "watch_for": ""}],
  "unanswered_questions": [{"question": "", "why_it_matters": "", "how_to_follow_up": ""}],
  "next_steps": [{"step": "", "when": ""}],
  "second_opinion": {"worth_considering": false, "reasoning": ""},
  "places_to_go": [{"place": "", "kind": "today|referral|followup|trial", "why": "", "how": ""}]
}"""


def _language_name(code: str) -> str:
    for lang in LANGUAGES:
        if lang["code"] == code:
            return f"{lang['label']} ({lang['native']})"
    return "English"


async def build_recap(
    *,
    transcript: list[dict],
    prepared_questions: list[dict] | None = None,
    language: str = "en",
    condition: str = "",
    history: dict | None = None,
    context: str = "",
) -> dict:
    prepared_questions = prepared_questions or []

    convo = "\n".join(
        f'[{t.get("speaker", "?")}]: {t.get("text", "")}' for t in transcript
    )
    prepped = (
        "\n".join(f'- {q.get("question", "")}' for q in prepared_questions)
        or "(none recorded)"
    )

    prompt = f"""WRITE THE ENTIRE OUTPUT IN: {_language_name(language)}
CONDITION DISCUSSED: {condition or "(not specified)"}
BACKGROUND THEY SHARED BEFORE THE VISIT (for tone only — do not add medical facts that were not spoken):
{format_history(history) or "(none)"}
CONTEXT: {context or "(none)"}

QUESTIONS THE PATIENT PREPARED BEFORE THE VISIT:
{prepped}

WHAT WAS ACTUALLY SAID:
{convo}

Tasks:
1. Summarize what was decided, using only what was said.
2. List medications exactly as stated — dose, frequency, instructions. If a \
detail was never stated, write "not stated in the visit" rather than guessing.
3. GAP CHECK: go through the prepared questions one by one and identify which \
were never answered in the conversation. These go in unanswered_questions.
4. Give concrete next steps with rough timing.
5. Judge whether a second opinion is genuinely warranted, per your rules.
6. List places_to_go: pharmacy, referred clinics, specialists, or how to follow \
up — only from what was said, plus the front desk / portal for unanswered questions.
7. Write family_note: a forwardable paragraph for the people who help this \
patient decide — what happened, what to take, what still needs asking.

Return JSON matching exactly this shape:
{SCHEMA}"""

    result = await complete_json(
        system=SYSTEM, prompt=prompt, fallback=FALLBACK_RECAP, max_tokens=3500
    )

    recap = dict(result.data) if isinstance(result.data, dict) else dict(FALLBACK_RECAP)
    if result.source != "live":
        if not recap.get("places_to_go"):
            recap["places_to_go"] = FALLBACK_RECAP.get("places_to_go", [])
        if not recap.get("family_note"):
            recap["family_note"] = FALLBACK_RECAP.get("family_note", "")
    recap["_meta"] = {
        "llm_source": result.source,
        "llm_error": result.error,
        "turns_analyzed": len(transcript),
        "questions_checked": len(prepared_questions),
        "language": language,
    }
    return recap
