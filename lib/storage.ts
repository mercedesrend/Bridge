"use client";

import { STORAGE_KEYS } from "@/lib/constants";
import { PatientProfile, QuestionItem, TreatmentOption } from "@/lib/types";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readProfile() {
  return readJson<PatientProfile | null>(STORAGE_KEYS.profile, null);
}

export function saveProfile(profile: PatientProfile) {
  writeJson(STORAGE_KEYS.profile, profile);
}

export function readOptions() {
  return readJson<TreatmentOption[]>(STORAGE_KEYS.options, []);
}

export function saveOptions(options: TreatmentOption[]) {
  writeJson(STORAGE_KEYS.options, options);
}

export function readSelectedOptionIds() {
  return readJson<string[]>(STORAGE_KEYS.selectedOptionIds, []);
}

export function saveSelectedOptionIds(optionIds: string[]) {
  writeJson(STORAGE_KEYS.selectedOptionIds, optionIds);
}

export function readQuestions() {
  return readJson<QuestionItem[]>(STORAGE_KEYS.questions, []);
}

export function saveQuestions(questions: QuestionItem[]) {
  writeJson(STORAGE_KEYS.questions, questions);
}

export function readRecapSteps() {
  return readJson<string[]>(STORAGE_KEYS.recapSteps, []);
}

export function saveRecapSteps(steps: string[]) {
  writeJson(STORAGE_KEYS.recapSteps, steps);
}
