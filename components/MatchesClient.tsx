"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TrialCard } from "./TrialCard";
import { VERDICT_RANK } from "@/lib/copy";
import { geocodeZip, nearestSite, type LatLon } from "@/lib/geo";
import type { MatchResult, Profile, RankedMatch, Trial } from "@/lib/types";

type Phase = "loading-trials" | "matching" | "done" | "error";

export function MatchesClient({
  profile,
  profileParam,
}: {
  profile: Profile;
  profileParam: string;
}) {
  const [phase, setPhase] = useState<Phase>("loading-trials");
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<RankedMatch[]>([]);
  // Guards against double-invocation in React 18/19 StrictMode dev.
  const startedRef = useRef(false);

  const updateMatch = useCallback(
    (nctId: string, patch: Partial<RankedMatch>) => {
      setMatches((prev) =>
        prev.map((m) => (m.trial.nctId === nctId ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  useEffect(() => {
    // The ref (not a cleanup flag) is what dedupes the StrictMode double-mount.
    // Deliberately no `cancelled` guard: cancelling on unmount would discard the
    // results of the first run while the second run is skipped by the ref.
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      // 1. Fetch recruiting trials for the diagnosis.
      let trials: Trial[] = [];
      try {
        const res = await fetch(
          `/api/trials?cond=${encodeURIComponent(profile.diagnosis)}`,
        );
        const data = (await res.json()) as { trials?: Trial[]; error?: string };
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        trials = Array.isArray(data.trials) ? data.trials : [];
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load trials.");
        setPhase("error");
        return;
      }

      if (trials.length === 0) {
        setMatches([]);
        setPhase("done");
        return;
      }

      // 2. Geocode the patient ZIP so we can rank by distance.
      const origin: LatLon | null = await geocodeZip(profile.zip);

      const initial: RankedMatch[] = trials.map((trial) => {
        const { location, distanceMiles } = nearestSite(origin, trial.locations);
        return {
          trial,
          status: "pending",
          result: null,
          error: null,
          distanceMiles,
          nearestLocation: location,
        };
      });
      setMatches(initial);
      setPhase("matching");

      // 3. One OpenAI call per trial, in parallel; render each as it lands.
      const calls = trials.map(async (trial) => {
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
        updateMatch(trial.nctId, { status: "done", result: data.result });
        return data.result;
      });

      const settled = await Promise.allSettled(calls);

      settled.forEach((outcome, i) => {
        if (outcome.status === "rejected") {
          const reason =
            outcome.reason instanceof Error
              ? outcome.reason.message
              : "Unknown error";
          updateMatch(trials[i].nctId, { status: "error", error: reason });
        }
      });

      setPhase("done");
    }

    void run();
  }, [profile, updateMatch]);

  // Rank: verdict first, then distance to nearest site.
  const ranked = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aRank = a.result ? VERDICT_RANK[a.result.verdict] : 3;
      const bRank = b.result ? VERDICT_RANK[b.result.verdict] : 3;
      if (aRank !== bRank) return aRank - bRank;
      const aDist = a.distanceMiles ?? Infinity;
      const bDist = b.distanceMiles ?? Infinity;
      return aDist - bDist;
    });
  }, [matches]);

  const reviewed = matches.filter((m) => m.status !== "pending").length;

  if (phase === "error") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <h2 className="text-sm font-semibold text-rose-800">
          Couldn&rsquo;t load trials
        </h2>
        <p className="mt-1 text-sm text-rose-700">{error}</p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-rose-700"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  if (phase === "loading-trials") {
    return (
      <p className="text-sm text-slate-500">
        Searching recruiting trials for {profile.diagnosis}…
      </p>
    );
  }

  if (phase === "done" && matches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-slate-600">
          No recruiting trials matched &ldquo;{profile.diagnosis}&rdquo;. Try a
          broader term — for example the tumor type rather than the subtype.
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
        >
          Edit profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm text-slate-600">
          Reviewed <span className="font-semibold">{reviewed}</span> of{" "}
          {matches.length} recruiting trials
          {phase === "matching" && " — results appear as they finish"}
        </p>
        {phase === "done" && (
          <Link
            href={`/questions?p=${profileParam}`}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Build question list →
          </Link>
        )}
      </div>

      {ranked.map((m) => (
        <TrialCard
          key={m.trial.nctId}
          match={m}
          profileParam={profileParam}
          radiusMiles={profile.radiusMiles}
        />
      ))}
    </div>
  );
}
