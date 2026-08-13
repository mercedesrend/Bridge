"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS } from "@/lib/constants";
import {
  readOptions,
  readProfile,
  readQuestions,
  readSelectedOptionIds,
  saveOptions,
  saveQuestions,
  saveSelectedOptionIds
} from "@/lib/storage";
import { OptionsResponse, PatientProfile, QuestionItem, TreatmentOption } from "@/lib/types";
import { clampSelectedQuestions, uniqueQuestions } from "@/lib/utils";
import { SourceChip } from "@/components/source-chip";
import clsx from "clsx";

export function PrepClient() {
  const [profile] = useState<PatientProfile | null>(() => readProfile());
  const [overview, setOverview] = useState<OptionsResponse["overview"]>(null);
  const [options, setOptions] = useState<TreatmentOption[]>(() => readOptions());
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(() =>
    readSelectedOptionIds()
  );
  const [questions, setQuestions] = useState<QuestionItem[]>(() => readQuestions());
  const [customQuestion, setCustomQuestion] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      standard: options.filter((option) => option.category === "standard"),
      "trials-now": options.filter((option) => option.category === "trials-now"),
      "coming-soon": options.filter((option) => option.category === "coming-soon")
    };
  }, [options]);

  useEffect(() => {
    saveOptions(options);
  }, [options]);

  useEffect(() => {
    saveSelectedOptionIds(selectedOptionIds);
  }, [selectedOptionIds]);

  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  async function loadOptions() {
    if (!profile) {
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(profile)
      });

      const payload = (await response.json()) as OptionsResponse & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load options");
      }

      const nextOptions = [
        ...payload.sections.standard,
        ...payload.sections["trials-now"],
        ...payload.sections["coming-soon"]
      ];

      setOverview(payload.overview);
      setOptions(nextOptions);

      const selected = nextOptions.filter((option) => selectedOptionIds.includes(option.id));
      const merged = clampSelectedQuestions(uniqueQuestions(selected, readQuestions()));
      setQuestions(merged);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to fetch options.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleOption(optionId: string) {
    const nextSelected = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];

    setSelectedOptionIds(nextSelected);
    const selectedOptions = options.filter((option) => nextSelected.includes(option.id));
    setQuestions((current) => clampSelectedQuestions(uniqueQuestions(selectedOptions, current)));
  }

  function toggleQuestion(questionId: string) {
    setQuestions((current) => {
      let selectedCount = current.filter((question) => question.selected).length;
      return current.map((question) => {
        if (question.id !== questionId) {
          return question;
        }
        if (!question.selected && selectedCount >= 8) {
          return question;
        }
        selectedCount += question.selected ? -1 : 1;
        return { ...question, selected: !question.selected };
      });
    });
  }

  function addCustomQuestion() {
    const trimmed = customQuestion.trim();
    if (!trimmed) {
      return;
    }

    setQuestions((current) =>
      clampSelectedQuestions([
        ...current,
        {
          id: `custom-${crypto.randomUUID()}`,
          text: trimmed,
          selected: current.filter((question) => question.selected).length < 8,
          isCustom: true,
          optionId: null,
          status: "pending",
          note: "",
          carryForward: false
        }
      ])
    );
    setCustomQuestion("");
  }

  function moveQuestion(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      return;
    }

    setQuestions((current) => {
      const sourceIndex = current.findIndex((item) => item.id === draggedId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">Start with your diagnosis intake to unlock this step.</p>
        <Link href="/" className="mt-4 inline-flex rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Go to intake
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--muted)]">Before the visit</p>
            <h2 className="mt-1 text-2xl font-semibold">Treatment menu</h2>
          </div>
          <button
            type="button"
            onClick={loadOptions}
            disabled={isLoading}
            className="rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isLoading ? "Loading..." : options.length ? "Refresh sources" : "Fetch sourced options"}
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          We only show options with visible sources. If a source fails, the list just gets shorter.
        </p>

        {overview ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--accent-soft)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{overview.title}</p>
                <p className="mt-2 text-sm leading-6">{overview.summary}</p>
              </div>
              {overview.chip ? <SourceChip chip={overview.chip} /> : null}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {(["standard", "trials-now", "coming-soon"] as const).map((category) => (
        <section key={category} className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{CATEGORY_LABELS[category]}</h3>
            <p className="text-sm text-[color:var(--muted)]">
              {category === "standard"
                ? "Options that already show up in drug-label sources."
                : category === "trials-now"
                  ? "Recruiting studies your doctor may mention."
                  : "Late-stage studies that may come up in planning conversations."}
            </p>
          </div>

          {grouped[category].length ? (
            grouped[category].map((option) => {
              const selected = selectedOptionIds.includes(option.id);
              return (
                <article
                  key={option.id}
                  className={clsx(
                    "rounded-3xl border p-4",
                    selected
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                      : "border-[color:var(--line)] bg-[color:var(--card)]"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold">{option.plainName}</h4>
                      <p className="mt-1 text-sm leading-6">{option.whatItIs}</p>
                      {option.howItsGiven ? (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">How it&apos;s given: {option.howItsGiven}</p>
                      ) : null}
                      {option.whyItMightComeUp ? (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">{option.whyItMightComeUp}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleOption(option.id)}
                      className="rounded-2xl border border-[color:var(--line)] bg-white px-3 py-2 text-sm font-semibold"
                    >
                      {selected ? "Selected" : "Use"}
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {option.chips.map((chip) => (
                      <SourceChip key={`${option.id}-${chip.href}`} chip={chip} />
                    ))}
                  </div>

                  <Link
                    href={`/prep/${option.id}`}
                    className="mt-4 inline-flex rounded-2xl border border-[color:var(--line)] px-3 py-2 text-sm font-medium"
                  >
                    Open detail view
                  </Link>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-[color:var(--line)] bg-[color:var(--card)] p-4 text-sm text-[color:var(--muted)]">
              {options.length ? "No sourced options in this section right now." : "Fetch options to fill this section."}
            </div>
          )}
        </section>
      ))}

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--muted)]">Question builder</p>
            <h3 className="mt-1 text-xl font-semibold">Shape your list for the visit</h3>
          </div>
          <span className="rounded-full bg-[color:var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--warning)]">
            {questions.filter((question) => question.selected).length}/8 selected
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Most appointments have time for 5-8 questions. Star your top 3.
        </p>

        <div className="mt-4 space-y-3">
          {questions.map((question) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => setDraggedId(question.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveQuestion(question.id)}
              className="rounded-2xl border border-[color:var(--line)] bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <input
                  checked={question.selected}
                  onChange={() => toggleQuestion(question.id)}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm leading-6">{question.text}</p>
                  {question.isCustom ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Custom</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <input
            value={customQuestion}
            onChange={(event) => setCustomQuestion(event.target.value)}
            placeholder="Add your own question"
            className="flex-1 rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
          />
          <button
            type="button"
            onClick={addCustomQuestion}
            className="rounded-2xl border border-[color:var(--line)] px-4 py-3 text-sm font-semibold"
          >
            Add
          </button>
        </div>

        <Link
          href="/visit"
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[color:var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white"
        >
          Continue to appointment mode
        </Link>
      </section>
    </div>
  );
}
