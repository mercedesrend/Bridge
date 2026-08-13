"use client";

import { useEffect, useRef, useState } from "react";
import { VerdictBadge } from "./VerdictBadge";
import { VERDICT_BLURB } from "@/lib/copy";
import type {
  ExclusionItem,
  InclusionItem,
  MatchResult,
  Profile,
  Trial,
} from "@/lib/types";

const INCLUSION_STYLE: Record<InclusionItem["status"], string> = {
  met: "border-emerald-200 bg-emerald-50",
  not_met: "border-rose-200 bg-rose-50",
  unknown: "border-amber-200 bg-amber-50",
};
const INCLUSION_LABEL: Record<InclusionItem["status"], string> = {
  met: "Matches your profile",
  not_met: "Does not match",
  unknown: "Not in your profile",
};

const EXCLUSION_STYLE: Record<ExclusionItem["status"], string> = {
  clear: "border-emerald-200 bg-emerald-50",
  triggered: "border-rose-200 bg-rose-50",
  unknown: "border-amber-200 bg-amber-50",
};
const EXCLUSION_LABEL: Record<ExclusionItem["status"], string> = {
  clear: "Nothing in your profile triggers this",
  triggered: "May apply to you",
  unknown: "Not in your profile",
};

function CriterionRow({
  criterion,
  label,
  reason,
  className,
}: {
  criterion: string;
  label: string;
  reason: string;
  className: string;
}) {
  return (
    <li className={`rounded-xl border p-3 ${className}`}>
      <p className="criteria-text text-sm text-slate-800">{criterion}</p>
      <p className="mt-2 text-xs font-medium text-slate-700">{label}</p>
      {reason && <p className="mt-0.5 text-xs text-slate-600">{reason}</p>}
    </li>
  );
}

export function TrialDetailClient({
  trial,
  profile,
}: {
  trial: Trial;
  profile: Profile | null;
}) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // The ref dedupes the StrictMode double-mount. No `cancelled` cleanup flag:
    // it would discard the first run's result while the second run is skipped.
    if (!profile || startedRef.current) return;
    startedRef.current = true;

    setLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, trial }),
        });
        const data = (await res.json()) as {
          result?: MatchResult;
          error?: string;
        };
        if (!res.ok || !data.result) {
          throw new Error(data?.error || `Match failed (${res.status})`);
        }
        setResult(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Review failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, [profile, trial]);

  if (!profile) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          No profile in this link, so there&rsquo;s nothing to compare against.
          The trial&rsquo;s full criteria are below.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">
          Comparing your profile against this trial&rsquo;s criteria…
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <p className="text-sm text-rose-700">{error}</p>
        <p className="mt-1 text-xs text-rose-600">
          The trial&rsquo;s full criteria are still shown below.
        </p>
      </section>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <VerdictBadge verdict={result.verdict} />
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {VERDICT_BLURB[result.verdict]}
        </p>
      </section>

      {result.inclusion.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Inclusion criteria ({result.inclusion.length})
          </h2>
          <ul className="space-y-2">
            {result.inclusion.map((item, i) => (
              <CriterionRow
                key={i}
                criterion={item.criterion}
                label={INCLUSION_LABEL[item.status] ?? "Not in your profile"}
                reason={item.reason}
                className={INCLUSION_STYLE[item.status] ?? INCLUSION_STYLE.unknown}
              />
            ))}
          </ul>
        </section>
      )}

      {result.exclusion.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Exclusion criteria ({result.exclusion.length})
          </h2>
          <ul className="space-y-2">
            {result.exclusion.map((item, i) => (
              <CriterionRow
                key={i}
                criterion={item.criterion}
                label={EXCLUSION_LABEL[item.status] ?? "Not in your profile"}
                reason={item.reason}
                className={EXCLUSION_STYLE[item.status] ?? EXCLUSION_STYLE.unknown}
              />
            ))}
          </ul>
        </section>
      )}

      {result.questionsForDoctor.length > 0 && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <h2 className="text-sm font-semibold text-sky-900">
            Questions for your care team
          </h2>
          <ul className="mt-2 space-y-2">
            {result.questionsForDoctor.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-sky-900">
                <span aria-hidden className="text-sky-400">
                  •
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
