"""Single entry point for every model call in the app.

Order:
  1. Amazon Bedrock (hackathon default — Claude on AWS)
  2. Anthropic HTTP API, if a key is set
  3. Scripted fallback so the demo never dies

Every agent calls `complete_json`. If nothing is live, the caller's `fallback`
is returned and tagged so the UI can label it.
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
        self.source = source  # "bedrock" | "live" | "scripted" | "scripted_after_error"
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


def _bedrock_text(system: str, prompt: str, *, max_tokens: int, temperature: float) -> str:
    import boto3

    kwargs = {"region_name": settings.aws_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    client = boto3.client("bedrock-runtime", **kwargs)
    resp = client.converse(
        modelId=settings.bedrock_model_id,
        system=[{"text": system}],
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={
            "maxTokens": max_tokens,
            "temperature": temperature,
        },
    )
    parts = []
    for block in resp.get("output", {}).get("message", {}).get("content", []):
        if "text" in block:
            parts.append(block["text"])
    return "\n".join(parts).strip()


async def _anthropic_text(
    *, system: str, prompt: str, max_tokens: int, temperature: float
) -> str:
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
    async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
        resp = await client.post(ANTHROPIC_URL, json=payload, headers=headers)
        resp.raise_for_status()
        body = resp.json()
    return "\n".join(
        block.get("text", "")
        for block in body.get("content", [])
        if block.get("type") == "text"
    ).strip()


async def _complete(*, system: str, prompt: str, max_tokens: int, temperature: float) -> LLMResult:
    import asyncio

    errors = []
    if settings.bedrock_live:
        try:
            text = await asyncio.to_thread(
                _bedrock_text,
                system,
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return LLMResult(text, "bedrock")
        except Exception as exc:  # noqa: BLE001
            log.warning("Bedrock call failed: %s", exc)
            errors.append(str(exc))

    if settings.anthropic_live:
        try:
            text = await _anthropic_text(
                system=system,
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return LLMResult(text, "live")
        except Exception as exc:  # noqa: BLE001
            log.warning("Anthropic call failed: %s", exc)
            errors.append(str(exc))

    return LLMResult(None, "scripted" if not errors else "scripted_after_error", "; ".join(errors) or None)


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

    result = await _complete(
        system=system, prompt=prompt, max_tokens=max_tokens, temperature=temperature
    )
    if result.source in {"scripted", "scripted_after_error"} or not result.data:
        return LLMResult(fallback, result.source if result.source != "scripted" else "scripted", result.error)
    try:
        return LLMResult(_extract_json(str(result.data)), result.source)
    except Exception as exc:  # noqa: BLE001
        log.warning("Could not parse model JSON: %s", exc)
        return LLMResult(fallback, "scripted_after_error", str(exc))


async def complete_text(
    *, system: str, prompt: str, fallback: str, max_tokens: int = 1500
) -> LLMResult:
    """Plain-text variant, used for translation."""
    if not settings.llm_live:
        return LLMResult(fallback, "scripted")

    result = await _complete(
        system=system, prompt=prompt, max_tokens=max_tokens, temperature=0.1
    )
    if result.source in {"scripted", "scripted_after_error"} or not result.data:
        return LLMResult(fallback, result.source if result.source != "scripted" else "scripted", result.error)
    text = str(result.data).strip()
    return LLMResult(text or fallback, result.source, result.error)
