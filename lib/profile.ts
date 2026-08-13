// Profile <-> URL param serialization and the demo patient.
// State lives in React + URL params, so the profile travels as a single
// base64url-encoded `p` query param.

import type { Profile } from "./types";

export const EMPTY_PROFILE: Profile = {
  age: null,
  sex: "",
  diagnosis: "",
  stage: "",
  priorTreatments: [],
  biomarkers: {},
  zip: "",
  radiusMiles: 100,
};

/** A realistic demo patient used by the prefill button on the intake screen. */
export const DEMO_PROFILE: Profile = {
  age: 58,
  sex: "female",
  diagnosis: "Melanoma",
  stage: "Stage IV (metastatic)",
  priorTreatments: ["Pembrolizumab", "Surgical resection"],
  biomarkers: { "BRAF V600E": "positive", "PD-L1": "high" },
  zip: "10029",
  radiusMiles: 100,
};

function toBase64Url(input: string): string {
  const b64 =
    typeof window === "undefined"
      ? Buffer.from(input, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof window === "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  return decodeURIComponent(escape(atob(b64)));
}

/** Serialize a profile to the value of the `p` URL param. */
export function encodeProfile(profile: Profile): string {
  return toBase64Url(JSON.stringify(profile));
}

/** Parse a `p` URL param back into a profile, filling gaps from EMPTY_PROFILE. */
export function decodeProfile(param: string | null | undefined): Profile | null {
  if (!param) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(param)) as Partial<Profile>;
    return {
      ...EMPTY_PROFILE,
      ...parsed,
      priorTreatments: Array.isArray(parsed.priorTreatments)
        ? parsed.priorTreatments
        : [],
      biomarkers:
        parsed.biomarkers && typeof parsed.biomarkers === "object"
          ? parsed.biomarkers
          : {},
    };
  } catch {
    return null;
  }
}

/** True when the profile has enough to run a search. */
export function isProfileSearchable(profile: Profile): boolean {
  return profile.diagnosis.trim().length > 0;
}
