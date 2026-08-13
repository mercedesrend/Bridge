"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { Icon } from "@/components/shell/Icon";
import { loadSavedHistory, saveSavedHistory } from "@/lib/savedHistory";
import type { VisitRecord } from "@/lib/types";

type DuringDraft = {
  duringVisitNotes: string;
  languageSupportPlan: string;
  visitTerms: string[];
  remainingQuestions: string[];
  duringKeyPoints: string;
};

function duringDraftFromVisit(visit: VisitRecord): DuringDraft {
  return {
    duringVisitNotes: visit.duringVisitNotes ?? "",
    languageSupportPlan: visit.languageSupportPlan ?? "",
    visitTerms: [...(visit.visitTerms ?? [])],
    remainingQuestions: [...(visit.remainingQuestions ?? [])],
    duringKeyPoints: visit.duringKeyPoints ?? "",
  };
}

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
      {children}
    </p>
  );
}

const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-[var(--brand)]";

export function DuringAppointmentWorkspace() {
  const [savedState, setSavedState] = useState(() => loadSavedHistory());
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<DuringDraft>(() => {
    const firstVisit = loadSavedHistory().visits[0];
    return firstVisit
      ? duringDraftFromVisit(firstVisit)
      : {
          duringVisitNotes: "",
          languageSupportPlan: "",
          visitTerms: [],
          remainingQuestions: [],
          duringKeyPoints: "",
        };
  });
  const [termInput, setTermInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  const visits = savedState.visits;
  const activeVisit =
    visits.find((visit) => visit.id === activeVisitId) ?? visits[0] ?? null;

  function commit(nextVisits: VisitRecord[]) {
    const nextState = { ...savedState, visits: nextVisits };
    setSavedState(nextState);
    saveSavedHistory(nextState);
  }

  function updateDraft<K extends keyof DuringDraft>(key: K, value: DuringDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveNotice("");
  }

  function addTerms(raw: string) {
    const next = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return;
    updateDraft("visitTerms", [
      ...draft.visitTerms,
      ...next.filter(
        (item) =>
          !draft.visitTerms.some(
            (existing) => existing.toLowerCase() === item.toLowerCase(),
          ),
      ),
    ]);
    setTermInput("");
  }

  function removeTerm(term: string) {
    updateDraft(
      "visitTerms",
      draft.visitTerms.filter((item) => item !== term),
    );
  }

  function addRemainingQuestions(raw: string) {
    const next = raw
      .split("\n")
      .flatMap((line) => line.split("?"))
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.endsWith("?") ? item : `${item}?`));
    if (!next.length) return;
    updateDraft("remainingQuestions", [
      ...draft.remainingQuestions,
      ...next.filter(
        (item) =>
          !draft.remainingQuestions.some(
            (existing) => existing.toLowerCase() === item.toLowerCase(),
          ),
      ),
    ]);
    setQuestionInput("");
  }

  function removeRemainingQuestion(question: string) {
    updateDraft(
      "remainingQuestions",
      draft.remainingQuestions.filter((item) => item !== question),
    );
  }

  function saveDuringVisit() {
    if (!activeVisit) return;
    const nextVisits = savedState.visits.map((visit) =>
      visit.id === activeVisit.id
        ? {
            ...visit,
            duringVisitNotes: draft.duringVisitNotes.trim(),
            languageSupportPlan: draft.languageSupportPlan.trim(),
            visitTerms: draft.visitTerms,
            remainingQuestions: draft.remainingQuestions,
            duringKeyPoints: draft.duringKeyPoints.trim(),
          }
        : visit,
    );
    commit(nextVisits);
    setSaveNotice("Live visit notes saved to this care timeline.");
  }

  const progressRows = useMemo(
    () => [
      {
        label: "Running notes",
        done: Boolean(draft.duringVisitNotes.trim()),
        detail: draft.duringVisitNotes.trim() || "Capture what is said in real time",
      },
      {
        label: "Language support",
        done: Boolean(draft.languageSupportPlan.trim()),
        detail:
          draft.languageSupportPlan.trim() ||
          "Interpreter reminders, phrases to use, or how to slow the room down",
      },
      {
        label: "Important terms",
        done: Boolean(draft.visitTerms.length),
        detail: draft.visitTerms.length
          ? draft.visitTerms.join(", ")
          : "Save medication names, test names, or other terms to look up later",
      },
      {
        label: "Remaining questions",
        done: Boolean(draft.remainingQuestions.length || draft.duringKeyPoints.trim()),
        detail:
          draft.remainingQuestions.length > 0
            ? `${draft.remainingQuestions.length} open question${draft.remainingQuestions.length === 1 ? "" : "s"}`
            : draft.duringKeyPoints.trim() || "Track what still needs answering before you leave",
      },
    ],
    [draft],
  );

  const completedCount = progressRows.filter((row) => row.done).length;

  if (!activeVisit) {
    return (
      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Icon name="pulse" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">
            Set up a care timeline first
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
            Bridge can only help in the room once there is a visit record to
            attach the notes to.
          </p>
          <Link
            href="/saved"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            <Icon name="bookmark" className="h-4 w-4" />
            Open Saved & Notes
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="pulse" className="h-3.5 w-3.5" />
          During Appointment
        </span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Real-time support in the room
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              This first version is manual on purpose: capture what you hear,
              note what still feels unclear, and keep a simple record you can
              bring into the follow-up conversation.
            </p>
          </div>
          <Link
            href="/saved"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            <Icon name="bookmark" className="h-4 w-4" />
            Open Saved & Notes
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            In the room with
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {activeVisit.doctor}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {activeVisit.specialty || "Specialty not added"}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Appointment
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {activeVisit.nextAppointment || "Time not saved"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {activeVisit.location || "Location not saved"}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Live progress
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {completedCount}/4
          </p>
          <p className="mt-1 text-sm text-slate-600">supports in place</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Care timeline</h2>
              <span className="text-xs text-[var(--muted)]">newest first</span>
            </div>

            <div className="mt-4 space-y-3">
              {visits.map((visit) => {
                const isActive = visit.id === activeVisit.id;
                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => {
                      setActiveVisitId(visit.id);
                      setDraft(duringDraftFromVisit(visit));
                      setSaveNotice("");
                    }}
                    className={`min-h-11 w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-[var(--line)] bg-white hover:border-[var(--brand)]/30"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {formatVisitDate(visit.date)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {visit.doctor}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {visit.nextAppointment || "No next appointment saved"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
              <span className="text-sm font-semibold text-[var(--brand)]">
                {completedCount} of 4 done
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {progressRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      row.done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-[var(--line-strong)] text-transparent"
                    }`}
                  >
                    <Icon name="check" className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{row.label}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-500">
                      {row.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Active visit
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeVisit.doctor}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {[activeVisit.specialty, activeVisit.location]
                    .filter(Boolean)
                    .join(" · ") || "Add specialty and location in Saved & Notes"}
                </p>
              </div>

              <button
                type="button"
                onClick={saveDuringVisit}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                <Icon name="check" className="h-4 w-4" />
                Save live notes
              </button>
            </div>

            {saveNotice ? (
              <div className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-slate-800">
                <Icon name="check" className="h-4 w-4 text-[var(--brand)]" />
                {saveNotice}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Running notes</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Write down the main point, not every word. Focus on tests,
              decisions, and anything you want repeated.
            </p>
            <textarea
              rows={8}
              value={draft.duringVisitNotes}
              onChange={(event) =>
                updateDraft("duringVisitNotes", event.target.value)
              }
              className={`${textareaClass} mt-5`}
              placeholder="What is the doctor saying, and what do you want to remember later?"
            />
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <SectionLabel>Language support</SectionLabel>
                <textarea
                  rows={6}
                  value={draft.languageSupportPlan}
                  onChange={(event) =>
                    updateDraft("languageSupportPlan", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="Interpreter reminders, phrases to use, or how you want to ask the doctor to slow down"
                />
              </div>

              <div>
                <SectionLabel>Key points before leaving</SectionLabel>
                <textarea
                  rows={6}
                  value={draft.duringKeyPoints}
                  onChange={(event) =>
                    updateDraft("duringKeyPoints", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="The main things you understood clearly before the visit ends"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Important terms
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Save medication names, test names, or unfamiliar words so you
                  can look them up later with Bridge.
                </p>

                <div className="mt-5 rounded-xl border border-[var(--line)] px-3 py-3 focus-within:border-[var(--brand)]">
                  <div className="flex flex-wrap gap-2">
                    {draft.visitTerms.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-sm text-slate-700"
                      >
                        {term}
                        <button
                          type="button"
                          onClick={() => removeTerm(term)}
                          className="text-slate-500 hover:text-slate-900"
                          aria-label={`Remove ${term}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={termInput}
                      onChange={(event) => setTermInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addTerms(termInput);
                        }
                      }}
                      onBlur={() => addTerms(termInput)}
                      placeholder={draft.visitTerms.length ? "" : "e.g. ANA titer"}
                      className="min-h-8 min-w-[10rem] flex-1 border-0 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Remaining questions
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Keep a short list of what still needs answering before you
                  leave the room.
                </p>

                <div className="mt-5 rounded-xl border border-[var(--line)] px-3 py-3 focus-within:border-[var(--brand)]">
                  <div className="flex flex-wrap gap-2">
                    {draft.remainingQuestions.map((question) => (
                      <span
                        key={question}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-sm text-slate-700"
                      >
                        {question}
                        <button
                          type="button"
                          onClick={() => removeRemainingQuestion(question)}
                          className="text-slate-500 hover:text-slate-900"
                          aria-label={`Remove ${question}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <textarea
                      rows={2}
                      value={questionInput}
                      onChange={(event) => setQuestionInput(event.target.value)}
                      onBlur={() => addRemainingQuestions(questionInput)}
                      onKeyDown={(event) => {
                        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                          event.preventDefault();
                          addRemainingQuestions(questionInput);
                        }
                      }}
                      placeholder={
                        draft.remainingQuestions.length
                          ? ""
                          : "Type a question and press Cmd/Ctrl + Enter to add it"
                      }
                      className="min-h-11 min-w-[14rem] flex-1 resize-none border-0 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <AskBridgeInlinePrompts
            title="Use Ask Bridge while the visit is happening"
            blurb="Ask Bridge to define a medical term, help you phrase a follow-up question, or turn a rushed explanation into simple language."
          />
        </div>
      </section>
    </div>
  );
}
