import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/sessions";

export function fail(detail: string, status = 400) {
  return NextResponse.json({ detail }, { status });
}

export function ok(data: Record<string, unknown>, session?: Session) {
  return NextResponse.json(session ? { ...data, session } : data);
}

export function sessionFrom(body: { session_id?: string; session?: Session }, required = true) {
  const id = body.session_id || body.session?.id;
  if (!id) return required ? { error: fail("Session not found. Start a new one.", 404) } : { session: null };
  const session = getSession(id, body.session || null);
  if (!session) {
    if (!required) return { session: null };
    return { error: fail("Session not found. Start a new one.", 404) };
  }
  return { session };
}
