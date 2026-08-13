import { FALLBACK_RECAP, formatHistory, languageName } from "@/lib/data";
import { completeJson } from "@/lib/llm";

const SYSTEM = `You write after-visit summaries for patients, in their own language.

Hard rules:
- Use ONLY what was actually said in the transcript. Never add a diagnosis, a \
dose, an instruction, or a reassurance that was not spoken. If something was \
unclear or never stated, say so plainly rather than filling the gap.
- Do not give medical advice of your own. You are reporting what happened.
- For unanswered questions, do not answer them yourself — say how and when to \
follow up.
- On second opinions: only suggest one when the transcript shows a genuine \
reason (a serious diagnosis with no options discussed, a plan the patient said \
they did not understand, or a question left open that materially affects care). \
Do not suggest one reflexively — that erodes trust in the doctor for no reason.
- Output valid JSON only. No prose, no markdown fences.`;

const SCHEMA = `{
  "headline": "one sentence: what happened at this visit",
  "family_note": "a short paragraph a patient can forward to family, in their language",
  "what_was_decided": [{"item": "", "detail": ""}],
  "medications": [{"name": "", "dose": "", "frequency": "", "instructions": "", "watch_for": ""}],
  "unanswered_questions": [{"question": "", "why_it_matters": "", "how_to_follow_up": ""}],
  "next_steps": [{"step": "", "when": ""}],
  "second_opinion": {"worth_considering": false, "reasoning": ""},
  "places_to_go": [{"place": "", "kind": "today|referral|followup|trial", "why": "", "how": ""}]
}`;

export async function buildRecap(opts: {
  transcript: Record<string, unknown>[];
  preparedQuestions?: Record<string, unknown>[];
  language?: string;
  condition?: string;
  history?: Record<string, string> | null;
  context?: string;
}) {
  const language = opts.language || "en";
  const prepared = opts.preparedQuestions || [];
  const convo = opts.transcript.map((t) => `[${t.speaker || "?"}]: ${t.text || ""}`).join("\n");
  const prepped = prepared.map((q) => `- ${q.question || ""}`).join("\n") || "(none recorded)";
  const prompt = `WRITE THE ENTIRE OUTPUT IN: ${languageName(language)}
CONDITION DISCUSSED: ${opts.condition || "(not specified)"}
BACKGROUND THEY SHARED BEFORE THE VISIT (for tone only — do not add medical facts that were not spoken):
${formatHistory(opts.history) || "(none)"}
CONTEXT: ${opts.context || "(none)"}

QUESTIONS THE PATIENT PREPARED BEFORE THE VISIT:
${prepped}

WHAT WAS ACTUALLY SAID:
${convo}

Tasks:
1. Summarize what was decided, using only what was said.
2. List medications exactly as stated — dose, frequency, instructions. If a \
detail was never stated, write "not stated in the visit" rather than guessing.
3. GAP CHECK: go through the prepared questions one by one and identify which \
were never answered in the conversation. These go in unanswered_questions.
4. Give concrete next steps with rough timing.
5. Judge whether a second opinion is genuinely warranted, per your rules.
6. List places_to_go: pharmacy, referred clinics, specialists, or how to follow \
up — only from what was said, plus the front desk / portal for unanswered questions.
7. Write family_note: a forwardable paragraph for the people who help this \
patient decide — what happened, what to take, what still needs asking.

Return JSON matching exactly this shape:
${SCHEMA}`;

  const result = await completeJson({
    system: SYSTEM,
    prompt,
    fallback: FALLBACK_RECAP,
    maxTokens: 3500,
  });
  const recap = { ...(result.data as Record<string, unknown>) };
  if (result.source !== "live") {
    if (!recap.places_to_go) recap.places_to_go = FALLBACK_RECAP.places_to_go;
    if (!recap.family_note) recap.family_note = FALLBACK_RECAP.family_note;
  }
  recap._meta = {
    llm_source: result.source,
    llm_error: result.error,
    turns_analyzed: opts.transcript.length,
    questions_checked: prepared.length,
    language,
  };
  return recap;
}
