import { ok, sessionFrom } from "@/lib/http";
import { nowIso } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const found = sessionFrom({ session_id: sessionId });
  if ("error" in found && found.error) return found.error;
  return ok(found.session as unknown as Record<string, unknown>);
}

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const found = sessionFrom({ ...body, session_id: sessionId });
  if ("error" in found && found.error) return found.error;
  const session = found.session!;
  return ok(session as unknown as Record<string, unknown>, session);
}
