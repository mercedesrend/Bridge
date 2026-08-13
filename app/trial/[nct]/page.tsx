import Link from "next/link";
import { notFound } from "next/navigation";
import { TrialDetailClient } from "@/components/TrialDetailClient";
import { Disclaimer } from "@/components/Disclaimer";
import { fetchTrialByNct } from "@/lib/clinicaltrials";
import { decodeProfile } from "@/lib/profile";

export default async function TrialPage({
  params,
  searchParams,
}: {
  params: Promise<{ nct: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { nct } = await params;
  const { p } = await searchParams;

  const trial = await fetchTrialByNct(nct);
  if (!trial) notFound();

  const profile = decodeProfile(p);
  const sites = trial.locations.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={p ? `/matches?p=${p}` : "/"}
          className="text-xs text-slate-500 hover:text-slate-900"
        >
          ← Back to trials
        </Link>
        <p className="mt-1 font-mono text-xs text-slate-500">{trial.nctId}</p>
        <h1 className="mt-1 text-xl font-bold leading-snug tracking-tight text-slate-900">
          {trial.briefTitle}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {trial.phases.length > 0
            ? trial.phases.map((x) => x.replace("PHASE", "Phase ")).join(" / ")
            : "Phase n/a"}
          {trial.minimumAge ? ` · Ages ${trial.minimumAge}` : ""}
          {trial.maximumAge ? ` to ${trial.maximumAge}` : ""}
          {trial.sex ? ` · ${trial.sex}` : ""}
        </p>
        <Disclaimer className="mt-3" />
      </div>

      <TrialDetailClient trial={trial} profile={profile} />

      {sites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Study sites ({trial.locations.length})
          </h2>
          <ul className="space-y-1.5">
            {sites.map((loc, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <span className="font-medium">{loc.facility ?? "Site"}</span>
                <span className="text-slate-500">
                  {" — "}
                  {[loc.city, loc.state, loc.zip].filter(Boolean).join(", ") ||
                    "Location not listed"}
                </span>
              </li>
            ))}
          </ul>
          {trial.locations.length > sites.length && (
            <p className="mt-2 text-xs text-slate-500">
              + {trial.locations.length - sites.length} more sites on
              ClinicalTrials.gov
            </p>
          )}
        </section>
      )}

      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Full eligibility criteria (verbatim)
        </summary>
        <p className="criteria-text mt-3 text-sm text-slate-700">
          {trial.eligibilityCriteria || "No criteria text provided."}
        </p>
      </details>

      <a
        href={`https://clinicaltrials.gov/study/${trial.nctId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm text-sky-700 hover:underline"
      >
        View full record on ClinicalTrials.gov ↗
      </a>

      <Disclaimer className="border-t border-slate-200 pt-4" />
    </div>
  );
}
