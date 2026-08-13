/** Live visit companion (FastAPI phone UI). Override in .env for a deployed URL. */
export const VISIT_APP_URL = (
  process.env.NEXT_PUBLIC_VISIT_APP_URL || "http://localhost:8000"
).replace(/\/$/, "");
