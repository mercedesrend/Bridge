import { interpretTurns } from "@/lib/agents/interpret";
import { DEMO_TRANSCRIPT } from "@/lib/data";
import { fail, ok, sessionFrom } from "@/lib/http";
import { audit, saveSession } from "@/lib/sessions";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const found = sessionFrom(body);
  if ("error" in found && found.error) return found.error;
  const session = found.session!;
  if (!session.consent?.given) {
    return fail("Recording consent has not been given for this session.", 403);
  }

  if (body.append) {
    if (!body.turns?.length) return fail("No conversation turns supplied.");
    const result = await interpretTurns(body.turns, session.language);
    session.transcript.push(...result.turns);
    audit(session, "turns_interpreted", {
      count: result.turns.length,
      llm_source: result.source,
      scripted: false,
      stt: true,
    });
    saveSession(session);
    return ok(
      {
        turns: result.turns,
        source: result.source,
        disclaimer: result.disclaimer,
        total_turns: session.transcript.length,
        audit: session.audit,
      },
      session,
    );
  }

  const turns = body.use_demo_transcript ? DEMO_TRANSCRIPT : body.turns || [];
  if (!turns.length) return fail("No conversation turns supplied.");
  const fromIndex = Number(body.from_index || 0);
  const slice = turns.slice(fromIndex);
  const result = await interpretTurns(slice, session.language);
  session.transcript = [...turns.slice(0, fromIndex), ...result.turns];
  audit(session, "turns_interpreted", {
    count: result.turns.length,
    llm_source: result.source,
    scripted: Boolean(body.use_demo_transcript),
  });
  saveSession(session);
  return ok(
    {
      turns: result.turns,
      source: result.source,
      disclaimer: result.disclaimer,
      total_turns: session.transcript.length,
      audit: session.audit,
    },
    session,
  );
}
