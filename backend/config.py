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
    # Preferred: Amazon Bedrock (hackathon). Anthropic direct is a fallback.
    aws_region: str = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    bedrock_model_id: str = os.getenv(
        "BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-5"
    )
    use_bedrock: bool = os.getenv("USE_BEDROCK", "true").lower() != "false"

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
    def aws_creds(self) -> bool:
        return bool(
            self.aws_access_key_id
            or os.getenv("AWS_PROFILE")
            or os.getenv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI")
        )

    @property
    def bedrock_live(self) -> bool:
        return self.use_bedrock and self.aws_creds and not self.force_scripted

    @property
    def anthropic_live(self) -> bool:
        return bool(self.anthropic_api_key) and not self.force_scripted

    @property
    def llm_live(self) -> bool:
        return (self.bedrock_live or self.anthropic_live) and not self.force_scripted

    @property
    def translate_live(self) -> bool:
        return self.aws_creds and not self.force_scripted

    @property
    def comprehend_medical_live(self) -> bool:
        return self.aws_creds and not self.force_scripted

    @property
    def research_live(self) -> bool:
        return not self.force_scripted

    @property
    def brightdata_live(self) -> bool:
        return bool(self.brightdata_api_key) and not self.force_scripted


settings = Settings()


def mode_report() -> dict:
    """Surfaced in the UI so you always know what's real during a demo."""
    if settings.bedrock_live:
        llm = "bedrock"
        model = settings.bedrock_model_id
    elif settings.anthropic_live:
        llm = "live"
        model = settings.anthropic_model
    else:
        llm = "scripted"
        model = None
    return {
        "llm": llm,
        "model": model,
        "research": "live" if settings.research_live else "scripted",
        "brightdata": "live" if settings.brightdata_live else "scripted",
        "translate": "live" if settings.translate_live else "scripted",
        "comprehend_medical": "live" if settings.comprehend_medical_live else "scripted",
        "force_scripted": settings.force_scripted,
        "region": settings.aws_region,
    }
