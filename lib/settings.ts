"use client";

export const SETTINGS_STORAGE_KEY = "bridge:settings";
export const ASK_THREAD_STORAGE_KEY = "bridge:ask-thread";
export const SAVED_HISTORY_STORAGE_KEY = "bridge:saved-history";

export interface BridgeSettings {
  interfaceLanguage: string;
  translationLanguage: string;
}

const DEFAULT_SETTINGS: BridgeSettings = {
  interfaceLanguage: "English",
  translationLanguage: "Spanish",
};

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
