// The single OpenAI comparison call for one trial vs. one patient profile.

import { getOpenAI, MATCH_MODEL } from "./openai";
import type {
  ExclusionItem,
  InclusionItem,
  MatchResult,
  Profile,
  Trial,
  Verdict,
} from "./types";

export const SYSTEM_PROMPT = `You are comparing a patient profile against clinical trial eligibility criteria. Return ONLY JSON, no markdown fences:
{
  "verdict": "likely_eligible" | "needs_info" | "likely_ineligible",
  "inclusion": [{ "criterion": "<verbatim text>", "status": "met"|"not_met"|"unknown", "reason": "<one sentence>" }],
  "exclusion": [{ "criterion": "<verbatim text>", "status": "triggered"|"clear"|"unknown", "reason": "<one sentence>" }],
  "questionsForDoctor": ["<question>"]
}
Rules:
- Never infer a value not present in the profile — mark it "unknown".
- If your reason would say the profile is unclear, silent, or missing information on a criterion, the status MUST be "unknown" — never "not_met" or "triggered". Reserve "not_met"/"triggered" for a direct, explicit conflict with a value stated in the profile.
- The "criterion" field must be copied verbatim from the source text, never paraphrased.
- Inclusion items use ONLY "met" | "not_met" | "unknown".
- Exclusion items use ONLY "triggered" | "clear" | "unknown", where "triggered" means the exclusion applies to this patient (they would be excluded) and "clear" means it does not apply. Never use "met"/"not_met" on an exclusion item.
- Choose "likely_ineligible" only when a criterion clearly conflicts with the profile.
- Choose "likely_eligible" only when no criterion conflicts and the key inclusion criteria are met.
- Otherwise choose "needs_info".`;

function buildUserPrompt(profile: Profile, trial: Trial): string {
  return [
    "PATIENT PROFILE (JSON):",
    JSON.stringify(
      {
        age: profile.age,
        sex: profile.sex || null,
        diagnosis: profile.diagnosis || null,
        stage: profile.stage || null,
        priorTreatments: profile.priorTreatments,
        biomarkers: profile.biomarkers,
      },
      null,
      2,
    ),
    "",
    `TRIAL: ${trial.nctId} — ${trial.briefTitle}`,
    `Phases: ${trial.phases.join(", ") || "n/a"}`,
    `Sex: ${trial.sex ?? "n/a"} | Min age: ${trial.minimumAge ?? "n/a"} | Max age: ${trial.maximumAge ?? "n/a"}`,
    "",
    "ELIGIBILITY CRITERIA (verbatim source text):",
    trial.eligibilityCriteria || "(none provided)",
  ].join("\n");
}

const VALID_VERDICTS: Verdict[] = [
  "likely_eligible",
  "needs_info",
  "likely_ineligible",
];

/**
 * Models sometimes reach for the inclusion vocabulary on exclusion items.
 * Map those onto the exclusion vocabulary rather than dropping to "unknown":
 * an exclusion that is "met" applies to the patient (triggered), one that is
 * "not_met" does not (clear).
 */
function normalizeInclusion(item: InclusionItem): InclusionItem {
  const raw = String(item?.status ?? "");
  const status: InclusionItem["status"] =
    raw === "met" || raw === "not_met" || raw === "unknown"
      ? raw
      : raw === "clear"
        ? "met"
        : raw === "triggered"
          ? "not_met"
          : "unknown";
  return {
    criterion: String(item?.criterion ?? ""),
    status,
    reason: String(item?.reason ?? ""),
  };
}

function normalizeExclusion(item: ExclusionItem): ExclusionItem {
  const raw = String(item?.status ?? "");
  const status: ExclusionItem["status"] =
    raw === "triggered" || raw === "clear" || raw === "unknown"
      ? raw
      : raw === "met"
        ? "triggered"
        : raw === "not_met"
          ? "clear"
          : "unknown";
  return {
    criterion: String(item?.criterion ?? ""),
    status,
    reason: String(item?.reason ?? ""),
  };
}

/** Defensive parse: strip accidental fences, coerce to our shape. */
function parseResult(raw: string): MatchResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const data = JSON.parse(cleaned) as Partial<MatchResult>;

  const verdict: Verdict = VALID_VERDICTS.includes(data.verdict as Verdict)
    ? (data.verdict as Verdict)
    : "needs_info";

  return {
    verdict,
    inclusion: (Array.isArray(data.inclusion) ? data.inclusion : [])
      .map(normalizeInclusion)
      .filter((i) => i.criterion.length > 0),
    exclusion: (Array.isArray(data.exclusion) ? data.exclusion : [])
      .map(normalizeExclusion)
      .filter((i) => i.criterion.length > 0),
    questionsForDoctor: (Array.isArray(data.questionsForDoctor)
      ? data.questionsForDoctor
      : []
    )
      .map((q) => String(q ?? "").trim())
      .filter(Boolean),
  };
}

export async function matchTrial(
  profile: Profile,
  trial: Trial,
): Promise<MatchResult> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: MATCH_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(profile, trial) },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content) throw new Error("Empty response from model");
  return parseResult(content);
}
