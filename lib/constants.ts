import { PatientProfile } from "@/lib/types";

export const STORAGE_KEYS = {
  profile: "prepdoc.profile",
  options: "prepdoc.options",
  selectedOptionIds: "prepdoc.selectedOptionIds",
  questions: "prepdoc.questions",
  recapSteps: "prepdoc.recapSteps"
} as const;

export const SAMPLE_PROFILE: PatientProfile = {
  condition: "metastatic breast cancer",
  stage: "stage IV",
  age: "58",
  sex: "Female",
  priorTreatments: ["Hormone therapy", "CDK4/6 inhibitor"],
  zip: "98101",
  rawDescription:
    "My doctor said my metastatic breast cancer has grown after hormone therapy and wants to talk about chemo, trials, and next steps."
};

export const CATEGORY_LABELS = {
  standard: "Standard of care",
  "trials-now": "In trials now",
  "coming-soon": "Possibly coming soon"
} as const;
