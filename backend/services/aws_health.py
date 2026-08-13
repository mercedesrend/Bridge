"""AWS healthcare APIs used in the exam room.

Purpose is speed, not extra screens:
  - Amazon Translate  — captions in the patient's language without waiting on a model
  - Amazon Comprehend Medical — pull medical terms from what the doctor said, in English

Amazon Bedrock lives in services/llm.py. AWS HealthOmics is a genomics pipeline
service — it does not belong in a 15-minute visit, so we do not call it.
"""

from __future__ import annotations

import asyncio
import logging

from config import settings

log = logging.getLogger(__name__)

# Amazon Translate uses ISO-ish codes. Tagalog is "tl".
_TRANSLATE_OK = {
    "en", "es", "zh", "zh-TW", "vi", "tl", "ar", "ru", "ko", "pt", "fr", "ht", "bn",
}


def _translate_code(lang: str) -> str:
    if lang == "zh":
        return "zh"
    return lang if lang in _TRANSLATE_OK else "en"


def _client(service: str):
    import boto3

    kwargs = {"region_name": settings.aws_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    return boto3.client(service, **kwargs)


async def translate_text(text: str, *, source: str, target: str) -> str | None:
    if not settings.translate_live or not text.strip():
        return None
    src = _translate_code(source or "en")
    tgt = _translate_code(target or "en")
    if src == tgt:
        return text
    try:
        def _call():
            resp = _client("translate").translate_text(
                Text=text[:5000],
                SourceLanguageCode=src,
                TargetLanguageCode=tgt,
            )
            return resp.get("TranslatedText")

        return await asyncio.to_thread(_call)
    except Exception as exc:  # noqa: BLE001
        log.warning("Amazon Translate failed: %s", exc)
        return None


async def medical_terms(text: str) -> list[dict]:
    """DetectEntitiesV2 on English clinical speech. Empty if unavailable."""
    if not settings.comprehend_medical_live or not text.strip():
        return []
    try:
        def _call():
            resp = _client("comprehendmedical").detect_entities_v2(Text=text[:20000])
            out = []
            seen = set()
            for ent in resp.get("Entities", []):
                name = (ent.get("Text") or "").strip()
                cat = ent.get("Category") or ""
                if not name or name.lower() in seen:
                    continue
                if cat not in {
                    "MEDICAL_CONDITION",
                    "MEDICATION",
                    "TEST_TREATMENT_PROCEDURE",
                    "ANATOMY",
                }:
                    continue
                seen.add(name.lower())
                traits = ", ".join(t.get("Name", "") for t in ent.get("Traits", []) if t.get("Name"))
                out.append(
                    {
                        "term": name,
                        "means": traits or cat.replace("_", " ").title(),
                        "category": cat,
                    }
                )
                if len(out) >= 6:
                    break
            return out

        return await asyncio.to_thread(_call)
    except Exception as exc:  # noqa: BLE001
        log.warning("Amazon Comprehend Medical failed: %s", exc)
        return []
