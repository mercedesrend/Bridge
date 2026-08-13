"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SAMPLE_PROFILE } from "@/lib/constants";
import { readProfile, saveProfile } from "@/lib/storage";
import { PatientProfile } from "@/lib/types";

const emptyProfile: PatientProfile = {
  condition: "",
  stage: "",
  age: "",
  sex: "",
  priorTreatments: [],
  zip: "",
  rawDescription: ""
};

export function IntakeClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile>(() => readProfile() ?? emptyProfile);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState("");

  async function parseDescription(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsParsing(true);

    try {
      const response = await fetch("/api/parse-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rawDescription: profile.rawDescription })
      });

      const payload = (await response.json()) as Partial<PatientProfile> & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to parse");
      }

      setProfile((current) => ({
        ...current,
        condition: payload.condition ?? current.condition,
        stage: payload.stage ?? current.stage,
        age: payload.age ?? current.age,
        sex: payload.sex ?? current.sex,
        priorTreatments: payload.priorTreatments ?? current.priorTreatments,
        zip: payload.zip ?? current.zip
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to parse this description.");
    } finally {
      setIsParsing(false);
    }
  }

  function updateField<K extends keyof PatientProfile>(key: K, value: PatientProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function useSample() {
    setProfile(SAMPLE_PROFILE);
    setError("");
  }

  function continueToPrep() {
    saveProfile(profile);
    router.push("/prep");
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] shadow-[var(--soft-shadow)]">
        <div className="border-b border-[color:var(--line)] bg-[color:var(--surface-raised)] px-4 py-4">
          <div className="inline-flex rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
            Before the visit
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Tell Bridge what your doctor told you.</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Start with your own words. We&apos;ll turn that into a structured profile so the rest of your prep feels focused, not overwhelming.
          </p>
        </div>

        <form className="space-y-4 p-4" onSubmit={parseDescription}>
          <textarea
            value={profile.rawDescription}
            onChange={(event) => updateField("rawDescription", event.target.value)}
            placeholder="My doctor said..."
            className="min-h-40 w-full rounded-3xl border border-[color:var(--line)] bg-white px-4 py-3 text-base"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isParsing || !profile.rawDescription.trim()}
              className="min-h-11 flex-1 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isParsing ? "Parsing..." : "Parse my note"}
            </button>
            <button
              type="button"
              onClick={useSample}
              className="min-h-11 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-raised)] px-5 py-3 text-sm font-semibold"
            >
              Try a sample
            </button>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </form>
      </section>

      <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-4 shadow-[var(--soft-shadow)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--muted)]">Confirm your profile</p>
            <h3 className="mt-1 text-xl font-semibold">Edit anything that looks off</h3>
          </div>
          <div className="hidden rounded-full bg-[color:var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] sm:block">
            Step 1 of 3
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 space-y-2 text-sm">
            <span>Condition</span>
            <input
              value={profile.condition}
              onChange={(event) => updateField("condition", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Stage / severity</span>
            <input
              value={profile.stage}
              onChange={(event) => updateField("stage", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Age</span>
            <input
              value={profile.age}
              onChange={(event) => updateField("age", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>Sex</span>
            <input
              value={profile.sex}
              onChange={(event) => updateField("sex", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span>ZIP</span>
            <input
              value={profile.zip}
              onChange={(event) => updateField("zip", event.target.value)}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
          <label className="col-span-2 space-y-2 text-sm">
            <span>Treatments already tried</span>
            <input
              value={profile.priorTreatments.join(", ")}
              onChange={(event) =>
                updateField(
                  "priorTreatments",
                  event.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Separate with commas"
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={!profile.condition.trim() || !profile.rawDescription.trim()}
          onClick={continueToPrep}
          className="mt-4 min-h-11 w-full rounded-full bg-[color:var(--accent-strong)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Continue to treatment menu
        </button>
      </section>
    </div>
  );
}
