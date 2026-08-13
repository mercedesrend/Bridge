"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { Icon } from "@/components/shell/Icon";
import { appointmentLabelFromVisit } from "@/lib/appointments";
import { loadSavedHistory, saveSavedHistory } from "@/lib/savedHistory";
import type { VisitRecord } from "@/lib/types";

type BeforeDraft = {
  symptomsDiscussed: string[];
  preVisitNotes: string;
  possibleConditions: string;
  questionsForDoctor: string[];
  whatToExpectNotes: string;
};

function beforeDraftFromVisit(visit: VisitRecord): BeforeDraft {
  return {
    symptomsDiscussed: [...visit.symptomsDiscussed],
    preVisitNotes: visit.preVisitNotes ?? "",
    possibleConditions: visit.possibleConditions ?? "",
    questionsForDoctor: [...(visit.questionsForDoctor ?? [])],
    whatToExpectNotes: visit.whatToExpectNotes ?? "",
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

function formatNextAppointment(value: string) {
  if (!value.trim()) return "No next appointment saved yet";
  return value;
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

export function BeforeAppointmentWorkspace() {
  const [savedState, setSavedState] = useState(() => loadSavedHistory());
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<BeforeDraft>(() => {
    const firstVisit = loadSavedHistory().visits[0];
    return firstVisit
      ? beforeDraftFromVisit(firstVisit)
      : {
          symptomsDiscussed: [],
          preVisitNotes: "",
          possibleConditions: "",
          questionsForDoctor: [],
          whatToExpectNotes: "",
        };
  });
  const [symptomInput, setSymptomInput] = useState("");
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

  function updateDraft<K extends keyof BeforeDraft>(key: K, value: BeforeDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveNotice("");
  }

  function addSymptoms(raw: string) {
    const next = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return;
    updateDraft("symptomsDiscussed", [
      ...draft.symptomsDiscussed,
      ...next.filter(
        (item) =>
          !draft.symptomsDiscussed.some(
            (existing) => existing.toLowerCase() === item.toLowerCase(),
          ),
      ),
    ]);
    setSymptomInput("");
  }

  function removeSymptom(symptom: string) {
    updateDraft(
      "symptomsDiscussed",
      draft.symptomsDiscussed.filter((item) => item !== symptom),
    );
  }

  function addQuestions(raw: string) {
    const next = raw
      .split("\n")
      .flatMap((line) => line.split("?"))
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => (item.endsWith("?") ? item : `${item}?`));
    if (!next.length) return;
    updateDraft("questionsForDoctor", [
      ...draft.questionsForDoctor,
      ...next.filter(
        (item) =>
          !draft.questionsForDoctor.some(
            (existing) => existing.toLowerCase() === item.toLowerCase(),
          ),
      ),
    ]);
    setQuestionInput("");
  }

  function removeQuestion(question: string) {
    updateDraft(
      "questionsForDoctor",
      draft.questionsForDoctor.filter((item) => item !== question),
    );
  }

  function savePreparation() {
    if (!activeVisit) return;
    const nextVisits = savedState.visits.map((visit) =>
      visit.id === activeVisit.id
        ? {
            ...visit,
            symptomsDiscussed: draft.symptomsDiscussed,
            preVisitNotes: draft.preVisitNotes.trim(),
            possibleConditions: draft.possibleConditions.trim(),
            questionsForDoctor: draft.questionsForDoctor,
            whatToExpectNotes: draft.whatToExpectNotes.trim(),
          }
        : visit,
    );
    commit(nextVisits);
    setSaveNotice("Preparation saved to this care timeline.");
  }

  const progressRows = useMemo(
    () => [
      {
        label: "Describe symptoms",
        done: Boolean(draft.symptomsDiscussed.length || draft.preVisitNotes.trim()),
        detail:
          draft.symptomsDiscussed.length > 0
            ? draft.symptomsDiscussed.join(", ")
            : "Write the symptom story in your own words",
      },
      {
        label: "Possible conditions to discuss",
        done: Boolean(draft.possibleConditions.trim()),
        detail: draft.possibleConditions.trim() || "Capture the topics worth asking about",
      },
      {
        label: "Questions to ask",
        done: Boolean(draft.questionsForDoctor.length),
        detail: draft.questionsForDoctor.length
          ? `${draft.questionsForDoctor.length} question${draft.questionsForDoctor.length === 1 ? "" : "s"} drafted`
          : "Build the short question list you want in the room",
      },
      {
        label: "What to expect",
        done: Boolean(draft.whatToExpectNotes.trim()),
        detail:
          draft.whatToExpectNotes.trim() || "Save what to bring, ask for, or listen for",
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
            <Icon name="calendar" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">
            Start your next-visit prep
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
            Add a visit in Saved & Notes first, then Bridge can help you prep the
            next appointment around that care history.
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
          <Icon name="calendar" className="h-3.5 w-3.5" />
          Before Appointment
        </span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Prepare with confidence
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Organize the story you want to tell, decide what questions matter
              most, and walk in with a plan that is easier to follow when the
              room starts moving fast.
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
            Next appointment
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {formatNextAppointment(appointmentLabelFromVisit(activeVisit))}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--brand-soft)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Care team
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
            Prep progress
          </p>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {completedCount}/4
          </p>
          <p className="mt-1 text-sm text-slate-600">steps finished</p>
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
                      setDraft(beforeDraftFromVisit(visit));
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
                      {appointmentLabelFromVisit(visit) || "No next appointment saved"}
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
                  Preparing for
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
                onClick={savePreparation}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                <Icon name="check" className="h-4 w-4" />
                Save preparation
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
            <h2 className="text-lg font-semibold text-slate-900">Describe symptoms</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Keep the story simple: what changed, when it shows up, and how it
              affects your day.
            </p>

            <div className="mt-5 space-y-5">
              <div>
                <SectionLabel>Symptoms in plain language</SectionLabel>
                <textarea
                  rows={5}
                  value={draft.preVisitNotes}
                  onChange={(event) => updateDraft("preVisitNotes", event.target.value)}
                  className={`${textareaClass} mt-2`}
                  placeholder="What has been going on since the last visit?"
                />
              </div>

              <div>
                <SectionLabel>Symptom chips</SectionLabel>
                <div className="mt-2 rounded-xl border border-[var(--line)] px-3 py-3 focus-within:border-[var(--brand)]">
                  <div className="flex flex-wrap gap-2">
                    {draft.symptomsDiscussed.map((symptom) => (
                      <span
                        key={symptom}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-sm text-slate-700"
                      >
                        {symptom}
                        <button
                          type="button"
                          onClick={() => removeSymptom(symptom)}
                          className="text-slate-500 hover:text-slate-900"
                          aria-label={`Remove ${symptom}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={symptomInput}
                      onChange={(event) => setSymptomInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === ",") {
                          event.preventDefault();
                          addSymptoms(symptomInput);
                        }
                      }}
                      onBlur={() => addSymptoms(symptomInput)}
                      placeholder={
                        draft.symptomsDiscussed.length ? "" : "e.g. fatigue, headaches"
                      }
                      className="min-h-8 min-w-[10rem] flex-1 border-0 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <SectionLabel>Possible conditions to discuss</SectionLabel>
                <textarea
                  rows={6}
                  value={draft.possibleConditions}
                  onChange={(event) =>
                    updateDraft("possibleConditions", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="Possible explanations or topics you want the doctor to address"
                />
              </div>

              <div>
                <SectionLabel>What to expect or bring</SectionLabel>
                <textarea
                  rows={6}
                  value={draft.whatToExpectNotes}
                  onChange={(event) =>
                    updateDraft("whatToExpectNotes", event.target.value)
                  }
                  className={`${textareaClass} mt-2`}
                  placeholder="Interpreter request, medication list, symptom log, test questions, or what you want to listen for"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">Questions to ask</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Keep it short. Three to five questions is usually enough to keep
              the visit focused.
            </p>

            <div className="mt-5 rounded-xl border border-[var(--line)] px-3 py-3 focus-within:border-[var(--brand)]">
              <div className="flex flex-wrap gap-2">
                {draft.questionsForDoctor.map((question) => (
                  <span
                    key={question}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-sm text-slate-700"
                  >
                    {question}
                    <button
                      type="button"
                      onClick={() => removeQuestion(question)}
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
                  onBlur={() => addQuestions(questionInput)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      addQuestions(questionInput);
                    }
                  }}
                  placeholder={
                    draft.questionsForDoctor.length
                      ? ""
                      : "Type a question and press Cmd/Ctrl + Enter to add it"
                  }
                  className="min-h-11 min-w-[14rem] flex-1 resize-none border-0 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          </section>

          <AskBridgeInlinePrompts
            title="Use Ask Bridge to sharpen the plan"
            blurb="Ask Bridge to help translate symptoms into plain language, turn worries into usable questions, or draft the one thing you most need answered."
          />
        </div>
      </section>
    </div>
  );
}
