import Link from "next/link";
import { VerdictBadge } from "./VerdictBadge";
import { Disclaimer } from "./Disclaimer";
import { VERDICT_BLURB } from "@/lib/copy";
import type { RankedMatch } from "@/lib/types";

function phaseLabel(phases: string[]): string {
  if (!phases || phases.length === 0) return "Phase n/a";
  return phases
    .map((p) => p.replace("PHASE", "Phase ").replace("NA", "N/A").trim())
    .join(" / ");
}

function siteLabel(m: RankedMatch): string {
  const loc = m.nearestLocation;
  if (!loc) {
    const first = m.trial.locations[0];
    if (!first) return "No sites listed";
    return [first.city, first.state].filter(Boolean).join(", ") || "Site listed";
  }
  const place = [loc.city, loc.state].filter(Boolean).join(", ");
  if (m.distanceMiles === null) return place || "Site listed";
  return `${place} · ${Math.round(m.distanceMiles)} mi`;
}

export function TrialCard({
  match,
  profileParam,
  radiusMiles,
}: {
  match: RankedMatch;
  profileParam: string;
  radiusMiles: number;
}) {
  const { trial, status, result } = match;
  const outsideRadius =
    match.distanceMiles !== null && match.distanceMiles > radiusMiles;

  return (
    <article className="card p-4 transition hover:shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="font-mono">{trial.nctId}</span>
            <span aria-hidden>·</span>
            <span>{phaseLabel(trial.phases)}</span>
            <span aria-hidden>·</span>
            <span className={outsideRadius ? "text-slate-400" : ""}>
              {siteLabel(match)}
              {outsideRadius && ` (outside your ${radiusMiles} mi radius)`}
            </span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-slate-900">
            {trial.briefTitle}
          </h3>
        </div>
        {status === "done" && result && <VerdictBadge verdict={result.verdict} />}
        {status === "pending" && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
            Reviewing…
          </span>
        )}
        {status === "error" && (
          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-600 ring-1 ring-inset ring-rose-600/20">
            Review failed
          </span>
        )}
      </div>

      {status === "done" && result && (
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {VERDICT_BLURB[result.verdict]}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-sm text-slate-500">
          We couldn&rsquo;t review this trial&rsquo;s criteria. You can still open
          it to read them yourself.
        </p>
      )}

      {status === "done" && result && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>
            {result.inclusion.length} inclusion ·{" "}
            {result.exclusion.length} exclusion criteria reviewed
          </span>
          {result.questionsForDoctor.length > 0 && (
            <span>{result.questionsForDoctor.length} questions generated</span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href={`/trial/${trial.nctId}?p=${profileParam}`}
          className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          See criterion-by-criterion
        </Link>
        <a
          href={`https://clinicaltrials.gov/study/${trial.nctId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--brand)] hover:underline"
        >
          View on ClinicalTrials.gov ↗
        </a>
      </div>

      <Disclaimer className="mt-3 border-t border-[var(--line)] pt-3" />
    </article>
  );
}
