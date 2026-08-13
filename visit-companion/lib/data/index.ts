import raw from "./fixtures.json";

export const DEMO_PATIENT = raw.DEMO_PATIENT;
export const DEMO_TRANSCRIPT = raw.DEMO_TRANSCRIPT as Record<string, unknown>[];
export const FALLBACK_BRIEF = raw.FALLBACK_BRIEF as Record<string, unknown>;
export const FALLBACK_TRIALS = raw.FALLBACK_TRIALS as Record<string, unknown>[];
export const FALLBACK_RECAP = raw.FALLBACK_RECAP as Record<string, unknown>;
export const FALLBACK_TRANSLATIONS = raw.FALLBACK_TRANSLATIONS as Record<
  string,
  Record<string, string>
>;
export const LANGUAGES = raw.LANGUAGES as { code: string; label: string; native: string }[];
export const READING_LEVELS = raw.READING_LEVELS as { code: string; label: string; hint: string }[];

export function formatHistory(history?: Record<string, string> | null) {
  if (!history) return "";
  const labels: Record<string, string> = {
    age_range: "Age range",
    other_conditions: "Other conditions they mentioned",
    medications: "Medicines they already take",
    allergies: "Allergies",
    family_history: "Family health history",
  };
  return Object.entries(labels)
    .map(([key, label]) => {
      const value = String(history[key] || "").trim();
      if (!value || value === "prefer_not" || value === "prefer-not") return "";
      return `${label}: ${value}`;
    })
    .filter(Boolean)
    .join("\n");
}

export function languageName(code: string) {
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.label} (${lang.native})` : "English";
}

export function readingHint(code: string) {
  return READING_LEVELS.find((l) => l.code === code)?.hint || READING_LEVELS[0].hint;
}
