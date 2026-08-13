import { answerQuestion } from "@/lib/agents/tutor";
import { fail, ok, sessionFrom } from "@/lib/http";
import { audit, nowIso, saveSession } from "@/lib/sessions";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  if (!message) return fail("message is required");
  const found = body.session_id || body.session ? sessionFrom(body, false) : { session: null };
  if ("error" in found && found.error) return found.error;
  const session = found.session || null;
  const language = session?.language || body.language || "en";
  const brief = (session?.brief || {}) as Record<string, unknown>;
  const reply = await answerQuestion({
    message,
    language,
    condition: session?.condition || "",
    symptoms: session?.symptoms || "",
    context: session?.context || "",
    history: session?.history,
    briefSummary: String(brief.plain_summary || ""),
    chatHistory: session?.chat,
  });
  const turn = {
    at: nowIso(),
    question: message,
    answer: reply.answer || "",
    related_questions: reply.related_questions || [],
    ask_your_doctor: reply.ask_your_doctor || "",
    source: ((reply._meta as Record<string, unknown>) || {}).llm_source,
  };
  if (session) {
    session.chat.push(turn);
    audit(session, "ask_bridge", { preview: message.slice(0, 80) });
    saveSession(session);
    return ok({ reply, audit: session.audit }, session);
  }
  return ok({ reply, audit: [] });
}
