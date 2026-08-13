"use client";

import Link from "next/link";
import { useState } from "react";
import { readOptions, readSelectedOptionIds } from "@/lib/storage";
import { TreatmentOption } from "@/lib/types";
import { SourceChip } from "@/components/source-chip";

export function PrepDetailClient({ optionId }: { optionId: string }) {
  const [option] = useState<TreatmentOption | null>(() =>
    readOptions().find((item) => item.id === optionId) ?? null
  );
  const [selected] = useState(() => readSelectedOptionIds().includes(optionId));

  if (!option) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm text-[color:var(--muted)]">This option isn&apos;t in local state yet. Fetch your sourced options first.</p>
        <Link href="/prep" className="mt-4 inline-flex rounded-2xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Back to prep
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <p className="text-sm font-medium text-[color:var(--muted)]">{selected ? "Selected for your list" : "Worth asking about"}</p>
        <h2 className="mt-1 text-2xl font-semibold">{option.plainName}</h2>
        <p className="mt-3 text-base leading-7">{option.whatItIs}</p>
        {option.howItsGiven ? (
          <p className="mt-3 rounded-2xl bg-[color:var(--accent-soft)] px-3 py-3 text-sm">
            How it&apos;s given: {option.howItsGiven}
          </p>
        ) : null}
        {option.whyItMightComeUp ? (
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{option.whyItMightComeUp}</p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)] p-4">
        <h3 className="text-lg font-semibold">Questions this option surfaced</h3>
        <div className="mt-3 space-y-2">
          {option.questionsToAsk.map((question) => (
            <div key={question} className="rounded-2xl border border-[color:var(--line)] bg-white px-3 py-3 text-sm">
              {question}
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {option.chips.map((chip) => (
            <SourceChip key={`${option.id}-${chip.href}`} chip={chip} />
          ))}
        </div>
      </section>
    </div>
  );
}
