import { getOpenAIClient, resolveModelId } from "@/lib/openai";
import { PatientProfile, TreatmentOption } from "@/lib/types";

const STRUCTURED_MODEL = resolveModelId(
  process.env.OPENAI_MODEL || "gpt-4.1-nano"
);

function extractText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("No structured output returned");
  }

  if ("output_text" in payload && typeof payload.output_text === "string") {
    return payload.output_text;
  }

  throw new Error("Missing output_text");
}

export async function parsePatientProfile(rawDescription: string) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: STRUCTURED_MODEL,
    input: [
      {
        role: "system",
        content:
          "Extract a patient profile from the user's description. Return JSON only."
      },
      {
        role: "user",
        content: rawDescription
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "patient_profile",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            condition: { type: "string" },
            stage: { type: "string" },
            age: { type: "string" },
            sex: { type: "string" },
            priorTreatments: {
              type: "array",
              items: { type: "string" }
            },
            zip: { type: "string" }
          },
          required: ["condition", "stage", "age", "sex", "priorTreatments", "zip"]
        }
      }
    }
  });

  return JSON.parse(extractText(response)) as Omit<PatientProfile, "rawDescription">;
}

export async function rewriteOption(option: {
  sourceText: string;
  sourceTitle: string;
  profile: PatientProfile;
}) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: STRUCTURED_MODEL,
    input: [
      {
        role: "system",
        content: [
          "Rewrite clinical text at a 7th-grade reading level for a patient with no medical background.",
          "Return JSON only.",
          "Do not state efficacy, survival rates, or success percentages.",
          "Do not recommend, rank, or compare options.",
          "Do not introduce any treatment not present in the provided source text.",
          "If the source text is too thin to summarize, return whatItIs as null."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(option)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "plain_language_option",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            plainName: { type: "string" },
            whatItIs: {
              type: ["string", "null"]
            },
            howItsGiven: {
              type: ["string", "null"]
            },
            whyItMightComeUp: {
              type: ["string", "null"]
            },
            questionsToAsk: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: [
            "plainName",
            "whatItIs",
            "howItsGiven",
            "whyItMightComeUp",
            "questionsToAsk"
          ]
        }
      }
    }
  });

  return JSON.parse(extractText(response)) as Pick<
    TreatmentOption,
    "plainName" | "whatItIs" | "howItsGiven" | "whyItMightComeUp" | "questionsToAsk"
  >;
}

export async function suggestNextSteps(payload: {
  profile: PatientProfile;
  questions: { text: string; note: string; status: string }[];
}) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: STRUCTURED_MODEL,
    input: [
      {
        role: "system",
        content: [
          "Turn visit notes into concrete next steps only.",
          "No medical advice.",
          "No interpretation of what the doctor said.",
          "Only suggest actions like scheduling, requesting records, or bringing a question to the next visit.",
          "Return JSON only."
        ].join(" ")
      },
      {
        role: "user",
        content: JSON.stringify(payload)
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "next_steps",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            steps: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["steps"]
        }
      }
    }
  });

  return JSON.parse(extractText(response)) as { steps: string[] };
}
