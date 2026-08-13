"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { openAskBridge } from "@/components/ask/openAskBridge";
import { Icon } from "@/components/shell/Icon";
import { loadSavedHistory, saveSavedHistory } from "@/lib/savedHistory";
import type { VisitRecord } from "@/lib/types";

type SecondOpinionDraft = {
  reasons: string[];
  recordsRequestPlan: string;
  specialistSearchNotes: string;
  questions: string[];
};

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function draftFromVisit(visit: VisitRecord | null): SecondOpinionDraft {
  return {
    reasons: [...(visit?.secondOpinionReasons ?? [])],
    recordsRequestPlan: visit?.recordsRequestPlan ?? "",
    specialistSearchNotes: visit?.specialistSearchNotes ?? "",
    questions: [...(visit?.secondOpinionQuestions ?? [])],
  };
}

const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-[var(--brand)]";

export function SecondOpinionsWorkspace() {
  const [savedState, setSavedState] = useState(() => loadSavedHistory());
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<SecondOpinionDraft>(() =>
    draftFromVisit(loadSavedHistory().visits[0] ?? null),
  );
  const [status, setStatus] = useState("");

  const visits = savedState.visits;
  const activeVisit =
    visits.find((visit) => visit.id === activeVisitId) ?? visits[0] ?? null;

  function commit(nextVisits: VisitRecord[]) {
    const nextState = { ...savedState, visits: nextVisits };
    setSavedState(nextState);
    saveSavedHistory(nextState);
  }

  function updateDraft<K extends keyof SecondOpinionDraft>(
    key: K,
    value: SecondOpinionDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  function saveSecondOpinionPlan() {
    if (!activeVisit) return;
    const cleaned = {
      reasons: draft.reasons.map((reason) => reason.trim()).filter(Boolean),
      recordsRequestPlan: draft.recordsRequestPlan.trim(),
      specialistSearchNotes: draft.specialistSearchNotes.trim(),
      questions: draft.questions.map((question) => question.trim()).filter(Boolean),
    };

    const nextVisits = savedState.visits.map((visit) =>
      visit.id === activeVisit.id
        ? {
            ...visit,
            secondOpinionReasons: cleaned.reasons,
            recordsRequestPlan: cleaned.recordsRequestPlan,
            specialistSearchNotes: cleaned.specialistSearchNotes,
            secondOpinionQuestions: cleaned.questions,
          }
        : visit,
    );

    commit(nextVisits);
    setDraft(cleaned);
    setStatus("Second-opinion plan saved to this visit.");
  }

  const progressRows = useMemo(
    () => [
      {
        label: "When a second opinion helps",
        done: draft.reasons.length > 0,
        detail: draft.reasons.length
          ? `${draft.reasons.length} reason${draft.reasons.length === 1 ? "" : "s"} captured`
          : "Capture what feels unresolved or worth checking",
      },
      {
        label: "How to request records",
        done: Boolean(draft.recordsRequestPlan.trim()),
        detail:
          draft.recordsRequestPlan.trim() || "List which notes, labs, or scans you need",
      },
      {
        label: "Finding specialists near you",
        done: Boolean(draft.specialistSearchNotes.trim()),
        detail:
          draft.specialistSearchNotes.trim() || "Write what kind of specialist or center you want to look for",
      },
      {
        label: "Preparing for the consult",
        done: draft.questions.length > 0,
        detail: draft.questions.length
          ? `${draft.questions.length} consult question${draft.questions.length === 1 ? "" : "s"} saved`
          : "Draft the questions you want answered in another consult",
      },
    ],
    [draft],
  );

  if (!activeVisit) {
    return (
      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Icon name="users" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">
            Start with a visit record
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
            Add a visit in Saved & Notes first, then build a second-opinion plan
            around the questions or uncertainty that came out of that visit.
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
          <Icon name="users" className="h-3.5 w-3.5" />
          Second Opinions
        </span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Know when to ask
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Another perspective is normal. Use this page to capture why you
              want one, what records to gather, who to look for, and what you
              want the second doctor to answer.
            </p>
          </div>
          <button
            type="button"
            onClick={saveSecondOpinionPlan}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            <Icon name="check" className="h-4 w-4" />
            Save plan
          </button>
        </div>
      </section>

      {status ? (
        <div className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-slate-800">
          <Icon name="check" className="h-4 w-4 text-[var(--brand)]" />
          {status}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Reasons captured
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {draft.reasons.length}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Records plan
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {draft.recordsRequestPlan.trim() ? "Ready" : "Start"}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Consult questions
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {draft.questions.length}
          </p>
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
                      setDraft(draftFromVisit(visit));
                      setStatus("");
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
                      {visit.specialty || "Specialty not added"}
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
                {progressRows.filter((row) => row.done).length} of 4 done
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
                onClick={() =>
                  openAskBridge("Help me decide if this is a good time to ask for a second opinion")
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]"
              >
                <Icon name="sparkle" className="h-4 w-4 text-[var(--brand)]" />
                Ask Bridge
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              When a second opinion helps
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Write the reasons in your own words. You do not need to justify
              asking for another perspective.
            </p>
            <textarea
              rows={5}
              value={draft.reasons.join("\n")}
              onChange={(event) =>
                updateDraft(
                  "reasons",
                  event.target.value
                    .split("\n")
                    .map((reason) => reason.trim())
                    .filter(Boolean),
                )
              }
              className={`${textareaClass} mt-5`}
              placeholder="One reason per line"
            />
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-slate-800">
                  How to request records
                </span>
                <textarea
                  rows={6}
                  value={draft.recordsRequestPlan}
                  onChange={(event) =>
                    updateDraft("recordsRequestPlan", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="Which notes, labs, imaging, or medication lists do you need before another consult?"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-slate-800">
                  Finding specialists near you
                </span>
                <textarea
                  rows={6}
                  value={draft.specialistSearchNotes}
                  onChange={(event) =>
                    updateDraft("specialistSearchNotes", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="What kind of doctor, center, or expertise are you looking for?"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Preparing for the consult
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Draft the questions you want the second doctor to answer clearly.
            </p>
            <textarea
              rows={5}
              value={draft.questions.join("\n")}
              onChange={(event) =>
                updateDraft(
                  "questions",
                  event.target.value
                    .split("\n")
                    .map((question) => question.trim())
                    .filter(Boolean),
                )
              }
              className={`${textareaClass} mt-5`}
              placeholder="One question per line"
            />
          </section>

          <AskBridgeInlinePrompts
            title="Use Ask Bridge to prepare for another perspective"
            blurb="Ask Bridge how to request records, what to bring to a second-opinion visit, or how to explain what still feels unresolved."
          />
        </div>
      </section>
    </div>
  );
}
