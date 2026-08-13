# CLAUDE.md — Bridge (source of truth)

Read this before changing the app, the demo, the speech, or the slides.
If this file conflicts with chat history or README, **this file wins** unless Amber explicitly overrides it.

Amber Toor is the owner of this Next.js phone UI (visit companion on `hackday-bridge`). Prefer working in code. Do not invent a second product.

---

## What this is

**Bridge** is the extra chair in the exam room, in your language.

It is **not** an AI doctor. It does not diagnose, prescribe, or replace a certified interpreter.
It is a visit advocate for first-gen / LEP families: 3 questions before, captions during, a family note after, and a **gap check** (questions prepared but never asked).

**Event:** AWS Biopharma Hack Day (AWS Builder Loft, SF). Problem statement **#3 — Treatment observability for patients.**

**Team:** Amber Toor (this app) and Mercedes Rend (separate Next.js trial matcher).

**One-line bet:** Lotus raised ~$41M to be the AI doctor. Bridge never competes there. The company is: first-gen patients leave a 15-minute visit having asked about the treatment they would otherwise never be offered.

---

## Git — do not break this

Repo: `https://github.com/mercedesrend/Bridge`

- Local `main` **tracks `origin/hackday-bridge`**, not GitHub `main`.
- GitHub **`main` is Mercedes’ Next.js dashboard**. **Never merge or force-push this visit app onto `main`.**
- Push this visit companion only to `hackday-bridge`.
- Do not update git config. Do not commit unless Amber asks.

---

## How to run

```bash
npm install
cp .env.example .env
npm run dev
```

Open **http://localhost:8000** (app) and **http://localhost:8000/pitch** (slides).

Chrome only for live captions. `FORCE_SCRIPTED=true` in `.env` before going on stage so wifi cannot kill the demo.

LLM order: Anthropic HTTP → scripted fixtures. Research (PubMed + ClinicalTrials.gov) can run without a model key. **If the model is scripted, do not dump the diabetes fixture onto a non-diabetes visit.**

---

## Product rules (non-negotiable)

1. Never diagnose. Never say the user “has” a condition. Never prescribe.
2. Never replace a certified interpreter. Section 1557: interpreter is free by law. Captions are a comprehension aid.
3. Never collect name, address, insurance, or immigration status.
4. Sessions are in-memory only. Nothing at rest.
5. Consent is enforced server-side (`/api/interpret` → 403 without it).
6. Every live path has a scripted twin. Demos must not die.
7. Treatments and trials are **questions to ask**, never “you qualify” / “you should take.”
8. Three questions for a 15-minute visit. Do not add screens that make the visit longer.
9. Spanish-first demo. First-gen, type 2 diabetes, GLP-1 gap.

### Taste (Amber has already rejected the opposite)

- Dark cinematic **landing** (lang + home). **Light, readable product screens** after that.
- No AI-generated family photos. No fake testimonials. No Ken Burns. No stock people.
- Human feeling comes from the visit itself (captions, “I have two more questions,” family note), not decoration.
- Fast, one job per screen, phone-first (`frontend/` is a phone shell).
- Logo is **two chairs** (one person seated, one empty seat, a span between them). Not a leaf/sprout/wellness mark.
- Copy is short, spoken, not legal-ese. If a sentence does two jobs, split it.

---

## Problem #3 — how we claim it

**Prompt:** Help patients looking for more treatments understand options; serious/rare conditions; cutting-edge trials or soon-to-be-approved.

**What we actually built:** Observability as *was the option even visible in the 15-minute visit?* GLP-1 exists; metformin was offered; she did not ask. Plus 1–2 studies as “worth asking / site decides,” not a 40-card matcher.

**Say in Q&A:** Most teams will show a trial list. We show why they never see the list: the visit.

Do **not** pivot the whole product to rare-disease trial search. Do **not** demo 40 melanoma trials.

---

## Screen flow (current)

`lang` → `home` → `visit` → `story` (optional) → `brief-q` → `brief-more` (optional) → `consent` → `live` → `after` → `after-note` → `after-gaps`

Router: `showScreen()` in `frontend/app.js`. `DARK_SCREENS = {lang, home}`.

| Screen | Job |
|---|---|
| lang | Language first. One tap. |
| home | “Don’t go in alone.” Get me ready / Run 2-min demo. |
| visit | Condition + what’s going on. **Load demo** fills Spanish diabetes patient. |
| story | Optional history (age, meds, etc.). Skip allowed. |
| brief-q | 3 questions. “I have two more questions.” One study card: worth asking, never “you qualify.” |
| brief-more | Waiting-room only: rights, treatments, trials (max 2), sources. |
| consent | Phone is not listening yet. Captions ≠ interpreter. Tell the doctor. |
| live | Captions / simulate / skip to end. Checklist. |
| after → note → gaps | Family note. Score. Unanswered questions. **Copy for the portal.** |

**Start over** is a labeled button top-right after language. Resets to `lang`.

Ask Bridge FAB is hidden on lang/home/visit/story/consent/live. Contextual chips on brief vs after.

---

## Signature demo (keep this)

Spanish-speaking first-gen, type 2 diabetes.

1. Language: Español.
2. Visit: **Load demo** (not Run 2-min demo from home — that skips the questions).
3. Get me ready. Land on brief-q.
4. Point at **GLP-1 question**. “Hold this. Newer options often are not offered unless you ask.”
5. I’m at my appointment → Play demo visit (or Simulate, ~15s).
6. Doctor: “I have another patient waiting.” She: “No, I don’t think so.”
7. Visit is over → Write it for my family → What never got asked.
8. **This is the company:** GLP-1 prepared, never asked. Copy for the portal. Daughter asks tonight.

Fixture: `backend/data/fixtures.py` (`DEMO_PATIENT`, `DEMO_TRANSCRIPT`, `FALLBACK_BRIEF`, `FALLBACK_RECAP`). The transcript is written so the gap is real.

If the app dies on stage: narrate that gap from the deck. Do not debug.

---

## Pitch materials (already exist — edit, don’t reinvent)

| File | What |
|---|---|
| `pitch/index.html` | 12-slide deck (the blue/purple/white version). Arrows/click, `F` fullscreen, `S` notes. Open `/pitch`. |
| `pitch/SPEECH.md` | 5-min script, 3-min cut, click path, Q&A, do-not-say list. |

Spine: scene (she has no questions) → 25.7M LEP → silence is not disinterest → not the doctor / not the interpreter → demo the gap → AWS in one breath → clinics + pharma pay → extra chair.

**Do not open with architecture.** Cut the AWS slide before you cut the demo.

### Stats that are sourced (don’t invent new ones)

- 25.7M US residents 5+ with LEP (~8%); Spanish 63% (KFF, 2021 ACS).
- LEP ~3× more likely uninsured (29% vs 9%).
- GLP-1 uptake lower in disadvantaged / minority groups despite higher diabetes burden (Diabetologia 2023). Silence ≠ disinterest.
- Section 1557: meaningful language access.

### Who pays (say it)

FQHC / safety-net: 1557 + visits that finish on time.  
Pharma: proof the option was even asked, in Spanish, in 15 minutes.  
Patients do not pay $20/month.

### Q&A short answers

- Replacing interpreters? No. 1557 still applies.
- Lotus? Opposite product. We never diagnose.
- HIPAA? Hackathon: in-memory. Production: BAA, no immigration data.
- Makes visits longer? No. Three questions.
- HealthOmics? Wrong job (genomics pipelines). We used Bedrock, Translate, Comprehend Medical.
- Scripted captions? Venue mics fail. Gap is the same.

### Never say

“AI doctor,” “we diagnose,” “we prescribe,” “we replace interpreters,” fake quotes, fake photos, a long AWS tour.

---

## Mercedes’ app vs this one

Live: https://bridge-sigma-nine.vercel.app/

Almost all Before/During/After there are placeholders. The **one live feature** is clinical-trial eligibility matching (criterion-by-criterion, ZIP, “worth asking,” never “you qualify”). Demo patient: melanoma Stage IV.

**Take (already partially in this app):** trial as a question; her safety copy; Ask chips; visible Load demo; portal copy on gaps.

**Do not take:** purple dashboard, named doctor, time-locked During, “possible conditions” (that is a diagnosis), 40 trial cards, PDF labs, identity.

Do not merge the two codebases. GitHub `main` stays hers.

---

## Stack

```
app/              Next.js App Router (pages + /api/*)
public/static/    phone UI assets (styles.css, app.js, i18n.js)
frontend/         source HTML/JS for the phone shell
lib/              config, sessions, LLM, research, agents
pitch/            10-slide deck, served at /pitch
backend/          previous FastAPI server (local-only fallback)
```

LLM: Anthropic HTTP → scripted fixtures.
Research: PubMed + ClinicalTrials.gov (no model key required).
AWS Bedrock / Translate / Comprehend Medical remain in the FastAPI tree for the original hackathon path. The Vercel app uses Anthropic + scripted twins so the demo never dies.
AWS used on purpose in the original FastAPI path: **Bedrock, Translate, Comprehend Medical.**
AWS **not** used: HealthOmics (genomics). Do not bolt it on.

Prep must **ground in what the user typed**. Never inject demo thirst / blurry vision into a visit about something else. Diabetes fixture only when the topic looks like diabetes or they tapped Load demo.

---

## What is done / what not to build next

**Done:** language-first flow, history, Ask Bridge, captions + scripted visit, gap check, family note, portal copy, trial-as-question (capped), extra-chair logo, pitch deck + speech, Start over, consent copy split into captions vs interpreter.

**Do not build:** AI doctor, HealthOmics, more screens, generated people, Lotus clone, interpreter replacement, accounts, PHI on disk.

**If you keep coding after the pitch, highest leverage:** keep the After loop tight (portal message already exists); do not grow eligibility matching into Mercedes’ 40-call OpenAI loop for the hackathon demo.

---

## Copy voice

Short. Spoken. First-gen. Polite people in a room that isn’t theirs.

Good: “The phone is not listening yet.” / “I have two more questions.” / “We are the extra chair.”  
Bad: “Nothing listens until you say yes” mashed with “this is not an interpreter” in the same breath. Two ideas, two sentences.

UI chrome lives in `frontend/i18n.js` (`en` + `es`). Briefs come from the model (or fixtures) in the chosen language. If you add a `data-i18n` key, add **both** languages or the kicker will scream the key name in caps (e.g. `STEPOF`).

---

## If you are asked to rewrite the speech or deck

Start from `pitch/SPEECH.md` and `pitch/index.html`. Keep 12 slides. Keep the GLP-1 gap as the only “company” moment. Match the extra-chair logo and black/white type. No gradients, no emoji, no stock photos.
