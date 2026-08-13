"""Bright Data Web Unlocker — optional.

Used in the After phase to pull real specialist-directory and patient-advocacy
pages that block ordinary requests. Falls back to plain httpx, then to
fixtures, so nothing here is load-bearing for the demo.
"""

from __future__ import annotations

import logging

import httpx

from config import settings

log = logging.getLogger(__name__)

UNLOCKER_URL = "https://api.brightdata.com/request"


async def fetch_page(url: str, as_markdown: bool = True) -> dict:
    """Return {'ok', 'content', 'via'} for a public URL."""
    if settings.brightdata_live:
        try:
            payload = {
                "zone": settings.brightdata_zone,
                "url": url,
                "format": "raw",
            }
            if as_markdown:
                payload["data_format"] = "markdown"
            headers = {
                "Authorization": f"Bearer {settings.brightdata_api_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
                resp = await client.post(UNLOCKER_URL, json=payload, headers=headers)
                resp.raise_for_status()
                return {"ok": True, "content": resp.text[:20000], "via": "brightdata"}
        except Exception as exc:  # noqa: BLE001
            log.warning("Bright Data fetch failed for %s: %s", url, exc)

    try:
        async with httpx.AsyncClient(
            timeout=settings.request_timeout, follow_redirects=True
        ) as client:
            resp = await client.get(url, headers={"User-Agent": "bridge/0.1"})
            resp.raise_for_status()
            return {"ok": True, "content": resp.text[:20000], "via": "direct"}
    except Exception as exc:  # noqa: BLE001
        log.warning("Direct fetch failed for %s: %s", url, exc)
        return {"ok": False, "content": "", "via": "none"}
