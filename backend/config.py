"""Configuration and runtime mode detection.

The app runs in one of two modes on every individual capability:
  - LIVE:   a real API key is present, so we call the real service.
  - SCRIPTED: no key, so we serve pre-built fixture data.

This is deliberate. At a hackathon the demo must never hard-fail because
the venue wifi died or a rate limit kicked in at 8pm. Every live path has
a scripted twin, and the UI shows which one produced the answer.
"""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    # Optional: Bright Data for pulling policy / clinic pages that block plain requests.
    brightdata_api_key: str = os.getenv("BRIGHTDATA_API_KEY", "")
    brightdata_zone: str = os.getenv("BRIGHTDATA_ZONE", "web_unlocker1")

    # NCBI is free and keyless, but a key raises the rate limit from 3/s to 10/s.
    ncbi_api_key: str = os.getenv("NCBI_API_KEY", "")
    contact_email: str = os.getenv("CONTACT_EMAIL", "hackathon@example.com")

    # Force scripted mode even when keys exist. Flip this right before demoing.
    force_scripted: bool = os.getenv("FORCE_SCRIPTED", "false").lower() == "true"

    request_timeout: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    max_studies: int = int(os.getenv("MAX_STUDIES", "6"))

    @property
    def llm_live(self) -> bool:
        return bool(self.anthropic_api_key) and not self.force_scripted

    @property
    def research_live(self) -> bool:
        # PubMed and ClinicalTrials.gov need no key at all.
        return not self.force_scripted

    @property
    def brightdata_live(self) -> bool:
        return bool(self.brightdata_api_key) and not self.force_scripted


settings = Settings()


def mode_report() -> dict:
    """Surfaced in the UI so you always know what's real during a demo."""
    return {
        "llm": "live" if settings.llm_live else "scripted",
        "research": "live" if settings.research_live else "scripted",
        "brightdata": "live" if settings.brightdata_live else "scripted",
        "model": settings.anthropic_model if settings.llm_live else None,
        "force_scripted": settings.force_scripted,
    }
