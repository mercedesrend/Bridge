"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Sex } from "@/lib/types";
import {
  DEMO_PROFILE,
  EMPTY_PROFILE,
  encodeProfile,
  isProfileSearchable,
} from "@/lib/profile";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/25";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export function IntakeForm({ initial }: { initial?: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(initial ?? EMPTY_PROFILE);

  // Free-text inputs for the array/record fields; parsed on submit.
  const [treatmentsText, setTreatmentsText] = useState(
    (initial ?? EMPTY_PROFILE).priorTreatments.join(", "),
  );
  const [biomarkersText, setBiomarkersText] = useState(
    Object.entries((initial ?? EMPTY_PROFILE).biomarkers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
  );

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function loadDemo() {
    setProfile(DEMO_PROFILE);
    setTreatmentsText(DEMO_PROFILE.priorTreatments.join(", "));
    setBiomarkersText(
      Object.entries(DEMO_PROFILE.biomarkers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    );
  }

  function parseTreatments(text: string): string[] {
    return text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function parseBiomarkers(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx === -1) {
        out[trimmed] = "present";
      } else {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (key) out[key] = val || "present";
      }
    }
    return out;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalProfile: Profile = {
      ...profile,
      priorTreatments: parseTreatments(treatmentsText),
      biomarkers: parseBiomarkers(biomarkersText),
    };
    if (!isProfileSearchable(finalProfile)) return;
    router.push(`/matches?p=${encodeProfile(finalProfile)}`);
  }

  const canSubmit = profile.diagnosis.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Your profile</h2>
        <button
          type="button"
          onClick={loadDemo}
          className="rounded-lg border border-[var(--brand)]/25 bg-[var(--brand-soft)] px-3 py-1.5 text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand-soft)]"
        >
          Load demo patient
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="diagnosis">
            Diagnosis <span className="text-rose-500">*</span>
          </label>
          <input
            id="diagnosis"
            className={fieldClass}
            placeholder="e.g. Melanoma"
            value={profile.diagnosis}
            onChange={(e) => set("diagnosis", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="stage">
            Stage
          </label>
          <input
            id="stage"
            className={fieldClass}
            placeholder="e.g. Stage IV (metastatic)"
            value={profile.stage}
            onChange={(e) => set("stage", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="age">
            Age
          </label>
          <input
            id="age"
            type="number"
            min={0}
            max={120}
            className={fieldClass}
            placeholder="e.g. 58"
            value={profile.age ?? ""}
            onChange={(e) =>
              set("age", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sex">
            Sex
          </label>
          <select
            id="sex"
            className={fieldClass}
            value={profile.sex}
            onChange={(e) => set("sex", e.target.value as Sex | "")}
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="zip">
            ZIP code
          </label>
          <input
            id="zip"
            inputMode="numeric"
            maxLength={5}
            className={fieldClass}
            placeholder="e.g. 10029"
            value={profile.zip}
            onChange={(e) =>
              set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))
            }
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="radius">
            Search radius: {profile.radiusMiles} mi
          </label>
          <input
            id="radius"
            type="range"
            min={10}
            max={500}
            step={10}
            className="w-full accent-[var(--brand)]"
            value={profile.radiusMiles}
            onChange={(e) => set("radiusMiles", Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="treatments">
          Prior treatments
        </label>
        <input
          id="treatments"
          className={fieldClass}
          placeholder="Comma-separated, e.g. Pembrolizumab, Surgical resection"
          value={treatmentsText}
          onChange={(e) => setTreatmentsText(e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="biomarkers">
          Biomarkers
        </label>
        <textarea
          id="biomarkers"
          rows={3}
          className={fieldClass}
          placeholder={"One per line, name: value\ne.g.\nBRAF V600E: positive\nPD-L1: high"}
          value={biomarkersText}
          onChange={(e) => setBiomarkersText(e.target.value)}
        />
        <p className="mt-1 text-xs text-slate-400">
          Format each line as <code>name: value</code>.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Find trials
        </button>
        {!canSubmit && (
          <span className="text-xs text-slate-400">
            Enter a diagnosis to search.
          </span>
        )}
      </div>
    </form>
  );
}
