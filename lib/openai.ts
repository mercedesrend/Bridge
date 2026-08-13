// Server-only model client singleton.
//
// Speaks the OpenAI API, but the key may be either a direct OpenAI key or an
// OpenRouter one — OpenRouter is wire-compatible and only differs in the base
// URL and in requiring vendor-namespaced model ids ("openai/gpt-4.1-nano").
import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let client: OpenAI | null = null;

interface Provider {
  apiKey: string;
  baseURL?: string;
  isOpenRouter: boolean;
}

/**
 * Deliberately does not throw on a missing key: the model ids below are
 * resolved at import time, and a build with no key set must still succeed.
 * Either the dedicated variable or an sk-or- prefixed key means OpenRouter, so
 * pasting an OpenRouter key into OPENAI_API_KEY also works.
 */
function usingOpenRouter(): boolean {
  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  return Boolean(process.env.OPENROUTER_API_KEY) || apiKey.startsWith("sk-or-");
}

function resolveProvider(): Provider {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No model API key is set — set OPENROUTER_API_KEY (or OPENAI_API_KEY)",
    );
  }

  const isOpenRouter = usingOpenRouter();
  return {
    apiKey,
    baseURL:
      process.env.OPENAI_BASE_URL ||
      (isOpenRouter ? OPENROUTER_BASE_URL : undefined),
    isOpenRouter,
  };
}

export function getOpenAI(): OpenAI {
  if (!client) {
    const { apiKey, baseURL, isOpenRouter } = resolveProvider();
    client = new OpenAI({
      apiKey,
      baseURL,
      // OpenRouter uses these for dashboard attribution; harmless elsewhere.
      defaultHeaders: isOpenRouter
        ? {
            "HTTP-Referer": process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000",
            "X-Title": "Bridge",
          }
        : undefined,
    });
  }
  return client;
}

/**
 * OpenRouter rejects bare model names, so qualify anything unnamespaced with
 * the vendor. A configured id that already carries a vendor is left alone.
 */
function modelId(name: string): string {
  return usingOpenRouter() && !name.includes("/") ? `openai/${name}` : name;
}

export const MATCH_MODEL = modelId(process.env.OPENAI_MODEL || "gpt-4.1-nano");

// Ask Bridge writes prose rather than JSON, so it can be pointed at a larger
// model than matching uses — but default to the same one the key is known to
// have access to.
export const ASK_MODEL = modelId(
  process.env.OPENAI_ASK_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-nano",
);
