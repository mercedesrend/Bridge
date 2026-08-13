// Fetch + normalize studies from the ClinicalTrials.gov v2 API (no auth).
// Every field in the source can be null/empty, so guard every access.

import type { Trial, TrialLocation } from "./types";

const BASE = "https://clinicaltrials.gov/api/v2/studies";

const FIELDS = [
  "NCTId",
  "BriefTitle",
  "Phase",
  "EligibilityCriteria",
  "MinimumAge",
  "MaximumAge",
  "Sex",
  "LocationFacility",
  "LocationCity",
  "LocationState",
  "LocationZip",
  "LocationGeoPoint",
].join(",");

// The v2 response nests each study under protocolSection.<module>.
// We use loose shapes here because any node may be absent.
interface RawGeoPoint {
  lat?: number;
  lon?: number;
}
interface RawLocation {
  facility?: string;
  city?: string;
  state?: string;
  zip?: string;
  geoPoint?: RawGeoPoint;
}
interface RawStudy {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string };
    designModule?: { phases?: string[] };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      minimumAge?: string;
      maximumAge?: string;
      sex?: string;
    };
    contactsLocationsModule?: { locations?: RawLocation[] };
  };
}

function normalizeLocation(raw: RawLocation): TrialLocation {
  const geo = raw?.geoPoint ?? {};
  return {
    facility: raw?.facility ?? null,
    city: raw?.city ?? null,
    state: raw?.state ?? null,
    zip: raw?.zip ?? null,
    lat: typeof geo.lat === "number" ? geo.lat : null,
    lon: typeof geo.lon === "number" ? geo.lon : null,
  };
}

/**
 * The registry escapes markdown-significant characters in criteria text, so the
 * raw string contains artifacts like "\>10 mg/day". Unescape them: users would
 * otherwise read the backslashes, and the model has to copy criteria verbatim.
 */
function unescapeCriteria(text: string): string {
  return text.replace(/\\([<>*_[\]()#+\-.!`])/g, "$1");
}

function normalizeStudy(raw: RawStudy): Trial | null {
  const p = raw?.protocolSection;
  const nctId = p?.identificationModule?.nctId;
  if (!nctId) return null; // Skip anything we can't key on.

  const rawLocations = Array.isArray(p?.contactsLocationsModule?.locations)
    ? p!.contactsLocationsModule!.locations!
    : [];

  return {
    nctId,
    briefTitle: p?.identificationModule?.briefTitle ?? "Untitled study",
    phases: Array.isArray(p?.designModule?.phases) ? p!.designModule!.phases! : [],
    eligibilityCriteria: unescapeCriteria(
      p?.eligibilityModule?.eligibilityCriteria ?? "",
    ),
    minimumAge: p?.eligibilityModule?.minimumAge ?? null,
    maximumAge: p?.eligibilityModule?.maximumAge ?? null,
    sex: p?.eligibilityModule?.sex ?? null,
    locations: rawLocations.map(normalizeLocation),
  };
}

/** Fetch up to `pageSize` recruiting trials matching a condition. */
export async function fetchTrials(condition: string, pageSize = 40): Promise<Trial[]> {
  const params = new URLSearchParams({
    "query.cond": condition,
    "filter.overallStatus": "RECRUITING", // case-sensitive exact string
    fields: FIELDS,
    pageSize: String(pageSize),
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    // Trials data is slow-moving; cache briefly to speed repeat searches.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`ClinicalTrials.gov returned ${res.status}`);
  }

  const data = (await res.json()) as { studies?: RawStudy[] };
  const studies = Array.isArray(data?.studies) ? data.studies : [];
  return studies
    .map(normalizeStudy)
    .filter((t): t is Trial => t !== null);
}

/** Fetch a single trial by NCT id (used by the detail page). */
export async function fetchTrialByNct(nctId: string): Promise<Trial | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(nctId)}?fields=${FIELDS}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const raw = (await res.json()) as RawStudy;
  return normalizeStudy(raw);
}
