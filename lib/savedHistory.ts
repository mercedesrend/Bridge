"use client";

import { inferAppointmentInputs } from "./appointments";
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
      treatmentOptions: [
        {
          id: "tx-watchful-waiting",
          name: "Watchful waiting with symptom tracking",
          whatItIs:
            "Keep the current plan in place, track symptoms closely, and review changes after new labs come back.",
          benefits:
            "Avoids changing treatment too quickly and gives the care team cleaner information about patterns over time.",
          tradeoffs:
            "Relief may stay limited in the short term, and it can feel frustrating if symptoms keep interrupting daily life.",
          questions: [
            "What changes would mean this plan is no longer enough?",
            "How long should I try this before we revisit treatment?",
          ],
          status: "considering",
        },
        {
          id: "tx-med-change",
          name: "Medication adjustment",
          whatItIs:
            "Consider stepping up treatment if the new labs and symptom log suggest the current medication is not doing enough.",
          benefits:
            "Could improve inflammation control and reduce fatigue or stiffness faster if disease activity is climbing.",
          tradeoffs:
            "May bring new side effects, extra monitoring, or time spent figuring out whether the change is working.",
          questions: [
            "What side effects should I watch for?",
            "How would we know if the adjustment is helping?",
          ],
          status: "preferred",
        },
      ],
      secondOpinionReasons: [
        "I want another explanation of the treatment trade-offs in plain language.",
        "I want to know whether there are options we have not discussed yet.",
      ],
      recordsRequestPlan:
        "Request the last clinic note, current medication list, recent labs, and imaging before booking another consult.",
      specialistSearchNotes:
        "Look for a rheumatologist who focuses on inflammatory arthritis and accepts outside records before the first visit.",
      secondOpinionQuestions: [
        "If you were starting from scratch, what treatment path would you consider first?",
        "What records matter most before the consult?",
      ],
      decisionsMade:
        "Ordered updated labs, asked to keep a symptom log, and planned to revisit treatment options after results come back.",
      followUpPlan:
        "Request lab results in the portal, track symptom changes for two weeks, and bring the updated question list to the next appointment.",
      prescriptions:
        "Continue current anti-inflammatory as directed. No new prescriptions started at this visit.",
      nextAppointmentDate: "2026-08-14",
      nextAppointmentTime: "10:30",
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
      visits: parsed.visits.map((visit) => {
        const inferred = inferAppointmentInputs(visit.nextAppointment ?? "");
        return {
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
          treatmentOptions: visit.treatmentOptions ?? [],
          secondOpinionReasons: visit.secondOpinionReasons ?? [],
          recordsRequestPlan: visit.recordsRequestPlan ?? "",
          specialistSearchNotes: visit.specialistSearchNotes ?? "",
          secondOpinionQuestions: visit.secondOpinionQuestions ?? [],
          prescriptions: visit.prescriptions ?? "",
          nextAppointmentDate: visit.nextAppointmentDate ?? inferred.date,
          nextAppointmentTime: visit.nextAppointmentTime ?? inferred.time,
          nextAppointment: visit.nextAppointment ?? "",
        };
      }),
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
