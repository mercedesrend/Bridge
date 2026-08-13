"""DURING phase — translate and plain-language the conversation as it happens.

Every turn gets two derived fields:
  - translation:  the same sentence in the patient's language
  - plain:        jargon unpacked ("A1C" -> what it actually measures)

This is explicitly NOT a replacement for a professional medical interpreter,
and the API says so in every response. Language access is a legal right in US
healthcare; this is a comprehension aid on the patient's own phone, not a
substitute for the interpreter a clinic is required to provide.
"""

from __future__ import annotations

import json

from data.fixtures import FALLBACK_TRANSLATIONS, LANGUAGES
from services.llm import complete_json

SYSTEM = """You help a patient follow what is being said in their medical \
appointment, in real time.

For each line of the conversation you produce:
1. translation — a faithful translation into the patient's language. Translate \
meaning, not word-for-word. Never soften, omit, or add medical content.
2. plain — the same line with jargon unpacked, in the patient's language. If \
a number or medical term appears (A1C, mg, retinal exam), say what it means in \
everyday words.

Never add advice, reassurance, or interpretation that the speaker did not say. \
If a line is already simple, `plain` may repeat the translation.

Output valid JSON only. No prose, no markdown fences."""

DISCLAIMER = (
    "This is a comprehension aid, not a certified medical interpreter. "
    "You have the right to a professional interpreter at no cost — you can ask for one."
)


def _language_name(code: str) -> str:
    for lang in LANGUAGES:
        if lang["code"] == code:
            return f"{lang['label']} ({lang['native']})"
    return "English"


def _fallback_for(turns: list[dict], language: str) -> list[dict]:
    out = []
    for turn in turns:
        target = language if turn.get("lang") != language else "en"
        table = FALLBACK_TRANSLATIONS.get(target, {})
        translation = table.get(turn["text"], turn["text"])
        out.append(
            {
                "index": turn.get("index", len(out)),
                "translation": translation,
                "plain": translation,
                "terms": [],
            }
        )
    return out


async def interpret_turns(turns: list[dict], language: str = "es") -> dict:
    """Translate a batch of conversation turns. Batching keeps latency sane."""
    if not turns:
        return {"turns": [], "source": "scripted", "disclaimer": DISCLAIMER}

    indexed = [{**t, "index": i} for i, t in enumerate(turns)]
    lines = "\n".join(
        f'{t["index"]}. [{t["speaker"]}, spoken in {t.get("lang", "en")}]: {t["text"]}'
        for t in indexed
    )

    prompt = f"""PATIENT'S LANGUAGE: {_language_name(language)}

CONVERSATION SO FAR:
{lines}

For every line above, return an entry. If a line was spoken in the patient's \
own language, translate it to English instead (so the record is complete both \
ways), and keep `plain` in the patient's language.

Also list any medical terms or numbers worth explaining, with a one-line \
everyday meaning in the patient's language.

Return JSON:
{{"turns": [{{"index": 0, "translation": "", "plain": "", "terms": [{{"term": "", "means": ""}}]}}]}}"""

    result = await complete_json(
        system=SYSTEM,
        prompt=prompt,
        fallback={"turns": _fallback_for(indexed, language)},
        max_tokens=4000,
    )

    data = result.data if isinstance(result.data, dict) else {}
    entries = data.get("turns") or _fallback_for(indexed, language)
    by_index = {e.get("index", i): e for i, e in enumerate(entries)}

    merged = []
    for turn in indexed:
        entry = by_index.get(turn["index"], {})
        merged.append(
            {
                **turn,
                "translation": entry.get("translation", turn["text"]),
                "plain": entry.get("plain", entry.get("translation", turn["text"])),
                "terms": entry.get("terms", []),
            }
        )

    return {
        "turns": merged,
        "source": result.source,
        "error": result.error,
        "disclaimer": DISCLAIMER,
    }
