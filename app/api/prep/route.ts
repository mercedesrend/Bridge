import { buildBrief } from "@/lib/agents/prep";
import { fail, ok } from "@/lib/http";
import { audit, newId, nowIso, saveSession, type Session } from "@/lib/sessions";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const condition = String(body?.condition || "").trim();
  if (condition.length < 2) return fail("condition is required");
  const session: Session = {
    id: newId(),
    created_at: nowIso(),
    language: body.language || "en",
    reading_level: body.reading_level || "simple",
    condition,
    symptoms: body.symptoms || "",
    context: body.context || "",
    history: body.history || {},
    consent: null,
    transcript: [],
    chat: [],
    audit: [],
  };
  saveSession(session);
  audit(session, "session_created", {
    condition,
    language: session.language,
    reading_level: session.reading_level,
  });
  const brief = await buildBrief({
    condition,
    language: session.language,
    reading_level: session.reading_level,
    symptoms: session.symptoms,
    context: session.context,
    history: session.history,
  });
  session.brief = brief;
  const meta = (brief._meta || {}) as Record<string, unknown>;
  audit(session, "brief_generated", {
    papers: meta.papers_found,
    trials: meta.trials_found,
    llm_source: meta.llm_source,
  });
  return ok({ session_id: session.id, brief, audit: session.audit }, session);
}
