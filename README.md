# Bridge

**The extra chair in the exam room — in your language.**

Built for AWS Biopharma Hack Day · Problem statement #3, Treatment observability for patients.

**For Claude / any agent continuing this work:** read [`CLAUDE.md`](CLAUDE.md) first. Product rules, demo, speech, git, and what not to build live there.

Not an AI doctor. An advocate for first-gen families who translate for their
parents, miss the question that mattered, and never hear that a trial or a
newer treatment exists unless they know to ask.

---

## Run it (2 minutes)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # add ANTHROPIC_API_KEY for real AI output
python main.py
```

Open **http://localhost:8000**

Without an API key it runs in **scripted mode** — full UI, fixture data, zero
network. With a key it makes real model calls and hits PubMed and
ClinicalTrials.gov live.

**Before you demo:** set `FORCE_SCRIPTED=true` in `.env` if the venue wifi is
unreliable. Everything still works, instantly, offline.

---

## What it does

| Phase | What happens |
|---|---|
| **Before** | Language first. Pulls PubMed + ClinicalTrials.gov, then a question list, standard vs newer treatments, and studies to *ask about* — every claim has a real URL. |
| **During** | Consent gate. Captions in the patient's language, jargon unpacked, checklist of the questions they brought. Notes for family. |
| **After** | A forwardable family note, places to go, and the **gap check**: questions prepared but never asked — including the ones swallowed when the doctor said someone else was waiting. |

---

## The demo script (5 minutes)

The scripted appointment is a Spanish-speaking, first-gen patient newly
diagnosed with type 2 diabetes. It's written so that a real gap occurs.

1. **Before** — click *Load demo*, then *Get me ready*.
   Point at question #2: *"Am I a candidate for a GLP-1 medicine?"*
   Say: "Hold onto that one. Newer options often are not offered unless you ask."

2. **During** — check consent, turn on captions, hit *Skip to end*.
   Toggle between *Plain words* and *What was said* — show the doctor said
   "A1C is 8.2" and the phone unpacked the number in Spanish.
   Note the doctor's line: *"I have another patient waiting."*
   Then her reply: *"No, I don't think so."* That is not confusion. That is
   being a good guest in a room that isn't yours.

3. **After** — *Write it for my family*.
   **This is the moment.** The GLP-1 question is flagged: prepared, never
   asked. The Spanish-speaking educator was never requested. Say: "She left
   without the question that would change her care. She will send this to her
   daughter tonight. The daughter will ask."

4. Open the **Activity log** — every step, timestamped. Nothing stored.

---

## Architecture

```
frontend/          no build step, plain HTML/CSS/JS — edit and refresh
backend/
  main.py          FastAPI, in-memory sessions, audit log on every action
  config.py        live vs scripted mode detection per capability
  agents/
    prep_agent      Before  — evidence → plain-language brief + questions
    interpret_agent During  — translation + jargon unpacking
    recap_agent     After   — summary + gap check against prepared questions
  services/
    llm.py          single Anthropic entry point, never raises, always degrades
    research.py     PubMed E-utilities + ClinicalTrials.gov v2 (both keyless)
    brightdata.py   optional Web Unlocker for pages that block plain requests
  data/fixtures.py  scripted transcript + all fallbacks
```

**Design decisions worth defending in Q&A:**

- **No patient data at rest.** Sessions are in-memory and die with the process.
  Nothing is written to disk, nothing goes to a third party beyond the model call.
- **Consent is enforced server-side.** `/api/interpret` returns 403 without it.
  It isn't a checkbox you can skip in the UI.
- **Every model call has a scripted twin.** A demo should never fail because
  of a rate limit.
- **The model is told to use only retrieved evidence.** Citation hallucination
  is the known failure mode here; sources are attached, not generated.
- **We never diagnose.** The prompts forbid it explicitly, and the recap agent
  is told to report only what was actually said in the room.

---

## Known limits (say these before a judge finds them)

- Live captions use the browser Speech-to-Text API (Chrome / Edge). On stage,
  use **Simulate appointment** — same caption UI, scripted audio, no mic needed.
- Translation quality isn't clinically validated. The UI says so, and points
  patients to their legal right to a professional interpreter.
- Trial matching is by condition only, not by eligibility criteria.
