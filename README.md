# TrialLens

Compare a patient profile against currently recruiting clinical trials, one
eligibility criterion at a time — so a patient can walk into an appointment with
a focused list of questions.

TrialLens never tells anyone they qualify for a trial. It surfaces trials that
may be **worth asking your care team about**, and shows exactly which criteria a
site would still need information on. **Final eligibility is determined by the
trial site, not this tool.**

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Deploy target: Vercel
- **No database.** All state lives in React and a single URL param, so any view
  is shareable as a link.

## Routes

| Route         | Purpose                                         |
| ------------- | ----------------------------------------------- |
| `/`           | Profile intake form (with demo-patient prefill) |
| `/matches`    | Ranked results, streaming in as they land       |
| `/trial/[nct]`| Criterion-by-criterion breakdown                |
| `/questions`  | Generated question list + share link *(planned)*|

### API routes

- `GET /api/trials?cond=<condition>` — normalized recruiting trials from
  ClinicalTrials.gov.
- `POST /api/match` — one OpenAI call comparing a profile against one trial.

## Data source

[ClinicalTrials.gov API v2](https://clinicaltrials.gov/api/v2/studies) — no auth
required. Filtered to `overallStatus=RECRUITING` (values are case-sensitive
exact strings), `pageSize=40`.

Every array in the response (locations, phases) can be null or empty, so
`lib/clinicaltrials.ts` normalizes each study and guards every access. The
registry also escapes markdown characters in criteria text (`\>10 mg/day`);
those escapes are stripped so criteria display cleanly and can be quoted
verbatim.

## Matching

`/api/match` makes one OpenAI call per trial and returns strict JSON:

```json
{
  "verdict": "likely_eligible | needs_info | likely_ineligible",
  "inclusion": [{ "criterion": "…", "status": "met|not_met|unknown", "reason": "…" }],
  "exclusion": [{ "criterion": "…", "status": "triggered|clear|unknown", "reason": "…" }],
  "questionsForDoctor": ["…"]
}
```

Two rules the model is held to, and why they are enforced in code as well as in
the prompt:

- **Never infer a value that is not in the profile** — it must be `unknown`. If
  the model's own reason says the profile is unclear or silent, the parser and
  prompt both require `unknown` rather than `not_met`/`triggered`, so
  uncertainty never renders as a red "does not match."
- **Criteria are copied verbatim**, never paraphrased.

The parser in `lib/match.ts` also coerces status vocabularies, since models
sometimes reach for the inclusion vocabulary (`not_met`) on an exclusion item.

The client fans out over all trials with `Promise.allSettled` and renders each
card as its result lands.

## Ranking

Sorted by verdict (`likely_eligible` → `needs_info` → `likely_ineligible`), then
by distance from the patient ZIP to the nearest study site (haversine over
`LocationGeoPoint`). ZIPs are geocoded via zippopotam.us; trials with no
coordinates sort last rather than being dropped.

## Local development

```bash
npm install
cp .env.example .env.local   # then add your OPENAI_API_KEY
npm run dev
```

Open http://localhost:3000 and click **Load demo patient** to prefill a profile.

> Do not run `npm run build` while `next dev` is running — they share `.next`
> and the dev server will start throwing `MODULE_NOT_FOUND`.

## Deploying to Vercel

Import the repo, then set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) as
environment variables. No other configuration is needed.

## Disclaimer

TrialLens is an informational tool. It does not provide medical advice and does
not determine eligibility for any clinical trial.
