import {
  FALLBACK_BRIEF,
  FALLBACK_TRIALS,
  formatHistory,
  languageName,
  readingHint,
} from "@/lib/data";
import { completeJson } from "@/lib/llm";
import { gatherEvidence } from "@/lib/research";

const SYSTEM = `You write pre-appointment briefings for patients. You are not a \
doctor and you never diagnose, never tell someone what treatment to take, and \
never predict outcomes. You explain what exists and what to ask.

Hard rules:
- Use ONLY the evidence provided in the prompt. Never invent a study, a drug, \
a statistic, or a source. If the evidence does not cover something, leave it out.
- Never state or imply that the patient has a condition. Say "people with X" \
or "if you have X".
- Frame every treatment as something to ASK ABOUT, not something to take.
- Write for a first-generation patient or family translator who may be \
scared, polite in the exam room, and deciding with relatives afterward.
- Never mention symptoms they did not write. If they wrote tiredness and \
weak joints, do not add thirst, blurry vision, or any other symptom.
- Output valid JSON only. No prose, no markdown fences.`;

const SCHEMA = `{
  "plain_summary": "2-4 sentences explaining the condition in everyday words",
  "personalized_note": "2 sentences tying THEIR history and symptoms to what to ask first. Empty if they shared nothing.",
  "key_numbers": [{"label": "", "meaning": "", "typical_target": ""}],
  "standard_treatments": [{"name": "", "what_it_is": "", "why_it_matters": "", "common_side_effects": "", "status": ""}],
  "emerging_options": [{"name": "", "what_it_is": "", "why_ask": "", "status": ""}],
  "questions": [{"question": "", "why": "", "priority": "high|medium|low"}],
  "visit_tips": [{"tip": ""}],
  "red_flags": [{"sign": "", "action": ""}]
}`;

function looksLikeDiabetes(condition: string) {
  const c = (condition || "").toLowerCase();
  return ["diabetes", "diabet", "a1c", "metformin", "glucosa"].some((w) => c.includes(w));
}

const SYMPTOM_MARKERS = [
  ["thirst", "thirsty", "polidipsia", " sed", "sed "],
  ["blurr", "vision", "retinal", "eye exam", "eye doctor", "vista", "ojos"],
];

function userBlob(condition: string, symptoms: string, context: string, history?: Record<string, string> | null) {
  return [condition, symptoms, context, formatHistory(history)].filter(Boolean).join(" ").toLowerCase();
}

function inventsSymptoms(text: string, user: string) {
  const blob = (text || "").toLowerCase();
  return SYMPTOM_MARKERS.some(
    (markers) => markers.some((m) => blob.includes(m)) && !markers.some((m) => user.includes(m)),
  );
}

function noteFromUser(symptoms: string, history: Record<string, string> | null | undefined, context: string, language: string) {
  const bits = [symptoms.trim(), context.trim()].filter(Boolean);
  const hist = formatHistory(history);
  if (hist) bits.push(hist.replace(/\n/g, "; "));
  if (!bits.length) return "";
  const what = bits.join("; ");
  if ((language || "en").startsWith("es")) {
    return `Usted escribió: ${what}. Pregunte por eso primero. Si la cita es corta, diga que tiene dos preguntas más.`;
  }
  return `You wrote: ${what}. Ask about that first. If the visit is short, say you have two more questions.`;
}

function genericScriptedBrief(opts: {
  condition: string;
  symptoms: string;
  context: string;
  history?: Record<string, string> | null;
  language: string;
}) {
  const spanish = (opts.language || "en").startsWith("es");
  const topic = (opts.condition || "this visit").trim();
  const note = noteFromUser(opts.symptoms, opts.history, opts.context, opts.language);
  const tips = JSON.parse(JSON.stringify(FALLBACK_BRIEF.visit_tips || []));
  if (spanish) {
    const symptomQ = opts.symptoms.trim()
      ? `He notado esto: ${opts.symptoms.trim()}. ¿Qué debemos revisar primero?`
      : `¿Qué debemos tratar primero en esta cita sobre ${topic}?`;
    return {
      plain_summary: `Esta cita es sobre ${topic}. Bridge no dice lo que usted tiene. Las preguntas abajo salen de lo que usted escribió, para usarlas en una visita corta.`,
      personalized_note: note,
      key_numbers: [],
      standard_treatments: [
        {
          name: "Lo que suelen ofrecer primero",
          what_it_is: "El plan más común para esta clase de visita.",
          why_it_matters: "Pregunte por qué es el primer paso, no asuma que es el único.",
          common_side_effects: "Pregunte qué vigilar.",
          status: "Pregunte en la cita",
        },
      ],
      emerging_options: [
        {
          name: "Opciones más nuevas o estudios",
          what_it_is: "Tratamientos o ensayos que a veces no se mencionan a menos que pregunte.",
          why_ask: "No es una coincidencia. Pregunte si alguno aplica a usted.",
          status: "Pregunte — el equipo decide",
        },
      ],
      questions: [
        { question: symptomQ, why: "Lo que usted siente debe salir primero.", priority: "high" },
        {
          question: "¿Qué opciones hay además de lo que suelen ofrecer primero?",
          why: "Las opciones nuevas a menudo no se ofrecen si no pregunta.",
          priority: "high",
        },
        {
          question: "¿Hay un estudio clínico que debería preguntar?",
          why: "Bridge no dice que califica. El sitio del estudio decide.",
          priority: "medium",
        },
        {
          question: "¿Qué debo vigilar después de esta cita, y cuándo debo llamar?",
          why: "Sale con un plan concreto.",
          priority: "medium",
        },
      ],
      visit_tips: tips,
      red_flags: [],
    };
  }
  const symptomQ = opts.symptoms.trim()
    ? `I've been having this: ${opts.symptoms.trim()}. What should we look at first?`
    : `What should we take care of first at this visit about ${topic}?`;
  return {
    plain_summary: `This visit is about ${topic}. Bridge never says what you have. The questions below come from what you wrote, so you can use them in a short appointment.`,
    personalized_note: note,
    key_numbers: [],
    standard_treatments: [
      {
        name: "What is usually offered first",
        what_it_is: "The most common first plan for this kind of visit.",
        why_it_matters: "Ask why it is the first step — not only whether it is the default.",
        common_side_effects: "Ask what to watch for.",
        status: "Ask at the visit",
      },
    ],
    emerging_options: [
      {
        name: "Newer options or studies",
        what_it_is: "Treatments or trials that often are not mentioned unless you ask.",
        why_ask: "Not a match. Ask if any of this applies to you.",
        status: "Ask — your care team decides",
      },
    ],
    questions: [
      { question: symptomQ, why: "What you are feeling should come first.", priority: "high" },
      {
        question: "What options exist besides what is usually offered first?",
        why: "Newer options often are not offered unless you ask.",
        priority: "high",
      },
      {
        question: "Is there a clinical trial I should ask about?",
        why: "Bridge never says you qualify. The trial site decides.",
        priority: "medium",
      },
      {
        question: "What should I watch for after this visit, and when should I call?",
        why: "Leaves you with a concrete plan.",
        priority: "medium",
      },
    ],
    visit_tips: tips,
    red_flags: [],
  };
}

function groundInWhatTheyWrote(
  brief: Record<string, unknown>,
  opts: { symptoms: string; condition: string; context: string; history?: Record<string, string> | null; language: string },
) {
  const user = userBlob(opts.condition, opts.symptoms, opts.context, opts.history);
  const note = String(brief.personalized_note || "");
  if (inventsSymptoms(note, user) || (!note.trim() && (opts.symptoms || formatHistory(opts.history)))) {
    brief.personalized_note = noteFromUser(opts.symptoms, opts.history, opts.context, opts.language);
  }
  let kept = ((brief.questions as Record<string, string>[]) || []).filter(
    (q) => !inventsSymptoms(`${q.question || ""} ${q.why || ""}`, user),
  );
  if (opts.symptoms.trim()) {
    const already = kept.map((q) => q.question || "").join(" ").toLowerCase();
    const snippet = opts.symptoms.trim().slice(0, 80);
    if (!already.includes(snippet.toLowerCase())) {
      const q = opts.language.startsWith("es")
        ? {
            question: `He notado esto: ${snippet}. ¿Qué debemos revisar primero?`,
            why: "Lo que usted escribió debe salir en la cita.",
            priority: "high",
          }
        : {
            question: `I've been having this: ${snippet}. What should we look at first?`,
            why: "What you wrote should come up in the visit.",
            priority: "high",
          };
      kept = [q, ...kept.filter((x) => x.priority === "high"), ...kept.filter((x) => x.priority !== "high")];
    }
  }
  brief.questions = kept;
  return brief;
}

function ensureTrialQuestion(brief: Record<string, unknown>, trials: unknown[], language: string) {
  if (!trials.length) return;
  const questions = (brief.questions as Record<string, string>[]) || [];
  const blob = questions.map((q) => q.question || "").join(" ").toLowerCase();
  if (["trial", "study", "studies", "clinicaltrials", "estudio", "ensayo", "investigación"].some((w) => blob.includes(w))) {
    return;
  }
  const spanish = language.startsWith("es");
  const item = {
    question: spanish
      ? "¿Hay un estudio clínico que debería preguntar, o el tratamiento habitual es el primer paso correcto?"
      : "Is there a clinical trial I should ask about, or is the usual treatment the right first step?",
    why: spanish
      ? "No decimos que califique. El sitio del estudio decide. Pregunte si alguno aplica a usted."
      : "Not a match. The trial site decides. Ask if any of this applies to you.",
    priority: "medium",
  };
  brief.questions = [...questions.filter((q) => q.priority === "high"), item, ...questions.filter((q) => q.priority !== "high")];
}

function formatEvidence(evidence: { papers: Record<string, unknown>[]; trials: Record<string, unknown>[] }) {
  const lines: string[] = [];
  if (evidence.papers.length) {
    lines.push("PUBLISHED LITERATURE (PubMed):");
    for (const p of evidence.papers) {
      const types = ((p.publication_types as string[]) || []).slice(0, 3).join(", ");
      lines.push(`- [${p.id}] ${p.title} — ${p.journal} ${p.year}${types ? ` (${types})` : ""}`);
    }
  }
  if (evidence.trials.length) {
    lines.push("\nACTIVE CLINICAL TRIALS (ClinicalTrials.gov):");
    for (const t of evidence.trials) {
      const phases = ((t.phases as string[]) || []).join(", ") || String(t.study_type || "");
      const interventions = ((t.interventions as string[]) || []).slice(0, 3).join(", ");
      lines.push(
        `- [${t.id}] ${t.title} — ${t.status}${phases ? `, ${phases}` : ""}${interventions ? ` | studying: ${interventions}` : ""}`,
      );
      if (t.summary) lines.push(`    ${String(t.summary).slice(0, 320)}`);
    }
  }
  return lines.join("\n") || "(no evidence retrieved)";
}

export async function buildBrief(opts: {
  condition: string;
  language?: string;
  reading_level?: string;
  symptoms?: string;
  context?: string;
  history?: Record<string, string> | null;
}) {
  const language = opts.language || "en";
  const readingLevel = opts.reading_level || "simple";
  const symptoms = opts.symptoms || "";
  const context = opts.context || "";
  const history = opts.history || {};
  const evidence = await gatherEvidence(opts.condition);
  const hist = formatHistory(history);
  const prompt = `A patient is preparing for a doctor's appointment.

CONDITION OR CONCERN: ${opts.condition}
WHAT THEY'RE EXPERIENCING (quote this; do not add other symptoms): ${symptoms || "(not specified)"}
THEIR CONTEXT: ${context || "(not specified)"}
HISTORY THEY SHARED (optional — never diagnose from this):
${hist || "(none)"}

Do not mention thirst, blurry vision, or any symptom that is not in the lines above.

WRITE THE ENTIRE OUTPUT IN: ${languageName(language)}
READING LEVEL: ${readingHint(readingLevel)}

EVIDENCE RETRIEVED (use only this):
${formatEvidence(evidence)}

Produce a briefing they can read before the visit and a list of 5-7 questions \
to bring with them. Order questions by priority — the ones that would change \
their care most go first. If they shared history, write personalized_note and \
put matching questions first (symptoms, medicines they already take, family \
history, language). Mention possible medicine overlap only as a question to \
ask, never as a fact. Include 3-4 visit_tips on how to make the most of a \
short appointment (including language access). Include red flags only if the \
evidence supports them.

Return JSON matching exactly this shape:
${SCHEMA}`;

  const result = await completeJson({
    system: SYSTEM,
    prompt,
    fallback: FALLBACK_BRIEF as Record<string, unknown>,
    maxTokens: 3500,
  });

  const scripted = result.source === "scripted" || result.source === "scripted_after_error";
  const diabetes = looksLikeDiabetes(opts.condition);
  let brief: Record<string, unknown> =
    scripted && !diabetes
      ? genericScriptedBrief({ condition: opts.condition, symptoms, context, history, language })
      : { ...(result.data as Record<string, unknown>) };

  brief = groundInWhatTheyWrote(brief, { symptoms, condition: opts.condition, context, history, language });

  const sources = [
    ...evidence.papers.map((p) => ({
      id: p.id,
      title: p.title,
      url: p.url,
      source: p.source,
      detail: `${p.journal} ${p.year}`.trim(),
    })),
    ...evidence.trials.map((t) => ({
      id: t.id,
      title: t.title,
      url: t.url,
      source: t.source,
      detail: `${t.status} · ${(t.phases || []).join(", ") || t.study_type}`.replace(/\s·\s*$/, ""),
    })),
  ];
  const liveTrials = evidence.trials.slice(0, 2);
  const trials = liveTrials.length ? liveTrials : diabetes ? FALLBACK_TRIALS.slice(0, 2) : [];
  ensureTrialQuestion(brief, trials, language);
  if (!sources.length && diabetes) {
    brief.sources = [
      ...((FALLBACK_BRIEF.sources as unknown[]) || []),
      ...trials.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        source: t.source,
        detail: `${t.status || ""} · ${((t.phases as string[]) || []).join(", ") || t.study_type || ""}`.replace(/\s·\s*$/, ""),
      })),
    ];
  } else {
    brief.sources = sources;
  }
  brief.trials = trials;
  if (!brief.visit_tips) brief.visit_tips = JSON.parse(JSON.stringify(FALLBACK_BRIEF.visit_tips || []));
  brief._meta = {
    llm_source: result.source,
    llm_error: result.error,
    papers_found: evidence.papers.length,
    trials_found: trials.length,
    language,
    reading_level: readingLevel,
    condition: opts.condition,
  };
  return brief;
}
