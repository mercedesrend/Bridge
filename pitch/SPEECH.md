# Bridge — what to say

Open the deck: `pitch/index.html` (or http://localhost:8000/pitch).
Arrows or click to advance. `F` fullscreen. `S` speaker notes. `?notes=1` to rehearse with notes on.

Two windows on stage: **deck on the projector**, **phone UI on the laptop** (Chrome, http://localhost:8000). Switch to the laptop on slide 7.

Set `FORCE_SCRIPTED=true` in `backend/.env` before you walk in. The demo must not wait on wifi.

---

## Stage setup (5 minutes before)

1. Backend running. Chrome only.
2. On the phone: tap **Español** → Continue.
3. Home → **Get me ready**.
4. Visit: type `type 2 diabetes` (or click the hidden Load demo if you still have it wired). Continue.
5. Health story: leave it. **Get me ready**. Wait on the 3-questions screen.
6. Confirm question #2 is on screen: *¿Soy candidata… GLP-1…?*
7. Deck on slide 1, fullscreen. Notes off unless you want them on a second screen.

If anything is slow, skip the form: Home → **Run 2-min demo**. You will land in captions, not on the questions — so say question #2 out loud before you press it.

---

## 5 minutes (the one to give)

Times are a ceiling. If you run long, cut the AWS slide, not the demo.

### Slide 1 — title · 10s

We’re Amber and Mercedes. This is Bridge.

### Slide 2 — the visit · 25s

Most visits in this country are fifteen minutes.

A woman sits down. English is her second language. The doctor confirms type 2 diabetes, starts metformin, looks at the door, and says: I have another patient waiting. Any other questions?

She says: No. I don’t think so.

That is not confusion. That is being a good guest in a room that isn’t hers.

*(pause)*

### Slide 3 — 25.7 million · 15s

Twenty-five million people in the United States get care in a language that is not theirs. Spanish is two-thirds of them.

They leave with a plan they did not fully hear. They decide with family after — in a language the chart never used.

### Slide 4 — observability · 25s

This is also a pharma problem.

GLP-1 medicines exist. Uptake is lower in the people with the highest diabetes burden. Not because they refused. Because the question never came up.

You cannot observe a treatment you never offered. Silence is not disinterest.

That is why we built this.

### Slide 5 — not the doctor · 20s

We are not an AI doctor. We never diagnose. We never prescribe.

We are not a certified interpreter. By law she still gets one, for free. We sit next to that person.

We are the extra chair — so she leaves having asked about the treatment she would otherwise never be offered.

### Slide 6 — three beats · 20s

Before the visit: three questions. Not a binder.

In the room: captions in her language, and a sentence she can say out loud — I have two more questions.

After: a note she can send to her daughter. And the questions that never got asked.

### Slide 7 — demo · ~2 minutes

Let me show you the room.

*(switch to the phone. stop talking for a beat.)*

**On the 3-questions screen**

This is what she walks in with. Three questions, because the visit is fifteen minutes.

*(point at #2)*

Hold this one. *Am I a candidate for a GLP-1 medicine, or is metformin the right first step?* Newer options often are not offered unless you ask.

**Tap I’m at my appointment → Play demo visit** (or Simulate, then let it run — about 15 seconds)

Consent is a real gate. Captions do not turn on until she says yes. This is not a replacement for an interpreter.

*(when the A1C line appears)* Toggle **Plain words** / **Said**. He said 8.2. The phone unpacked it in Spanish.

*(last two lines)* He says another patient is waiting. She says she has no questions. That is the visit.

**The visit is over → Write it for my family → What never got asked**

*(point at the GLP-1 gap. this is the whole talk. let them read it.)*

She prepared it. She never asked it. Bridge caught the gap. Tonight her daughter asks.

### Slide 8 — the gap · 15s

That 90 seconds is the company. Everything else is setup.

### Slide 9 — AWS · 20s

Amazon Bedrock writes the brief and the family note. Amazon Translate does captions that cannot wait on a model. Comprehend Medical pulls the jargon out of what the doctor actually said.

We did not bolt on HealthOmics. That is a genomics pipeline. This is a 15-minute visit.

Sessions die with the process. No name. No immigration questions.

### Slide 10 — close · 20s

Safety-net clinics pay for language access and visits that finish on time.

Pharma pays for proof the option was even asked — in Spanish, in fifteen minutes.

We are not the doctor. We are not the interpreter. We are the extra chair.

Thank you.

---

## If they cut you to 3 minutes

Keep slides 2, 4, 5, 7, 10.

Say the scene (slide 2). Say silence is not disinterest (slide 4). Draw the boundary (slide 5). Demo: point at GLP-1, Skip to end, open the gap. Close on extra chair.

Do not open with the 25.7 million slide if you are short. The scene does more work.

---

## If the app dies

Stay on slide 7 and narrate. You already have the lines:

- She prepared: am I a candidate for a GLP-1.
- Doctor: another patient waiting.
- She: I don’t think so.
- After: that question is still open. Send it to your daughter.

Then jump to slide 10. Do not debug on stage.

---

## Q&A — answer then stop

**Are you replacing interpreters?**
No. Section 1557 still requires meaningful access. Captions are a comprehension aid. The rights card says the interpreter is free. Clinics will block us if we pretend otherwise.

**How is this not Lotus?**
Lotus is an AI doctor. We never diagnose. Different product, different liability, different buyer.

**HIPAA?**
Hackathon: in-memory sessions, nothing at rest. Production: BAA, no immigration data, phone-held. We are not a medical record.

**Does this make the visit longer?**
No. Three questions. The line is “I have two more questions,” not a new conversation. If we add time, the clinic bans the phone.

**Who pays?**
Beachhead: FQHC / safety-net, language access. Second check: pharma, treatment observability for GLP-1 and the next class.

**Is translation clinically validated?**
Not yet. The UI says so. That is why we do not replace the interpreter.

**Why scripted captions?**
Venue mics fail. Every live path has a scripted twin. Bedrock when we can; fixture when we can’t. The gap is the same.

**Why not HealthOmics?**
Wrong job. HealthOmics is genomics pipelines. We used Bedrock, Translate, and Comprehend Medical because they make a 15-minute visit faster, not because they were on the poster.

**Outcomes?**
The metric is high-priority questions asked, and portal follow-ups sent. Today you see the score on the After screen: prepared vs still open.

**STT?**
Browser speech-to-text in Chrome. On stage we simulate. Production path is medical-grade transcription.

---

## Do not say

- “AI doctor,” “we diagnose,” “we prescribe.”
- “We replace interpreters.”
- “HealthOmics” unless someone asks, and then only to say we did not use it.
- A long AWS architecture tour. Three services, then sit down.
- Fake testimonials, fake photos, fake numbers.
- “We’re excited to present.” Start in the room.
