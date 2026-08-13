import { buildRecap } from "@/lib/agents/recap";
import { fail, ok, sessionFrom } from "@/lib/http";
import { audit, saveSession } from "@/lib/sessions";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const found = sessionFrom(body);
  if ("error" in found && found.error) return found.error;
  const session = found.session!;
  if (!session.transcript.length) return fail("No conversation recorded for this session yet.");
  const prepared = ((session.brief || {}).questions as Record<string, unknown>[]) || [];
  const recap = await buildRecap({
    transcript: session.transcript,
    preparedQuestions: prepared,
    language: session.language,
    condition: session.condition,
    history: session.history,
    context: session.context,
  });
  session.recap = recap;
  const meta = (recap._meta || {}) as Record<string, unknown>;
  audit(session, "recap_generated", {
    llm_source: meta.llm_source,
    gaps_found: ((recap.unanswered_questions as unknown[]) || []).length,
  });
  saveSession(session);
  return ok({ recap, audit: session.audit }, session);
}
