export type ModeReport = {
  llm: string;
  model: string | null;
  research: string;
  brightdata: string;
  translate: string;
  comprehend_medical: string;
  force_scripted: boolean;
  region: string;
};

function env(name: string, fallback = "") {
  return process.env[name] || fallback;
}

export const settings = {
  awsRegion: env("AWS_REGION", env("AWS_DEFAULT_REGION", "us-east-1")),
  anthropicApiKey: env("ANTHROPIC_API_KEY"),
  anthropicModel: env("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
  ncbiApiKey: env("NCBI_API_KEY"),
  contactEmail: env("CONTACT_EMAIL", "hackathon@example.com"),
  forceScripted: env("FORCE_SCRIPTED", "false").toLowerCase() === "true",
  requestTimeout: Number(env("REQUEST_TIMEOUT", "30")),
  maxStudies: Number(env("MAX_STUDIES", "6")),
};

export function anthropicLive() {
  return Boolean(settings.anthropicApiKey) && !settings.forceScripted;
}

export function llmLive() {
  return anthropicLive();
}

export function researchLive() {
  return !settings.forceScripted;
}

export function modeReport(): ModeReport {
  return {
    llm: anthropicLive() ? "live" : "scripted",
    model: anthropicLive() ? settings.anthropicModel : null,
    research: researchLive() ? "live" : "scripted",
    brightdata: "scripted",
    translate: "scripted",
    comprehend_medical: "scripted",
    force_scripted: settings.forceScripted,
    region: settings.awsRegion,
  };
}
