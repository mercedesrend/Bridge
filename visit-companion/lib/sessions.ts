export type History = {
  age_range?: string;
  other_conditions?: string;
  medications?: string;
  allergies?: string;
  family_history?: string;
};

export type Session = {
  id: string;
  created_at: string;
  language: string;
  reading_level: string;
  condition: string;
  symptoms: string;
  context: string;
  history: History;
  consent: { given: boolean; at: string; text_shown: string } | null;
  transcript: Record<string, unknown>[];
  chat: Record<string, unknown>[];
  audit: { at: string; action: string; detail: Record<string, unknown> }[];
  brief?: Record<string, unknown>;
  recap?: Record<string, unknown>;
};

export function nowIso() {
  return new Date().toISOString();
}

export function audit(session: Session, action: string, detail: Record<string, unknown> = {}) {
  session.audit.push({ at: nowIso(), action, detail });
}

const g = globalThis as typeof globalThis & { __bridgeSessions?: Map<string, Session> };
if (!g.__bridgeSessions) g.__bridgeSessions = new Map();

export function saveSession(session: Session) {
  g.__bridgeSessions!.set(session.id, session);
}

export function getSession(id: string, snapshot?: Session | null): Session | null {
  if (snapshot && snapshot.id === id) {
    g.__bridgeSessions!.set(id, snapshot);
    return snapshot;
  }
  return g.__bridgeSessions!.get(id) ?? null;
}

export function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
