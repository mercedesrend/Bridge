"use client";

import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import type { VisitRecord } from "@/lib/types";

export type VisitDraft = {
  date: string;
  doctor: string;
  specialty: string;
  location: string;
  summary: string;
  symptoms: string[];
  decisionsMade: string;
  followUpPlan: string;
  prescriptions: string;
  nextAppointment: string;
};

export const emptyVisitDraft: VisitDraft = {
  date: "",
  doctor: "",
  specialty: "",
  location: "",
  summary: "",
  symptoms: [],
  decisionsMade: "",
  followUpPlan: "",
  prescriptions: "",
  nextAppointment: "",
};

export function draftFromVisit(visit: VisitRecord): VisitDraft {
  return {
    date: visit.date,
    doctor: visit.doctor,
    specialty: visit.specialty,
    location: visit.location,
    summary: visit.summary,
    symptoms: [...visit.symptomsDiscussed],
    decisionsMade: visit.decisionsMade,
    followUpPlan: visit.followUpPlan,
    prescriptions: visit.prescriptions,
    nextAppointment: visit.nextAppointment,
  };
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]";
const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]";

export function AddVisitDrawer({
  open,
  mode,
  initialDraft,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "add" | "edit";
  initialDraft: VisitDraft;
  onClose: () => void;
  onSave: (draft: VisitDraft) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState<VisitDraft>(initialDraft);
  const [symptomInput, setSymptomInput] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(initialDraft);
      setSymptomInput("");
    }
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function update<K extends keyof VisitDraft>(key: K, value: VisitDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addSymptom(raw: string) {
    const next = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return;
    update("symptoms", [
      ...draft.symptoms,
      ...next.filter(
        (item) =>
          !draft.symptoms.some((existing) => existing.toLowerCase() === item.toLowerCase()),
      ),
    ]);
    setSymptomInput("");
  }

  function removeSymptom(symptom: string) {
    update(
      "symptoms",
      draft.symptoms.filter((item) => item !== symptom),
    );
  }

  const canSave = Boolean(draft.date && draft.doctor.trim() && draft.summary.trim());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close add visit drawer"
        className="absolute inset-0 bg-slate-900/30"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--line)] bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit visit" : "Add a visit"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Start with who and when, then capture what mattered that day.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Who & where
            </p>
            <Field id="visit-date" label="Visit date">
              <input
                id="visit-date"
                type="date"
                value={draft.date}
                onChange={(event) => update("date", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="visit-doctor" label="Doctor name">
              <input
                id="visit-doctor"
                value={draft.doctor}
                onChange={(event) => update("doctor", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="visit-specialty" label="Specialty" hint="Optional">
              <input
                id="visit-specialty"
                value={draft.specialty}
                onChange={(event) => update("specialty", event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="visit-location" label="Clinic or hospital" hint="Optional">
              <input
                id="visit-location"
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
                className={inputClass}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              What happened
            </p>
            <Field id="visit-summary" label="What happened at the visit?">
              <textarea
                id="visit-summary"
                rows={4}
                value={draft.summary}
                onChange={(event) => update("summary", event.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field
              id="visit-symptoms"
              label="Symptoms discussed"
              hint="Press Enter or comma to add a chip"
            >
              <div className="rounded-xl border border-[var(--line)] px-3 py-2 focus-within:border-[var(--brand)]">
                <div className="flex flex-wrap gap-2">
                  {draft.symptoms.map((symptom) => (
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
                    id="visit-symptoms"
                    value={symptomInput}
                    onChange={(event) => setSymptomInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addSymptom(symptomInput);
                      } else if (
                        event.key === "Backspace" &&
                        !symptomInput &&
                        draft.symptoms.length
                      ) {
                        removeSymptom(draft.symptoms[draft.symptoms.length - 1]);
                      }
                    }}
                    onBlur={() => addSymptom(symptomInput)}
                    placeholder={draft.symptoms.length ? "" : "e.g. fatigue"}
                    className="min-h-8 min-w-[8rem] flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </Field>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Next steps
            </p>
            <Field id="visit-decisions" label="Decisions made" hint="Optional">
              <textarea
                id="visit-decisions"
                rows={3}
                value={draft.decisionsMade}
                onChange={(event) => update("decisionsMade", event.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="visit-followup" label="Follow-up plan" hint="Optional">
              <textarea
                id="visit-followup"
                rows={3}
                value={draft.followUpPlan}
                onChange={(event) => update("followUpPlan", event.target.value)}
                className={textareaClass}
              />
            </Field>
            <Field id="visit-rx" label="Prescriptions & medications" hint="Optional">
              <textarea
                id="visit-rx"
                rows={3}
                value={draft.prescriptions}
                onChange={(event) => update("prescriptions", event.target.value)}
                className={textareaClass}
                placeholder="New or continued medications mentioned at this visit"
              />
            </Field>
            <Field id="visit-next" label="Next appointment" hint="Optional">
              <input
                id="visit-next"
                value={draft.nextAppointment}
                onChange={(event) => update("nextAppointment", event.target.value)}
                className={inputClass}
                placeholder="e.g. Thu, Aug 14 · 10:30 AM"
              />
            </Field>
          </section>
        </div>

        <footer className="border-t border-[var(--line)] px-5 py-4">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => onSave(draft)}
            className="min-h-11 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "edit" ? "Save changes" : "Save visit"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
