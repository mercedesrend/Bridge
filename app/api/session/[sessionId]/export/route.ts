import { ok, sessionFrom } from "@/lib/http";
import { nowIso } from "@/lib/sessions";

export const dynamic = "force-dynamic";

function payload(session: NonNullable<ReturnType<typeof sessionFrom>["session"]>) {
  return {
    session_id: session.id,
    created_at: session.created_at,
    condition: session.condition,
    language: session.language,
    history: session.history,
    consent: session.consent,
    brief: session.brief,
    transcript: session.transcript,
    recap: session.recap,
    chat: session.chat,
    audit: session.audit,
    generated_at: nowIso(),
    disclaimer:
      "This is an informational summary generated from a recorded conversation. It is not a medical record and not medical advice. Confirm anything important with your care team.",
  };
}

export async function GET(_req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const found = sessionFrom({ session_id: sessionId });
  if ("error" in found && found.error) return found.error;
  return ok(payload(found.session!));
}

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const found = sessionFrom({ ...body, session_id: sessionId });
  if ("error" in found && found.error) return found.error;
  return ok(payload(found.session!), found.session!);
}
