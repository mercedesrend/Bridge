"""Bridge — API.

Three phases, one session:
  BEFORE  /api/prep          research + plain-language brief + questions
  DURING  /api/session/*     consent, then live-or-scripted interpretation
  AFTER   /api/recap         summary + gap check against prepared questions

Sessions live in memory only. Nothing is written to disk. That is a deliberate
choice for a public hackathon: no patient data at rest, nothing to leak.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from agents.interpret_agent import interpret_turns
from agents.prep_agent import build_brief
from agents.recap_agent import build_recap
from agents.tutor_agent import answer_question
from config import mode_report, settings
from data.fixtures import DEMO_PATIENT, DEMO_TRANSCRIPT, LANGUAGES, READING_LEVELS

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bridge")

app = FastAPI(title="Bridge", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# session_id -> session dict. In-memory only, cleared on restart.
SESSIONS: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit(session: dict, action: str, **detail) -> None:
    """Every state change is logged. Shown in the UI as a visible trail."""
    session.setdefault("audit", []).append(
        {"at": _now(), "action": action, "detail": detail}
    )


def _get_session(session_id: str) -> dict:
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found. Start a new one.")
    return session


# --------------------------------------------------------------------------
# Models
# --------------------------------------------------------------------------
class PatientHistory(BaseModel):
    age_range: str = ""
    other_conditions: str = ""
    medications: str = ""
    allergies: str = ""
    family_history: str = ""


class PrepRequest(BaseModel):
    condition: str = Field(..., min_length=2, max_length=300)
    language: str = "en"
    reading_level: str = "simple"
    symptoms: str = ""
    context: str = ""
    history: PatientHistory = Field(default_factory=PatientHistory)


class ConsentRequest(BaseModel):
    session_id: str
    consent_given: bool
    consent_text_shown: str = ""


class InterpretRequest(BaseModel):
    session_id: str
    turns: list[dict] = Field(default_factory=list)
    use_demo_transcript: bool = False
    from_index: int = 0
    append: bool = False


class RecapRequest(BaseModel):
    session_id: str


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: str | None = None
    language: str = "en"


# --------------------------------------------------------------------------
# Meta
# --------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"ok": True, "mode": mode_report(), "at": _now()}


@app.get("/api/options")
async def options():
    return {
        "languages": LANGUAGES,
        "reading_levels": READING_LEVELS,
        "demo_patient": DEMO_PATIENT,
        "mode": mode_report(),
    }


# --------------------------------------------------------------------------
# BEFORE
# --------------------------------------------------------------------------
@app.post("/api/prep")
async def prep(req: PrepRequest):
    session_id = uuid.uuid4().hex[:12]
    session = {
        "id": session_id,
        "created_at": _now(),
        "language": req.language,
        "reading_level": req.reading_level,
        "condition": req.condition,
        "symptoms": req.symptoms,
        "context": req.context,
        "history": req.history.model_dump(),
        "consent": None,
        "transcript": [],
        "chat": [],
        "audit": [],
    }
    SESSIONS[session_id] = session
    _audit(
        session,
        "session_created",
        condition=req.condition,
        language=req.language,
        reading_level=req.reading_level,
    )

    brief = await build_brief(
        condition=req.condition,
        language=req.language,
        reading_level=req.reading_level,
        symptoms=req.symptoms,
        context=req.context,
        history=req.history.model_dump(),
    )
    session["brief"] = brief
    _audit(
        session,
        "brief_generated",
        papers=brief["_meta"]["papers_found"],
        trials=brief["_meta"]["trials_found"],
        llm_source=brief["_meta"]["llm_source"],
    )

    return {"session_id": session_id, "brief": brief, "audit": session["audit"]}


# --------------------------------------------------------------------------
# DURING
# --------------------------------------------------------------------------
@app.post("/api/session/consent")
async def consent(req: ConsentRequest):
    session = _get_session(req.session_id)
    session["consent"] = {
        "given": req.consent_given,
        "at": _now(),
        "text_shown": req.consent_text_shown,
    }
    _audit(
        session,
        "consent_recorded",
        given=req.consent_given,
        text_shown=req.consent_text_shown[:200],
    )
    return {"ok": True, "consent": session["consent"], "audit": session["audit"]}


@app.get("/api/demo/transcript")
async def demo_transcript():
    """The scripted appointment. Use this instead of a live mic on stage."""
    return {"turns": DEMO_TRANSCRIPT, "patient": DEMO_PATIENT}


@app.post("/api/interpret")
async def interpret(req: InterpretRequest):
    session = _get_session(req.session_id)

    if not (session.get("consent") or {}).get("given"):
        raise HTTPException(
            403, "Recording consent has not been given for this session."
        )

    if req.append:
        if not req.turns:
            raise HTTPException(400, "No conversation turns supplied.")
        result = await interpret_turns(req.turns, language=session["language"])
        session.setdefault("transcript", []).extend(result["turns"])
        _audit(
            session,
            "turns_interpreted",
            count=len(result["turns"]),
            llm_source=result["source"],
            scripted=False,
            stt=True,
        )
        return {
            "turns": result["turns"],
            "source": result["source"],
            "disclaimer": result["disclaimer"],
            "total_turns": len(session["transcript"]),
            "audit": session["audit"],
        }

    turns = DEMO_TRANSCRIPT if req.use_demo_transcript else req.turns
    if not turns:
        raise HTTPException(400, "No conversation turns supplied.")

    slice_ = turns[req.from_index :]
    result = await interpret_turns(slice_, language=session["language"])

    session["transcript"] = turns[: req.from_index] + result["turns"]
    _audit(
        session,
        "turns_interpreted",
        count=len(result["turns"]),
        llm_source=result["source"],
        scripted=req.use_demo_transcript,
    )

    return {
        "turns": result["turns"],
        "source": result["source"],
        "disclaimer": result["disclaimer"],
        "total_turns": len(session["transcript"]),
        "audit": session["audit"],
    }


# --------------------------------------------------------------------------
# AFTER
# --------------------------------------------------------------------------
@app.post("/api/recap")
async def recap(req: RecapRequest):
    session = _get_session(req.session_id)

    if not session.get("transcript"):
        raise HTTPException(400, "No conversation recorded for this session yet.")

    prepared = (session.get("brief") or {}).get("questions", [])
    result = await build_recap(
        transcript=session["transcript"],
        prepared_questions=prepared,
        language=session["language"],
        condition=session.get("condition", ""),
        history=session.get("history") or {},
        context=session.get("context", ""),
    )
    session["recap"] = result
    _audit(
        session,
        "recap_generated",
        llm_source=result["_meta"]["llm_source"],
        gaps_found=len(result.get("unanswered_questions", [])),
    )

    return {"recap": result, "audit": session["audit"]}


@app.post("/api/ask")
async def ask(req: AskRequest):
    """Health-literacy chat. Works with or without a session."""
    session = SESSIONS.get(req.session_id) if req.session_id else None
    language = (session or {}).get("language") or req.language or "en"
    brief = (session or {}).get("brief") or {}

    reply = await answer_question(
        message=req.message,
        language=language,
        condition=(session or {}).get("condition", ""),
        symptoms=(session or {}).get("symptoms", ""),
        context=(session or {}).get("context", ""),
        history=(session or {}).get("history") or {},
        brief_summary=brief.get("plain_summary", ""),
        chat_history=(session or {}).get("chat") or [],
    )

    turn = {
        "at": _now(),
        "question": req.message,
        "answer": reply.get("answer", ""),
        "related_questions": reply.get("related_questions", []),
        "ask_your_doctor": reply.get("ask_your_doctor", ""),
        "source": (reply.get("_meta") or {}).get("llm_source"),
    }
    if session is not None:
        session.setdefault("chat", []).append(turn)
        _audit(session, "ask_bridge", preview=req.message[:80])
        return {"reply": reply, "audit": session["audit"]}
    return {"reply": reply, "audit": []}


@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    session = _get_session(session_id)
    return session


@app.get("/api/session/{session_id}/export")
async def export_session(session_id: str):
    """Everything the patient can take with them, in one payload."""
    session = _get_session(session_id)
    return {
        "session_id": session_id,
        "created_at": session["created_at"],
        "condition": session.get("condition"),
        "language": session.get("language"),
        "history": session.get("history"),
        "consent": session.get("consent"),
        "brief": session.get("brief"),
        "transcript": session.get("transcript"),
        "recap": session.get("recap"),
        "chat": session.get("chat"),
        "audit": session.get("audit"),
        "generated_at": _now(),
        "disclaimer": (
            "This is an informational summary generated from a recorded "
            "conversation. It is not a medical record and not medical advice. "
            "Confirm anything important with your care team."
        ),
    }


# --------------------------------------------------------------------------
# Static frontend
# --------------------------------------------------------------------------
FRONTEND = Path(__file__).resolve().parent.parent / "frontend"
if FRONTEND.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

    @app.get("/")
    async def index():
        return FileResponse(FRONTEND / "index.html")


if __name__ == "__main__":
    import uvicorn

    log.info("Mode: %s", mode_report())
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
