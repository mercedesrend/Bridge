"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readQuestions, saveQuestions } from "@/lib/storage";
import { QuestionItem } from "@/lib/types";

export function VisitClient() {
  const [questions, setQuestions] = useState<QuestionItem[]>(() =>
    readQuestions().filter((question) => question.selected)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dictationSupported] = useState(
    () => typeof window !== "undefined" && "webkitSpeechRecognition" in window
  );

  useEffect(() => {
    if (!questions.length) {
      return;
    }
    saveQuestions(questions);
  }, [questions]);

  const current = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => question.status === "answered").length,
    [questions]
  );

  function updateCurrent(changes: Partial<QuestionItem>) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, index) =>
        index === currentIndex ? { ...question, ...changes } : question
      )
    );
  }

  if (!questions.length) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">Build your question list first so appointment mode has something to walk through.</p>
        <Link href="/prep" className="mt-4 inline-flex rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Back to prep
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--muted)]">Appointment mode</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {currentIndex + 1} of {questions.length} asked
            </h2>
          </div>
          <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold">
            {answeredCount} answered
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[color:var(--line)]">
          <div
            className="h-full rounded-full bg-[color:var(--accent)] transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-2xl font-semibold leading-10">{current.text}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateCurrent({ status: "answered", carryForward: false })}
            className="rounded-2xl bg-[color:var(--accent)] px-4 py-4 text-sm font-semibold text-white"
          >
            Mark as answered
          </button>
          <button
            type="button"
            onClick={() => updateCurrent({ status: "skipped", carryForward: true })}
            className="rounded-2xl bg-[color:var(--warning-soft)] px-4 py-4 text-sm font-semibold text-[color:var(--warning)]"
          >
            Skipped / Ran out of time
          </button>
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-[color:var(--muted)]">What the doctor said</span>
          <textarea
            value={current.note}
            onChange={(event) => updateCurrent({ note: event.target.value })}
            className="min-h-32 w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-base"
            placeholder="Type a quick note here"
          />
        </label>

        <p className="mt-2 text-xs text-[color:var(--muted)]">
          {dictationSupported
            ? "Dictation is supported in this browser if you want to add it next."
            : "This browser does not expose Web Speech dictation here, so notes stay manual."}
        </p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            className="flex-1 rounded-2xl border border-[color:var(--line)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
            className="flex-1 rounded-2xl bg-[color:var(--accent-strong)] px-4 py-3 text-sm font-semibold text-white"
          >
            {currentIndex === questions.length - 1 ? "Review recap" : "Next question"}
          </button>
        </div>
      </section>

      <Link
        href="/recap"
        className="inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold"
      >
        Open recap
      </Link>
    </div>
  );
}
