// Shared contract for the Ask Bridge chat panel: what the client sends, what
// the model is allowed to say, and which prompts we suggest on each screen.

import type { Profile } from "./types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

/** What the panel tells the server about where the user is standing. */
export interface AskContext {
  pathname: string;
  /** Human label for the section, e.g. "Clinical Trials". */
  label: string;
  /** Present only when the current URL carries an encoded profile. */
  profile?: Profile | null;
}

export interface AskRequestBody {
  messages: Pick<ChatMessage, "role" | "content">[];
  context: AskContext;
}

/** Keeps one turn from blowing past the model's context or our token budget. */
export const MAX_MESSAGE_CHARS = 4000;
/** How many prior turns travel with each request. */
export const MAX_HISTORY = 16;

export const SYSTEM_PROMPT = `You are Bridge, a healthcare advocate assistant. You help patients — especially immigrants and families navigating an unfamiliar healthcare system — prepare for appointments, understand what they were told, and explore clinical trials.

You are an informational tool. You are not a clinician and you do not provide medical advice.

Hard rules:
- Never diagnose, never recommend or rule out a treatment, and never suggest doses.
- Never tell someone they qualify for, are eligible for, or will be accepted into a clinical trial. Final eligibility is determined by the trial site, not this tool. You may say a trial is "worth asking your care team about."
- Never invent trial names, NCT numbers, statistics, clinic names, or study results. If you do not know, say so and say where the person can find it (their care team, ClinicalTrials.gov, the clinic's patient portal).
- If the message describes a medical emergency — chest pain, trouble breathing, stroke symptoms, heavy bleeding, thoughts of self-harm — say to call 911 or go to the nearest emergency room, and stop there.
- Do not ask for or repeat back identifying details like full name, address, insurance ID, or social security number.

How to answer:
- Plain language at roughly an 8th-grade reading level. Define any medical term the first time you use it.
- Be brief: about 150 words. Short paragraphs, or 3-5 short bullets when listing.
- Be concrete and next-step oriented. When it fits, end with one question the person can bring to their care team.
- If the person writes in another language, answer in that language.
- Warm and steady. No false reassurance, no alarm.`;

const LABELS: [test: RegExp, label: string][] = [
  [/^\/home$/, "Home"],
  [/^\/$/, "Bridge landing"],
  [/^\/before/, "Before Appointment"],
  [/^\/during/, "During Appointment"],
  [/^\/after/, "After Appointment"],
  [/^\/settings/, "Settings"],
  [/^\/support/, "Support"],
  [/^\/treatment-options/, "Treatment Options"],
  [/^\/second-opinions/, "Second Opinions"],
  [/^\/saved/, "Saved & Notes"],
  [/^\/(profile|matches|trial|questions)/, "Clinical Trials"],
];

export function labelForPath(pathname: string): string {
  return LABELS.find(([test]) => test.test(pathname))?.[1] ?? "Bridge";
}

const PROMPTS: Record<string, string[]> = {
  Home: [
    "What should I do before my next appointment?",
    "How do I explain my symptoms clearly?",
    "What is a clinical trial, in simple terms?",
  ],
  "Before Appointment": [
    "Help me write questions for my doctor",
    "What should I bring to my appointment?",
    "How do I ask for an interpreter?",
  ],
  "During Appointment": [
    "What should I write down during the visit?",
    "How do I ask my doctor to slow down?",
    "What if I do not understand the answer?",
  ],
  "After Appointment": [
    "Help me understand my visit summary",
    "What questions should I follow up on?",
    "How do I get a copy of my records?",
  ],
  "Treatment Options": [
    "What questions should I ask about a treatment?",
    "How do I compare two treatment options?",
    "What does standard of care mean?",
  ],
  "Second Opinions": [
    "How do I ask for a second opinion?",
    "Will my doctor be offended if I ask?",
    "What should I bring to a second opinion visit?",
  ],
  "Clinical Trials": [
    "What do these eligibility criteria mean?",
    "What should I ask before joining a trial?",
    "Who pays for care during a trial?",
  ],
  "Saved & Notes": [
    "Help me organize my notes for my next visit",
    "What is worth saving from an appointment?",
    "How do I keep track of my medications?",
  ],
  Settings: [
    "How do I ask for an interpreter?",
    "What language support should I request before a visit?",
    "What information is safe to share here?",
  ],
  Support: [
    "How can Bridge help me prepare for a visit?",
    "What should I do if I feel lost after an appointment?",
    "How do I organize my questions before I see my doctor?",
  ],
};

export function suggestedPrompts(label: string): string[] {
  return PROMPTS[label] ?? PROMPTS.Home;
}

/** Opening line the panel shows before the first question. */
export function emptyStateFor(label: string): string {
  switch (label) {
    case "Clinical Trials":
      return "Ask about eligibility criteria, what a trial involves, or what to ask the study team. Bridge never says you qualify — the trial site decides that.";
    case "Before Appointment":
      return "Ask how to describe your symptoms, what to bring, or what questions are worth asking.";
    case "During Appointment":
      return "Ask what to write down, how to ask for an interpreter, or how to slow the conversation down.";
    case "After Appointment":
      return "Ask what your visit summary means, what to follow up on, or where to go next.";
    default:
      return "Ask about your appointment, your options, or anything you did not get to ask your doctor.";
  }
}

/** Compact profile summary for the model — omitted entirely when empty. */
export function describeProfile(profile: Profile | null | undefined): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.age != null) parts.push(`Age: ${profile.age}`);
  if (profile.sex) parts.push(`Sex: ${profile.sex}`);
  if (profile.diagnosis) parts.push(`Diagnosis: ${profile.diagnosis}`);
  if (profile.stage) parts.push(`Stage: ${profile.stage}`);
  if (profile.priorTreatments?.length) {
    parts.push(`Prior treatments: ${profile.priorTreatments.join(", ")}`);
  }
  const biomarkers = Object.entries(profile.biomarkers ?? {});
  if (biomarkers.length) {
    parts.push(
      `Biomarkers: ${biomarkers.map(([k, v]) => `${k} ${v}`).join(", ")}`,
    );
  }
  return parts.join("\n");
}
