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
      preVisitNotes:
        "Fatigue is worst before noon, morning stiffness lasts longer than it used to, and headaches show up after long work days. I want to explain what changed since the last visit without rambling.",
      possibleConditions:
        "Ask whether the flare pattern could point to inflammation getting worse, medication side effects, or something new the labs can clarify.",
      questionsForDoctor: [
        "What changed since my last labs?",
        "What should I track between now and the next visit?",
        "When should I call sooner instead of waiting?",
      ],
      whatToExpectNotes:
        "Bring the symptom log, current medication list, and ask for plain-language explanations if new treatment options come up.",
      duringVisitNotes:
        "Listen for what the labs are meant to rule in or rule out. Write down any follow-up tests before leaving.",
      visitTerms: ["inflammation markers", "follow-up labs"],
      remainingQuestions: [
        "How long should I wait before expecting improvement?",
        "What side effects should I watch for at home?",
      ],
      languageSupportPlan:
        "If anything moves too fast, ask the doctor to pause and repeat the main point in plain language.",
      duringKeyPoints:
        "Focus on test results, treatment timing, and what changes would mean I should message the clinic early.",
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
        preVisitNotes: visit.preVisitNotes ?? "",
        possibleConditions: visit.possibleConditions ?? "",
        questionsForDoctor: visit.questionsForDoctor ?? [],
        whatToExpectNotes: visit.whatToExpectNotes ?? "",
        duringVisitNotes: visit.duringVisitNotes ?? "",
        visitTerms: visit.visitTerms ?? [],
        remainingQuestions: visit.remainingQuestions ?? [],
        languageSupportPlan: visit.languageSupportPlan ?? "",
        duringKeyPoints: visit.duringKeyPoints ?? "",
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
