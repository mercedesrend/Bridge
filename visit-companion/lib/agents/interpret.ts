import { FALLBACK_TRANSLATIONS, languageName } from "@/lib/data";
import { completeJson } from "@/lib/llm";

const SYSTEM = `You help a patient follow what is being said in their medical \
appointment, in real time.

For each line of the conversation you produce:
1. translation — a faithful translation into the patient's language. Translate \
meaning, not word-for-word. Never soften, omit, or add medical content.
2. plain — the same line with jargon unpacked, in the patient's language. If \
a number or medical term appears (A1C, mg, retinal exam), say what it means in \
everyday words.

Never add advice, reassurance, or interpretation that the speaker did not say. \
If a line is already simple, \`plain\` may repeat the translation.

Output valid JSON only. No prose, no markdown fences.`;

export const INTERPRET_DISCLAIMER =
  "This is a comprehension aid, not a certified medical interpreter. You have the right to a professional interpreter at no cost — you can ask for one.";

function fallbackFor(turns: Record<string, unknown>[], language: string) {
  return turns.map((turn, i) => {
    const target = turn.lang !== language ? language : "en";
    const table = FALLBACK_TRANSLATIONS[target] || {};
    const text = String(turn.text || "");
    const translation = table[text] || text;
    return { index: turn.index ?? i, translation, plain: translation, terms: [] };
  });
}

export async function interpretTurns(turns: Record<string, unknown>[], language = "es") {
  if (!turns.length) return { turns: [], source: "scripted", disclaimer: INTERPRET_DISCLAIMER };
  const indexed = turns.map((t, i) => ({ ...t, index: i })) as (Record<string, unknown> & { index: number })[];
  const lines = indexed
    .map((t) => `${t.index}. [${t.speaker}, spoken in ${t.lang || "en"}]: ${t.text}`)
    .join("\n");
  const prompt = `PATIENT'S LANGUAGE: ${languageName(language)}

CONVERSATION SO FAR:
${lines}

For every line above, return an entry. If a line was spoken in the patient's \
own language, translate it to English instead (so the record is complete both \
ways), and keep \`plain\` in the patient's language.

Also list any medical terms or numbers worth explaining, with a one-line \
everyday meaning in the patient's language.

Return JSON:
{"turns": [{"index": 0, "translation": "", "plain": "", "terms": [{"term": "", "means": ""}]}]}`;

  const result = await completeJson({
    system: SYSTEM,
    prompt,
    fallback: { turns: fallbackFor(indexed, language) },
    maxTokens: 4000,
  });
  const data = (result.data || {}) as { turns?: Record<string, unknown>[] };
  const entries = data.turns || fallbackFor(indexed, language);
  const byIndex = Object.fromEntries(entries.map((e, i) => [e.index ?? i, e]));
  const merged = indexed.map((turn) => {
    const entry = byIndex[turn.index as number] || {};
    return {
      ...turn,
      translation: entry.translation || turn.text,
      plain: entry.plain || entry.translation || turn.text,
      terms: entry.terms || [],
    };
  });
  return {
    turns: merged,
    source: result.source,
    error: result.error,
    disclaimer: INTERPRET_DISCLAIMER,
  };
}
