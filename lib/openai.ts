import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let client: OpenAI | null = null;

function usingOpenRouter() {
  const apiKey =
    process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "";
  return Boolean(process.env.OPENROUTER_API_KEY) || apiKey.startsWith("sk-or-");
}

export function resolveModelId(name: string) {
  return usingOpenRouter() && !name.includes("/") ? `openai/${name}` : name;
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "No model API key is set. Add OPENROUTER_API_KEY or OPENAI_API_KEY."
    );
  }

  if (!client) {
    const isOpenRouter = usingOpenRouter();
    client = new OpenAI({
      apiKey,
      baseURL:
        process.env.OPENAI_BASE_URL ||
        (isOpenRouter ? OPENROUTER_BASE_URL : undefined),
      defaultHeaders: isOpenRouter
        ? {
            "HTTP-Referer": process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000",
            "X-Title": "Bridge"
          }
        : undefined
    });
  }

  return client;
}
