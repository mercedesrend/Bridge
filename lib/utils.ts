import { QuestionItem, RecapState, TreatmentOption } from "@/lib/types";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function uniqueQuestions(options: TreatmentOption[], existing: QuestionItem[]) {
  const byText = new Map(existing.map((question) => [question.text.trim().toLowerCase(), question]));
  const merged: QuestionItem[] = [...existing];

  for (const option of options) {
    for (const text of option.questionsToAsk) {
      const key = text.trim().toLowerCase();
      if (byText.has(key)) {
        continue;
      }
      const nextQuestion: QuestionItem = {
        id: makeId("question"),
        text,
        selected: merged.filter((item) => item.selected).length < 8,
        isCustom: false,
        optionId: option.id,
        status: "pending",
        note: "",
        carryForward: false
      };
      byText.set(key, nextQuestion);
      merged.push(nextQuestion);
    }
  }

  return merged;
}

export function clampSelectedQuestions(questions: QuestionItem[]) {
  let selectedCount = 0;
  return questions.map((question) => {
    if (!question.selected) {
      return question;
    }
    selectedCount += 1;
    if (selectedCount <= 8) {
      return question;
    }
    return { ...question, selected: false };
  });
}

export function encodeShareState(state: RecapState) {
  if (typeof window === "undefined") {
    return "";
  }
  return window.btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function decodeShareState(encoded: string): RecapState | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json) as RecapState;
  } catch {
    return null;
  }
}
