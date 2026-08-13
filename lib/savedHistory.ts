"use client";

import type { SavedDocument, VisitRecord } from "./types";

const STORAGE_KEY = "bridge:saved-history";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export interface SavedHistoryState {
  visits: VisitRecord[];
  documents: SavedDocument[];
}

const SEEDED_STATE: SavedHistoryState = {
  visits: [
    {
      id: "visit-2026-08-01",
      date: "2026-08-01",
      doctor: "Dr. Sarah Kim",
      specialty: "Rheumatology",
      location: "Mount Sinai Medical Center",
      summary:
        "Talked through worsening fatigue and joint pain. Reviewed what has changed since the last visit and narrowed the next questions for treatment planning.",
      symptomsDiscussed: ["fatigue", "joint pain", "morning stiffness"],
      decisionsMade:
        "Ordered updated labs, asked to keep a symptom log, and planned to revisit treatment options after results come back.",
      followUpPlan:
        "Request lab results in the portal, track symptom changes for two weeks, and bring the updated question list to the next appointment.",
      prescriptions:
        "Continue current anti-inflammatory as directed. No new prescriptions started at this visit.",
      nextAppointment: "2026-08-14 10:30 AM",
    },
  ],
  documents: [],
};

export function maxUploadBytes() {
  return MAX_UPLOAD_BYTES;
}

export function loadSavedHistory(): SavedHistoryState {
  if (typeof window === "undefined") {
    return SEEDED_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEEDED_STATE;
    }
    const parsed = JSON.parse(raw) as SavedHistoryState;
    if (!Array.isArray(parsed.visits) || !Array.isArray(parsed.documents)) {
      return SEEDED_STATE;
    }
    return {
      ...parsed,
      visits: parsed.visits.map((visit) => ({
        ...visit,
        prescriptions: visit.prescriptions ?? "",
      })),
    };
  } catch {
    return SEEDED_STATE;
  }
}

export function saveSavedHistory(state: SavedHistoryState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function makeSavedId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
