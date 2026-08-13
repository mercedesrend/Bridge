"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { openAskBridge } from "@/components/ask/openAskBridge";
import { Icon } from "@/components/shell/Icon";
import { loadSavedHistory, saveSavedHistory } from "@/lib/savedHistory";
import type { TreatmentOptionNote, VisitRecord } from "@/lib/types";

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatCount(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function makeOptionId() {
  return `option-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultOption(): TreatmentOptionNote {
  return {
    id: makeOptionId(),
    name: "",
    whatItIs: "",
    benefits: "",
    tradeoffs: "",
    questions: [],
    status: "considering",
  };
}

function cloneOptions(visit: VisitRecord | null) {
  return visit?.treatmentOptions?.map((option) => ({
    ...option,
    questions: [...option.questions],
  })) ?? [];
}

const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-[var(--brand)]";
const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]";

export function TreatmentOptionsWorkspace() {
  const [savedState, setSavedState] = useState(() => loadSavedHistory());
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [options, setOptions] = useState<TreatmentOptionNote[]>(() =>
    cloneOptions(loadSavedHistory().visits[0] ?? null),
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

  function saveOptions(nextOptions = options) {
    if (!activeVisit) return;
    const cleaned = nextOptions
      .map((option) => ({
        ...option,
        name: option.name.trim(),
        whatItIs: option.whatItIs.trim(),
        benefits: option.benefits.trim(),
        tradeoffs: option.tradeoffs.trim(),
        questions: option.questions.map((question) => question.trim()).filter(Boolean),
      }))
      .filter(
        (option) =>
          option.name || option.whatItIs || option.benefits || option.tradeoffs || option.questions.length,
      );

    const nextVisits = savedState.visits.map((visit) =>
      visit.id === activeVisit.id ? { ...visit, treatmentOptions: cleaned } : visit,
    );
    commit(nextVisits);
    setOptions(cleaned);
    setStatus("Treatment options saved to this visit.");
  }

  function updateOption(
    optionId: string,
    key: keyof TreatmentOptionNote,
    value: string | string[],
  ) {
    setOptions((current) =>
      current.map((option) =>
        option.id === optionId ? { ...option, [key]: value } : option,
      ),
    );
    setStatus("");
  }

  function addOption() {
    setOptions((current) => [...current, defaultOption()]);
    setStatus("");
  }

  function removeOption(optionId: string) {
    const nextOptions = options.filter((option) => option.id !== optionId);
    setOptions(nextOptions);
    setStatus("");
  }

  const optionStats = useMemo(() => {
    const preferred = options.filter((option) => option.status === "preferred").length;
    const questionCount = options.reduce(
      (total, option) => total + option.questions.filter(Boolean).length,
      0,
    );
    return [
      { label: "Options tracked", value: String(options.length) },
      { label: "Preferred for now", value: String(preferred) },
      { label: "Questions saved", value: String(questionCount) },
    ];
  }, [options]);

  if (!activeVisit) {
    return (
      <div className="mx-auto max-w-5xl">
        <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <Icon name="target" className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold text-slate-900">
            Start with a visit record
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
            Add a visit in Saved & Notes first, then compare the treatments your
            care team discussed in one place.
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
          <Icon name="target" className="h-3.5 w-3.5" />
          Treatment Options
        </span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Understand your options
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Compare what was discussed, capture the benefits and trade-offs in
              plain language, and hold onto the questions you want answered
              before you decide.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addOption}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add option
            </button>
            <button
              type="button"
              onClick={() => saveOptions()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              <Icon name="check" className="h-4 w-4" />
              Save options
            </button>
          </div>
        </div>
      </section>

      {status ? (
        <div className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-slate-800">
          <Icon name="check" className="h-4 w-4 text-[var(--brand)]" />
          {status}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {optionStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[var(--brand-soft)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
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
                      setOptions(cloneOptions(visit));
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
            <h2 className="text-lg font-semibold text-slate-900">Visit context</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {activeVisit.decisionsMade || "No decisions saved from this visit yet."}
            </p>
            <button
              type="button"
              onClick={() =>
                openAskBridge("Help me compare the treatment options my doctor discussed")
              }
              className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]"
            >
              <Icon name="sparkle" className="h-3.5 w-3.5 text-[var(--brand)]" />
              Compare with Ask Bridge
            </button>
          </section>
        </aside>

        <div className="min-w-0 space-y-6">
          {options.length ? (
            options.map((option, index) => (
              <section
                key={option.id}
                className="rounded-2xl border border-[var(--line)] bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Option {index + 1}
                    </p>
                    <input
                      value={option.name}
                      onChange={(event) =>
                        updateOption(option.id, "name", event.target.value)
                      }
                      className={`${inputClass} mt-2 max-w-xl`}
                      placeholder="Treatment name"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={option.status}
                      onChange={(event) =>
                        updateOption(option.id, "status", event.target.value)
                      }
                      className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                    >
                      <option value="considering">Considering</option>
                      <option value="preferred">Preferred for now</option>
                      <option value="ruled_out">Not a fit right now</option>
                      <option value="unsure">Still unsure</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="min-h-11 rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-800">
                      What it is
                    </span>
                    <textarea
                      rows={5}
                      value={option.whatItIs}
                      onChange={(event) =>
                        updateOption(option.id, "whatItIs", event.target.value)
                      }
                      className={`${textareaClass} mt-2`}
                      placeholder="How your doctor described this option"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-medium text-slate-800">
                      Benefits
                    </span>
                    <textarea
                      rows={5}
                      value={option.benefits}
                      onChange={(event) =>
                        updateOption(option.id, "benefits", event.target.value)
                      }
                      className={`${textareaClass} mt-2`}
                      placeholder="Possible upside, in plain language"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="block text-sm font-medium text-slate-800">
                      Trade-offs
                    </span>
                    <textarea
                      rows={4}
                      value={option.tradeoffs}
                      onChange={(event) =>
                        updateOption(option.id, "tradeoffs", event.target.value)
                      }
                      className={`${textareaClass} mt-2`}
                      placeholder="Side effects, monitoring, cost, time, or uncertainty"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="block text-sm font-medium text-slate-800">
                      Questions to ask
                    </span>
                    <textarea
                      rows={4}
                      value={option.questions.join("\n")}
                      onChange={(event) =>
                        updateOption(
                          option.id,
                          "questions",
                          event.target.value
                            .split("\n")
                            .map((question) => question.trim())
                            .filter(Boolean),
                        )
                      }
                      className={`${textareaClass} mt-2`}
                      placeholder="One question per line"
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      {formatCount(option.questions.length, "question", "questions")}
                    </p>
                  </label>
                </div>
              </section>
            ))
          ) : (
            <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon name="target" className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                No treatment options captured yet
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
                Add the treatments your doctor mentioned, then compare the
                benefits, trade-offs, and questions side by side.
              </p>
              <button
                type="button"
                onClick={addOption}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add first option
              </button>
            </section>
          )}

          <AskBridgeInlinePrompts
            title="Use Ask Bridge to unpack the choices"
            blurb="Ask Bridge to explain a treatment in plain language, help compare trade-offs, or turn a vague concern into a question for your care team."
          />
        </div>
      </section>
    </div>
  );
}
