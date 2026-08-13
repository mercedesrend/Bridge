import { formatHistory, languageName } from "@/lib/data";
import { completeJson } from "@/lib/llm";

const SYSTEM = `You are Ask Bridge, a health-literacy companion for first-generation \
patients and families. You are not a doctor.

Hard rules:
- Never diagnose. Never say the user has a condition. Never tell them what \
medicine to start, stop, or change.
- Explain how bodies work, what common tests and terms mean, and what \
questions they can take to their clinician.
- If they share history (medicines, family, other conditions), use it only to \
make the explanation more relevant — as questions to ask, not as advice.
- If something is urgent (chest pain, trouble breathing, confusion, fainting), \
tell them to seek emergency care and stop explaining.
- Write at a simple reading level. Short sentences. No jargon unless you \
immediately unpack it.
- Output valid JSON only. No markdown fences.`;

const SCHEMA = `{
  "answer": "2-6 short sentences in the patient's language",
  "related_questions": ["follow-up they can ask you or their doctor"],
  "ask_your_doctor": "one concrete question they can take to the visit, or empty"
}`;

function pack(es: boolean, en: Record<string, unknown>, esd: Record<string, unknown>) {
  return es ? esd : en;
}

export function scriptedAnswer(message: string, language: string, condition = "") {
  const q = (message || "").toLowerCase();
  const es = (language || "en").startsWith("es");
  const cond = (condition || "type 2 diabetes").toLowerCase();
  if (["a1c", "a1 c", "hemoglobina", "sugar number", "número"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "A1C is a blood test that shows your average blood sugar over about three months. It is not a grade. For many adults, doctors aim for under 7%, but your target is personal. Ask what your number is and what number you are aiming for.",
      related_questions: ["What is a normal A1C?", "How often is it checked?", "Can food change A1C?"],
      ask_your_doctor: "What is my A1C, and what number are we aiming for?",
    }, {
      answer: "La A1C es un análisis de sangre que muestra su azúcar promedio en unos tres meses. No es una calificación. Para muchos adultos el objetivo es menos de 7%, pero el suyo es personal. Pregunte cuál es su número y a cuál quieren llegar.",
      related_questions: ["¿Qué es una A1C normal?", "¿Cada cuánto se revisa?", "¿La comida cambia la A1C?"],
      ask_your_doctor: "¿Cuál es mi A1C y a qué número queremos llegar?",
    });
  }
  if (["metformin", "metformina", "pill", "pastilla"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "Metformin is a common first pill for type 2 diabetes. It helps the body use insulin better so less sugar stays in the blood. Some people have an upset stomach at first; taking it with food often helps. Only your clinician decides if it is right for you.",
      related_questions: ["What side effects should I call about?", "Do I take this forever?", "What are GLP-1 medicines?"],
      ask_your_doctor: "If metformin upsets my stomach, what should I do?",
    }, {
      answer: "La metformina es una pastilla común al inicio de la diabetes tipo 2. Ayuda al cuerpo a usar mejor la insulina para que quede menos azúcar en la sangre. A algunas personas les duele el estómago al principio; tomarla con comida suele ayudar. Solo su médico decide si le corresponde.",
      related_questions: ["¿Qué efectos secundarios debo reportar?", "¿La tomo para siempre?", "¿Qué son las medicinas GLP-1?"],
      ask_your_doctor: "Si la metformina me molesta el estómago, ¿qué hago?",
    });
  }
  if (["glp", "ozempic", "semaglutide", "inyect", "injection", "semaglutida"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "GLP-1 medicines are a newer class. Many are weekly shots; some are pills. They can help blood sugar and sometimes weight. They are not for everyone, and they are often not offered unless you ask. Bring this as a question, not as a request for a specific brand.",
      related_questions: ["Am I a candidate?", "Does insurance cover this?", "What are the common side effects?"],
      ask_your_doctor: "Am I a candidate for a GLP-1 medicine, or is metformin the right first step for me?",
    }, {
      answer: "Las medicinas GLP-1 son más nuevas. Muchas son una inyección semanal; algunas son pastillas. Pueden bajar el azúcar y a veces el peso. No son para todos, y a menudo no se ofrecen si usted no pregunta. Llévelo como pregunta, no como pedido de una marca.",
      related_questions: ["¿Soy candidata o candidato?", "¿Lo cubre el seguro?", "¿Qué efectos secundarios son comunes?"],
      ask_your_doctor: "¿Soy candidata o candidato a una medicina GLP-1, o la metformina es el primer paso correcto para mí?",
    });
  }
  if (["eye", "vision", "blur", "vista", "ojos", "borros"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "High blood sugar can make the lens of the eye swell, so vision looks blurry for a while. That can improve when sugar comes down. Diabetes can also harm the back of the eye over time, which is why doctors talk about a dilated eye exam — even if you feel fine.",
      related_questions: ["Will my vision get better?", "When should I see an eye doctor?", "What is a retinal exam?"],
      ask_your_doctor: "My vision has been blurry some days. Should I see an eye doctor?",
    }, {
      answer: "El azúcar alta puede hinchar el lente del ojo y la vista se ve borrosa un tiempo. A veces mejora cuando baja el azúcar. Con el tiempo la diabetes también puede dañar la parte de atrás del ojo, por eso hablan de un examen con las pupilas dilatadas — aunque se sienta bien.",
      related_questions: ["¿Se me va a arreglar la vista?", "¿Cuándo debo ver al oftalmólogo?", "¿Qué es un examen de retina?"],
      ask_your_doctor: "Algunos días veo borroso. ¿Debo ver a un doctor de los ojos?",
    });
  }
  if (["insulin", "insulina", "pancreas", "páncreas", "body", "cuerpo", "sugar work", "azúcar"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "Food turns into sugar in the blood. Insulin is a hormone from the pancreas that helps that sugar enter your cells for energy. In type 2 diabetes, the body still makes insulin but does not use it well, so sugar stays in the blood. That is why thirst, tiredness, and blurry vision can show up — they are signs to talk about, not a diagnosis from us.",
      related_questions: ["What does insulin do?", "Why am I always thirsty?", "What is type 2 vs type 1?"],
      ask_your_doctor: "Can you explain how my body is handling sugar right now?",
    }, {
      answer: "La comida se convierte en azúcar en la sangre. La insulina es una hormona del páncreas que ayuda a que ese azúcar entre a las células para dar energía. En la diabetes tipo 2 el cuerpo todavía hace insulina pero no la usa bien, y el azúcar se queda en la sangre. Por eso pueden aparecer sed, cansancio y vista borrosa — son señales para hablar, no un diagnóstico de nosotros.",
      related_questions: ["¿Qué hace la insulina?", "¿Por qué tengo tanta sed?", "¿Qué diferencia hay entre tipo 1 y tipo 2?"],
      ask_your_doctor: "¿Puede explicarme cómo está manejando el azúcar mi cuerpo ahora?",
    });
  }
  if (["family", "mother", "mom", "heart", "familia", "madre", "corazón", "presión", "pressure"].some((w) => q.includes(w))) {
    return pack(es, {
      answer: "Type 2 diabetes and heart problems can run in families. That does not mean you will get the same outcome. It does mean it is fair to ask how your family history, blood pressure medicine, and a new diabetes plan fit together. Bring that to the visit so the plan is about you, not a generic patient.",
      related_questions: ["Does family history change my treatment?", "Can diabetes medicines affect blood pressure?", "What should my family watch for?"],
      ask_your_doctor: "My mother had diabetes and my father had a heart attack. Does that change what we try first?",
    }, {
      answer: "La diabetes tipo 2 y los problemas del corazón pueden ir en la familia. Eso no quiere decir que a usted le vaya a pasar lo mismo. Sí significa que puede preguntar cómo encajan su historia familiar, la medicina para la presión y un plan nuevo de diabetes. Llévelo a la cita para que el plan sea sobre usted, no sobre un paciente genérico.",
      related_questions: ["¿La historia familiar cambia el tratamiento?", "¿Las medicinas de diabetes afectan la presión?", "¿Qué debe vigilar mi familia?"],
      ask_your_doctor: "Mi mamá tuvo diabetes y mi papá un infarto. ¿Eso cambia lo que intentamos primero?",
    });
  }
  const topic = cond || "this visit";
  return pack(es, {
    answer: `I can explain words, tests, and how the body works related to ${topic}. I will not say what you have or what to take. Ask about a number, a medicine name, or a body part you want to understand — then take one clear question into the room.`,
    related_questions: ["What does A1C mean?", "How does my body handle sugar?", "Why can eyes get blurry?"],
    ask_your_doctor: "",
  }, {
    answer: `Puedo explicar palabras, análisis y cómo funciona el cuerpo en relación con ${topic}. No diré qué tiene ni qué tomar. Pregunte por un número, el nombre de una medicina o una parte del cuerpo que quiera entender — y lleve una pregunta clara a la sala.`,
    related_questions: ["¿Qué significa la A1C?", "¿Cómo maneja el azúcar mi cuerpo?", "¿Por qué se pone borrosa la vista?"],
    ask_your_doctor: "",
  });
}

export async function answerQuestion(opts: {
  message: string;
  language?: string;
  condition?: string;
  symptoms?: string;
  context?: string;
  history?: Record<string, string> | null;
  briefSummary?: string;
  chatHistory?: Record<string, unknown>[];
}) {
  const language = opts.language || "en";
  const prior = (opts.chatHistory || [])
    .slice(-6)
    .map((m) => `${m.role || "user"}: ${m.content || m.question || ""}`)
    .join("\n");
  const prompt = `WRITE THE ENTIRE OUTPUT IN: ${languageName(language)}

THEIR QUESTION: ${opts.message}

VISIT TOPIC (they may or may not have this — do not diagnose): ${opts.condition || "(not specified)"}
SYMPTOMS THEY DESCRIBED: ${opts.symptoms || "(none)"}
CONTEXT: ${opts.context || "(none)"}
HISTORY THEY SHARED:
${formatHistory(opts.history) || "(none)"}

BRIEF THEY ALREADY HAVE:
${opts.briefSummary || "(none yet)"}

RECENT CHAT:
${prior || "(none)"}

Return JSON matching exactly this shape:
${SCHEMA}`;
  const fallback = scriptedAnswer(opts.message, language, opts.condition);
  const result = await completeJson({ system: SYSTEM, prompt, fallback, maxTokens: 1200 });
  const data = { ...(result.data as Record<string, unknown>) };
  if (!data.related_questions) data.related_questions = fallback.related_questions;
  if (data.ask_your_doctor == null) data.ask_your_doctor = "";
  data._meta = { llm_source: result.source, llm_error: result.error, language };
  return data;
}
