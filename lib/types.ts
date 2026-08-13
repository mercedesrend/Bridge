// Shared domain types for TrialLens.

export type Sex = "male" | "female" | "other";

/** Patient profile captured on the intake form (screen 1). */
export interface Profile {
  age: number | null;
  sex: Sex | "";
  diagnosis: string;
  stage: string;
  priorTreatments: string[];
  biomarkers: Record<string, string>;
  zip: string;
  radiusMiles: number;
}

/** A single trial site. Any field can be missing in the source data. */
export interface TrialLocation {
  facility: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lon: number | null;
}

/** A trial normalized from the ClinicalTrials.gov v2 response. */
export interface Trial {
  nctId: string;
  briefTitle: string;
  phases: string[];
  eligibilityCriteria: string;
  minimumAge: string | null;
  maximumAge: string | null;
  sex: string | null;
  locations: TrialLocation[];
}

export type Verdict = "likely_eligible" | "needs_info" | "likely_ineligible";

export interface InclusionItem {
  criterion: string;
  status: "met" | "not_met" | "unknown";
  reason: string;
}

export interface ExclusionItem {
  criterion: string;
  status: "triggered" | "clear" | "unknown";
  reason: string;
}

/** Structured comparison returned by the /api/match OpenAI call. */
export interface MatchResult {
  verdict: Verdict;
  inclusion: InclusionItem[];
  exclusion: ExclusionItem[];
  questionsForDoctor: string[];
}

/** Client-side per-trial state as results stream in on /matches. */
export interface RankedMatch {
  trial: Trial;
  status: "pending" | "done" | "error";
  result: MatchResult | null;
  error: string | null;
  /** Miles from patient ZIP to nearest site, or null if not computable. */
  distanceMiles: number | null;
  nearestLocation: TrialLocation | null;
}

export interface SavedDocument {
  id: string;
  visitId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  dataUrl: string;
}

export interface VisitRecord {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  location: string;
  summary: string;
  symptomsDiscussed: string[];
  decisionsMade: string;
  followUpPlan: string;
  /** Free-text meds / prescriptions mentioned at this visit. */
  prescriptions: string;
  nextAppointment: string;
}
