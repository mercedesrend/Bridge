"""Single entry point for every model call in the app.

Every agent calls `complete_json`. If no API key is configured (or we've
forced scripted mode for the demo), the caller's `fallback` value is
returned instead and the response is tagged so the UI can label it.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from config import settings

log = logging.getLogger(__name__)

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
_FENCE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.MULTILINE)


class LLMResult:
    def __init__(self, data: Any, source: str, error: str | None = None):
        self.data = data
        self.source = source  # "live" | "scripted" | "scripted_after_error"
        self.error = error


def _strip_fences(text: str) -> str:
    return _FENCE.sub("", text).strip()


def _extract_json(text: str) -> Any:
    """Models occasionally wrap JSON in prose. Salvage the object."""
    cleaned = _strip_fences(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    start = min(
        (i for i in (cleaned.find("{"), cleaned.find("[")) if i != -1),
        default=-1,
    )
    if start == -1:
        raise ValueError("no JSON found in model response")
    end = max(cleaned.rfind("}"), cleaned.rfind("]"))
    return json.loads(cleaned[start : end + 1])


async def complete_json(
    *,
    system: str,
    prompt: str,
    fallback: Any,
    max_tokens: int = 3000,
    temperature: float = 0.2,
) -> LLMResult:
    """Ask the model for JSON. Never raises — degrades to `fallback`."""
    if not settings.llm_live:
        return LLMResult(fallback, "scripted")

    payload = {
        "model": settings.anthropic_model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "content-type": "application/json",
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.post(ANTHROPIC_URL, json=payload, headers=headers)
            resp.raise_for_status()
            body = resp.json()

        text = "\n".join(
            block.get("text", "")
            for block in body.get("content", [])
            if block.get("type") == "text"
        )
        return LLMResult(_extract_json(text), "live")

    except Exception as exc:  # noqa: BLE001 - demo must survive anything
        log.warning("LLM call failed, using scripted fallback: %s", exc)
        return LLMResult(fallback, "scripted_after_error", str(exc))


async def complete_text(
    *, system: str, prompt: str, fallback: str, max_tokens: int = 1500
) -> LLMResult:
    """Plain-text variant, used for translation."""
    if not settings.llm_live:
        return LLMResult(fallback, "scripted")

    payload = {
        "model": settings.anthropic_model,
        "max_tokens": max_tokens,
        "temperature": 0.1,
        "system": system,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "content-type": "application/json",
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            resp = await client.post(ANTHROPIC_URL, json=payload, headers=headers)
            resp.raise_for_status()
            body = resp.json()
        text = "\n".join(
            b.get("text", "") for b in body.get("content", []) if b.get("type") == "text"
        ).strip()
        return LLMResult(text or fallback, "live")
    except Exception as exc:  # noqa: BLE001
        log.warning("LLM text call failed: %s", exc)
        return LLMResult(fallback, "scripted_after_error", str(exc))
