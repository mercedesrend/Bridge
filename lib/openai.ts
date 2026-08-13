// Server-only OpenAI client singleton.
import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export const MATCH_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-nano";

// Ask Bridge writes prose rather than JSON, so it can be pointed at a larger
// model than matching uses — but default to the same one the key is known to
// have access to.
export const ASK_MODEL =
  process.env.OPENAI_ASK_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-nano";
