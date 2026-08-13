// Centralized UI copy so the required safety language stays consistent.
// Rules: never say "you qualify" / "you are eligible."

import type { Verdict } from "./types";

export const SITE_DETERMINES =
  "Final eligibility is determined by the trial site, not this tool.";

export const WORTH_ASKING = "Worth asking your care team about.";

export const VERDICT_LABEL: Record<Verdict, string> = {
  likely_eligible: "Worth asking about",
  needs_info: "More info needed",
  likely_ineligible: "Likely not a fit",
};

export const VERDICT_BLURB: Record<Verdict, string> = {
  likely_eligible:
    "Nothing in your profile conflicts with the listed criteria. Worth asking your care team about.",
  needs_info:
    "Some criteria depend on details not in your profile. Your care team can help fill these in.",
  likely_ineligible:
    "One or more criteria appear not to match. Your care team can confirm.",
};

// Sort weight: eligible first, then needs_info, then ineligible.
export const VERDICT_RANK: Record<Verdict, number> = {
  likely_eligible: 0,
  needs_info: 1,
  likely_ineligible: 2,
};
