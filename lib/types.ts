export type PhaseKey = "before" | "during" | "after";

export type PatientProfile = {
  condition: string;
  stage: string;
  age: string;
  sex: string;
  priorTreatments: string[];
  zip: string;
  rawDescription: string;
};

export type SourceChip = {
  label: string;
  href: string;
  kind: "openfda" | "trial" | "medline";
};

export type OptionCategory = "standard" | "trials-now" | "coming-soon";

export type TreatmentOption = {
  id: string;
  category: OptionCategory;
  plainName: string;
  sourceTitle: string;
  whatItIs: string | null;
  howItsGiven: string | null;
  whyItMightComeUp: string | null;
  questionsToAsk: string[];
  sourceText: string;
  chips: SourceChip[];
};

export type OptionsResponse = {
  overview: {
    title: string;
    summary: string;
    href: string;
    chip: SourceChip | null;
  } | null;
  sections: Record<OptionCategory, TreatmentOption[]>;
};

export type QuestionItem = {
  id: string;
  text: string;
  selected: boolean;
  isCustom: boolean;
  optionId: string | null;
  status: "pending" | "answered" | "skipped";
  note: string;
  carryForward: boolean;
};

export type VisitSnapshot = {
  questions: QuestionItem[];
};

export type RecapState = {
  profile: PatientProfile | null;
  options: TreatmentOption[];
  selectedOptionIds: string[];
  questions: QuestionItem[];
  suggestedNextSteps: string[];
};
