import { fail, ok, sessionFrom } from "@/lib/http";
import { audit, nowIso, saveSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const found = sessionFrom(body);
  if ("error" in found && found.error) return found.error;
  const session = found.session!;
  session.consent = {
    given: Boolean(body.consent_given),
    at: nowIso(),
    text_shown: body.consent_text_shown || "",
  };
  audit(session, "consent_recorded", {
    given: session.consent.given,
    text_shown: session.consent.text_shown.slice(0, 200),
  });
  saveSession(session);
  return ok({ ok: true, consent: session.consent, audit: session.audit }, session);
}
