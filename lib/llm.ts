import { anthropicLive, llmLive, settings } from "./config";

export type LLMResult<T> = {
  data: T;
  source: "live" | "scripted" | "scripted_after_error";
  error: string | null;
};

const FENCE = /^\s*```(?:json)?\s*|\s*```\s*$/gm;

function stripFences(text: string) {
  return text.replace(FENCE, "").trim();
}

function extractJson(text: string) {
  const cleaned = stripFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const startCandidates = [cleaned.indexOf("{"), cleaned.indexOf("[")].filter((i) => i !== -1);
    const start = startCandidates.length ? Math.min(...startCandidates) : -1;
    if (start === -1) throw new Error("no JSON found in model response");
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

async function anthropicText(system: string, prompt: string, maxTokens: number, temperature: number) {
  const ctrl = AbortSignal.timeout(settings.requestTimeout * 1000);
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: ctrl,
    headers: {
      "content-type": "application/json",
      "x-api-key": settings.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: settings.anthropicModel,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}`);
  const body = (await resp.json()) as { content?: { type: string; text?: string }[] };
  return (body.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text || "")
    .join("\n")
    .trim();
}

export async function completeJson<T>(opts: {
  system: string;
  prompt: string;
  fallback: T;
  maxTokens?: number;
  temperature?: number;
}): Promise<LLMResult<T>> {
  if (!llmLive()) return { data: opts.fallback, source: "scripted", error: null };
  try {
    const text = await anthropicText(
      opts.system,
      opts.prompt,
      opts.maxTokens ?? 3000,
      opts.temperature ?? 0.2,
    );
    return { data: extractJson(text) as T, source: "live", error: null };
  } catch (err) {
    return {
      data: opts.fallback,
      source: "scripted_after_error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export { anthropicLive };
