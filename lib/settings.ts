"use client";

export const SETTINGS_STORAGE_KEY = "bridge:settings";
export const ASK_THREAD_STORAGE_KEY = "bridge:ask-thread";
export const SAVED_HISTORY_STORAGE_KEY = "bridge:saved-history";

export const INTERFACE_LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "Mandarin Chinese",
  "Cantonese",
  "Arabic",
  "Portuguese",
  "Hindi",
  "Vietnamese",
  "Korean",
  "Russian",
  "Tagalog",
  "Haitian Creole",
  "Urdu",
] as const;

export const TRANSLATION_LANGUAGE_OPTIONS = [
  "Spanish",
  "English",
  "Mandarin Chinese",
  "Cantonese",
  "Arabic",
  "French",
  "Portuguese",
  "Hindi",
  "Vietnamese",
  "Korean",
  "Russian",
  "Tagalog",
  "Haitian Creole",
  "Urdu",
] as const;

const LANGUAGE_SHORT_LABELS: Record<string, string> = {
  English: "EN",
  Spanish: "ES",
  French: "FR",
  "Mandarin Chinese": "ZH",
  Cantonese: "YUE",
  Arabic: "AR",
  Portuguese: "PT",
  Hindi: "HI",
  Vietnamese: "VI",
  Korean: "KO",
  Russian: "RU",
  Tagalog: "TL",
  "Haitian Creole": "HT",
  Urdu: "UR",
};

export interface BridgeSettings {
  interfaceLanguage: string;
  translationLanguage: string;
}

const DEFAULT_SETTINGS: BridgeSettings = {
  interfaceLanguage: "English",
  translationLanguage: "Spanish",
};

export function shortLanguageLabel(language: string) {
  return LANGUAGE_SHORT_LABELS[language] ?? language.slice(0, 2).toUpperCase();
}

export function loadBridgeSettings(): BridgeSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<BridgeSettings>;
    return {
      interfaceLanguage:
        typeof parsed.interfaceLanguage === "string"
          ? parsed.interfaceLanguage
          : DEFAULT_SETTINGS.interfaceLanguage,
      translationLanguage:
        typeof parsed.translationLanguage === "string"
          ? parsed.translationLanguage
          : DEFAULT_SETTINGS.translationLanguage,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveBridgeSettings(settings: BridgeSettings) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function clearSavedHistory() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SAVED_HISTORY_STORAGE_KEY);
}

export function clearAskBridgeThread() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(ASK_THREAD_STORAGE_KEY);
}

export function clearAllLocalBridgeData() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  window.localStorage.removeItem(SAVED_HISTORY_STORAGE_KEY);
  window.sessionStorage.removeItem(ASK_THREAD_STORAGE_KEY);
}
