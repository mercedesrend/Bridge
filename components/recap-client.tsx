"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  readOptions,
  readProfile,
  readQuestions,
  readRecapSteps,
  readSelectedOptionIds,
  saveRecapSteps
} from "@/lib/storage";
import { PatientProfile, QuestionItem, RecapState, TreatmentOption } from "@/lib/types";
import { decodeShareState, encodeShareState } from "@/lib/utils";
import { SourceChip } from "@/components/source-chip";

function getInitialSnapshot(shared: string | null): RecapState {
  if (shared) {
    const snapshot = decodeShareState(shared);
    if (snapshot) {
      return snapshot;
    }
  }

  return {
    profile: readProfile(),
    questions: readQuestions().filter((question) => question.selected),
    options: readOptions(),
    selectedOptionIds: readSelectedOptionIds(),
    suggestedNextSteps: readRecapSteps()
  };
}

export function RecapClient() {
  const searchParams = useSearchParams();
  const shared = searchParams.get("share");
  const initialSnapshot = useMemo(() => getInitialSnapshot(shared), [shared]);
  const [profile] = useState<PatientProfile | null>(initialSnapshot.profile);
  const [questions] = useState<QuestionItem[]>(initialSnapshot.questions);
  const [options] = useState<TreatmentOption[]>(initialSnapshot.options);
  const [selectedOptionIds] = useState<string[]>(initialSnapshot.selectedOptionIds);
  const [nextSteps, setNextSteps] = useState<string[]>(initialSnapshot.suggestedNextSteps);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const answered = useMemo(
    () => questions.filter((question) => question.status === "answered"),
    [questions]
  );
  const unanswered = useMemo(
    () => questions.filter((question) => question.status !== "answered"),
    [questions]
  );
  const discussedOptions = useMemo(
    () => options.filter((option) => selectedOptionIds.includes(option.id)),
    [options, selectedOptionIds]
  );
  const shareUrl = useMemo(() => {
    if (!profile || shared || typeof window === "undefined") {
      return "";
    }

    const snapshot: RecapState = {
      profile,
      questions,
      options,
      selectedOptionIds,
      suggestedNextSteps: nextSteps
    };
    const encoded = encodeShareState(snapshot);
    if (!encoded) {
      return "";
    }

    return `${window.location.origin}/recap?share=${encodeURIComponent(encoded)}`;
  }, [nextSteps, options, profile, questions, selectedOptionIds, shared]);

  async function generateNextSteps() {
    if (!profile || !answered.length) {
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/recap-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profile,
          questions: answered.map((question) => ({
            text: question.text,
            note: question.note,
            status: question.status
          }))
        })
      });

      const payload = (await response.json()) as { steps?: string[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate next steps");
      }
      const steps = payload.steps ?? [];
      setNextSteps(steps);
      saveRecapSteps(steps);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to generate recap steps.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">Finish the earlier phases first so we have something to recap.</p>
        <Link href="/intake" className="mt-4 inline-flex rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Back to intake
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm font-medium text-[color:var(--muted)]">After the visit</p>
        <h2 className="mt-1 text-2xl font-semibold">Recap and next steps</h2>
        <div className="mt-4 flex gap-3">
          {!shared ? (
            <>
              <button
                type="button"
                onClick={generateNextSteps}
                disabled={isLoading || !answered.length}
                className="flex-1 rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isLoading ? "Writing..." : nextSteps.length ? "Refresh next steps" : "Generate next steps"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl border border-[color:var(--line)] px-4 py-3 text-sm font-semibold"
              >
                Print / Save as PDF
              </button>
            </>
          ) : null}
        </div>
        {shareUrl ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--line)] bg-white p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Share with family or care team</p>
            <input
              readOnly
              value={shareUrl}
              className="mt-2 w-full rounded-xl border border-[color:var(--line)] px-3 py-2 text-sm"
            />
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <h3 className="text-lg font-semibold">What we covered</h3>
        <div className="mt-3 space-y-3">
          {answered.length ? (
            answered.map((question) => (
              <div key={question.id} className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
                <p className="text-sm font-semibold">{question.text}</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{question.note || "No note captured."}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No answered questions yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <h3 className="text-lg font-semibold">Still unanswered</h3>
        <div className="mt-3 space-y-3">
          {unanswered.length ? (
            unanswered.map((question) => (
              <div key={question.id} className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{question.text}</p>
                  {question.carryForward ? (
                    <span className="rounded-full bg-[color:var(--rose-soft)] px-2 py-1 text-xs font-semibold">
                      Bring to next visit
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">Everything in your active list was covered.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <h3 className="text-lg font-semibold">Options discussed</h3>
        <div className="mt-3 space-y-3">
          {discussedOptions.length ? (
            discussedOptions.map((option) => (
              <div key={option.id} className="rounded-2xl border border-[color:var(--line)] bg-white p-3">
                <p className="text-sm font-semibold">{option.plainName}</p>
                {option.whatItIs ? <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{option.whatItIs}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {option.chips.map((chip) => (
                    <SourceChip key={`${option.id}-${chip.href}`} chip={chip} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No options were selected in prep.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <h3 className="text-lg font-semibold">Suggested next steps</h3>
        <div className="mt-3 space-y-3">
          {nextSteps.length ? (
            nextSteps.map((step) => (
              <div key={step} className="rounded-2xl border border-[color:var(--line)] bg-white px-3 py-3 text-sm">
                {step}
              </div>
            ))
          ) : (
            <p className="text-sm text-[color:var(--muted)]">
              Generate this block after the visit to turn notes into concrete follow-up actions.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
