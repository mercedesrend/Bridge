"""Scripted demo data.

Two jobs:
  1. Fallback when a live API is unavailable, so a demo never dies on stage.
  2. The scripted appointment used by the During phase, so you don't have to
     rely on a live microphone in a loud room.

The scripted visit is a Spanish-speaking patient with newly diagnosed type 2
diabetes. It's deliberately written to contain a *gap*: the patient prepared a
question about newer injectable options and never got to ask it. The After
phase catches that gap. That's the moment to land in the demo.
"""

DEMO_PATIENT = {
    "condition": "type 2 diabetes",
    "language": "es",
    "reading_level": "simple",
    "symptoms": "Always thirsty, tired in the afternoons, blurry vision some days. Hard to follow when the doctor talks fast.",
    "context": "First specialist visit. English is my second language. I usually ask my daughter to come translate.",
}

# --- During phase: the scripted appointment -------------------------------
# `speaker` is one of: doctor | patient | interpreter
DEMO_TRANSCRIPT = [
    {
        "t": 0,
        "speaker": "doctor",
        "lang": "en",
        "text": "Good morning. So your labs came back and your A1C is 8.2, which confirms type 2 diabetes.",
    },
    {
        "t": 9,
        "speaker": "patient",
        "lang": "es",
        "text": "¿Ocho punto dos es muy malo? No entiendo qué significa ese número.",
    },
    {
        "t": 16,
        "speaker": "doctor",
        "lang": "en",
        "text": "It's elevated but very manageable. Normal is under 5.7. We want to get you under 7. I'm going to start you on metformin, 500 milligrams twice daily with food.",
    },
    {
        "t": 31,
        "speaker": "patient",
        "lang": "es",
        "text": "¿Voy a tomar esto para siempre? ¿Tiene efectos secundarios?",
    },
    {
        "t": 38,
        "speaker": "doctor",
        "lang": "en",
        "text": "Some stomach upset at first, usually settles in a couple weeks. Take it with food. We'll recheck your A1C in three months and adjust from there.",
    },
    {
        "t": 52,
        "speaker": "doctor",
        "lang": "en",
        "text": "I'd also like you to see a diabetes educator about diet, and get your eyes checked — the blurry vision you mentioned is worth a retinal exam.",
    },
    {
        "t": 64,
        "speaker": "patient",
        "lang": "es",
        "text": "Está bien. ¿Y la vista se va a arreglar?",
    },
    {
        "t": 70,
        "speaker": "doctor",
        "lang": "en",
        "text": "Often it improves once blood sugar comes down. But we check to be safe. Let's get the referral in today.",
    },
    {
        "t": 79,
        "speaker": "doctor",
        "lang": "en",
        "text": "Any other questions? I have another patient waiting, but the front desk can book your follow-up.",
    },
    {
        "t": 86,
        "speaker": "patient",
        "lang": "es",
        "text": "No, creo que no. Gracias doctor.",
    },
]

# --- Before phase fallback ------------------------------------------------
FALLBACK_BRIEF = {
    "plain_summary": (
        "Type 2 diabetes means your body has trouble using insulin, so sugar "
        "builds up in your blood. It is very common and very treatable. Most "
        "people manage it with a mix of medicine, food changes, and regular "
        "check-ups."
    ),
    "key_numbers": [
        {
            "label": "A1C",
            "meaning": "A blood test showing your average blood sugar over about 3 months.",
            "typical_target": "Most adults aim for under 7%. Your doctor sets your target.",
        }
    ],
    "standard_treatments": [
        {
            "name": "Metformin",
            "what_it_is": "A pill, usually the first medicine doctors try.",
            "why_it_matters": "Lowers blood sugar and is well studied over many years.",
            "common_side_effects": "Upset stomach early on, usually improves.",
            "status": "Approved and widely used",
        },
        {
            "name": "Diet and activity changes",
            "what_it_is": "Working with a diabetes educator or dietitian.",
            "why_it_matters": "Can lower blood sugar on its own and helps every other treatment work better.",
            "common_side_effects": "None.",
            "status": "Standard care",
        },
    ],
    "emerging_options": [
        {
            "name": "GLP-1 receptor agonists",
            "what_it_is": "A newer class of medicine, often an injection, sometimes a pill.",
            "why_ask": "May help with blood sugar and weight. Ask if you are a candidate.",
            "status": "Approved, but not right for everyone",
        },
        {
            "name": "Continuous glucose monitors",
            "what_it_is": "A small sensor worn on the arm that tracks blood sugar all day.",
            "why_ask": "Can replace some finger sticks. Ask if your insurance covers one.",
            "status": "Approved; coverage varies",
        },
    ],
    "questions": [
        {
            "question": "What is my A1C number, and what number are we aiming for?",
            "why": "Gives you a concrete goal to track between visits.",
            "priority": "high",
        },
        {
            "question": "Am I a candidate for a GLP-1 medicine, or is metformin the right first step for me?",
            "why": "Newer options exist and may not be offered unless you ask.",
            "priority": "high",
        },
        {
            "question": "My vision has been blurry some days. Should I see an eye doctor?",
            "why": "Blurry vision can be related to blood sugar and is worth checking.",
            "priority": "high",
        },
        {
            "question": "What side effects should make me call you instead of waiting?",
            "why": "Tells you exactly when something is urgent.",
            "priority": "medium",
        },
        {
            "question": "Can I be referred to a diabetes educator who speaks Spanish?",
            "why": "Understanding the plan in your own language makes it easier to follow.",
            "priority": "medium",
        },
        {
            "question": "When is my next appointment, and what happens between now and then?",
            "why": "Leaves you with a clear next step.",
            "priority": "medium",
        },
    ],
    "visit_tips": [
        {
            "tip": "You can bring a family member. You can also ask for a free professional interpreter — it is your right, not a favor.",
        },
        {
            "tip": "If you feel rushed, say: \"I have two more questions.\" You do not have to be a good guest in the exam room.",
        },
        {
            "tip": "Ask the high-priority questions first. Newer treatments often are not offered unless you raise them.",
        },
        {
            "tip": "After, send this to whoever helps you decide. You do not have to remember everything alone.",
        },
    ],
    "red_flags": [
        {
            "sign": "Confusion, vomiting that will not stop, or being unable to keep fluids down",
            "action": "That can be urgent. Call your clinic or emergency services — do not wait for the next visit.",
        }
    ],
    "sources": [
        {
            "title": "Standards of Care in Diabetes (American Diabetes Association)",
            "url": "https://diabetesjournals.org/care",
            "source": "Professional guideline",
        }
    ],
}

# Shown in scripted mode so the "ask about trials" story still has real URLs.
FALLBACK_TRIALS = [
    {
        "id": "NCT04867785",
        "source": "ClinicalTrials.gov",
        "title": "Tirzepatide in people with type 2 diabetes who have obesity or are overweight (SURMOUNT-2)",
        "status": "Completed — this class of medicine is now approved",
        "phases": ["PHASE3"],
        "study_type": "INTERVENTIONAL",
        "interventions": ["Tirzepatide"],
        "summary": "A large study of a weekly injection that can lower blood sugar and help with weight.",
        "locations": ["Multiple sites, United States"],
        "total_locations": 1,
        "url": "https://clinicaltrials.gov/study/NCT04867785",
    },
    {
        "id": "NCT01720446",
        "source": "ClinicalTrials.gov",
        "title": "Semaglutide and heart outcomes in type 2 diabetes (SUSTAIN-6)",
        "status": "Completed — results helped this medicine get widely used",
        "phases": ["PHASE3"],
        "study_type": "INTERVENTIONAL",
        "interventions": ["Semaglutide"],
        "summary": "Looked at whether a GLP-1 medicine also protects the heart — the kind of question worth asking your doctor.",
        "locations": ["Multiple countries"],
        "total_locations": 1,
        "url": "https://clinicaltrials.gov/study/NCT01720446",
    },
]

# --- After phase fallback -------------------------------------------------
FALLBACK_RECAP = {
    "headline": "You were diagnosed with type 2 diabetes and started on metformin.",
    "family_note": (
        "Today the doctor confirmed type 2 diabetes and started metformin "
        "500 mg twice a day with food. A1C is 8.2; they want it under 7. "
        "There is a referral for a diabetes educator and an eye exam. "
        "Three questions never got asked, including whether a GLP-1 medicine "
        "is an option, and whether the educator speaks Spanish. Please help "
        "ask those — she said she had no more questions because the doctor "
        "had another patient waiting."
    ),
    "what_was_decided": [
        {
            "item": "Start metformin 500 mg, twice a day, with food",
            "detail": "Take it with meals to reduce stomach upset. Some upset early on is expected and usually settles within about two weeks.",
        },
        {
            "item": "Recheck A1C in 3 months",
            "detail": "Your A1C is 8.2 now. The goal discussed was under 7.",
        },
        {
            "item": "Referral to a diabetes educator",
            "detail": "To talk about food and daily routine.",
        },
        {
            "item": "Eye exam referral",
            "detail": "Because of the blurry vision you mentioned. The doctor said it often improves once blood sugar comes down.",
        },
    ],
    "medications": [
        {
            "name": "Metformin",
            "dose": "500 mg",
            "frequency": "Twice daily",
            "instructions": "Take with food.",
            "watch_for": "Stomach upset early on. Call if it does not settle.",
        }
    ],
    "unanswered_questions": [
        {
            "question": "Am I a candidate for a GLP-1 medicine, or is metformin the right first step for me?",
            "why_it_matters": "You had this prepared but it did not come up. Newer options are not always offered unless you ask.",
            "how_to_follow_up": "Send this through the patient portal, or ask at your 3-month recheck.",
        },
        {
            "question": "Can I be referred to a diabetes educator who speaks Spanish?",
            "why_it_matters": "You planned to ask this. A referral was made, but language was never discussed.",
            "how_to_follow_up": "Call the front desk and ask specifically for a Spanish-speaking educator.",
        },
        {
            "question": "What side effects should make me call instead of waiting?",
            "why_it_matters": "You know upset stomach is expected, but not what counts as urgent.",
            "how_to_follow_up": "Ask the pharmacist when you pick up the metformin — they can answer this today.",
        },
    ],
    "next_steps": [
        {
            "step": "Fill the metformin prescription",
            "when": "Today or tomorrow",
        },
        {
            "step": "Book the eye exam",
            "when": "Within a few weeks",
        },
        {
            "step": "Book the diabetes educator visit",
            "when": "Within a month",
        },
        {
            "step": "Schedule the 3-month A1C recheck",
            "when": "Before you leave, or call the front desk",
        },
    ],
    "second_opinion": {
        "worth_considering": False,
        "reasoning": (
            "The plan discussed is standard first-line care and matches common "
            "guidelines. A second opinion is not usually needed at this stage. "
            "If your A1C does not improve after 3 months, that is a reasonable "
            "point to ask about seeing an endocrinologist."
        ),
    },
    "places_to_go": [
        {
            "place": "Pharmacy",
            "kind": "today",
            "why": "Fill metformin and ask what side effects mean you should call.",
            "how": "Today or tomorrow. Pharmacists can answer this without another doctor visit.",
        },
        {
            "place": "Diabetes educator",
            "kind": "referral",
            "why": "The doctor referred you to talk about food and daily routine.",
            "how": "Ask the front desk to book it, and request someone who speaks Spanish.",
        },
        {
            "place": "Eye doctor (retinal exam)",
            "kind": "referral",
            "why": "Blurry vision was mentioned and a referral was started.",
            "how": "Book within a few weeks.",
        },
        {
            "place": "Patient portal or front desk",
            "kind": "followup",
            "why": "Your GLP-1 question was never asked.",
            "how": "Send a message this week, or ask at the 3-month recheck.",
        },
    ],
}

FALLBACK_TRANSLATIONS = {
    "es": {
        "Good morning. So your labs came back and your A1C is 8.2, which confirms type 2 diabetes.": "Buenos días. Sus análisis llegaron y su A1C es 8.2, lo que confirma diabetes tipo 2.",
        "It's elevated but very manageable. Normal is under 5.7. We want to get you under 7. I'm going to start you on metformin, 500 milligrams twice daily with food.": "Está elevado pero es muy manejable. Lo normal es menos de 5.7. Queremos bajarlo a menos de 7. Voy a empezar con metformina, 500 miligramos dos veces al día con comida.",
        "Some stomach upset at first, usually settles in a couple weeks. Take it with food. We'll recheck your A1C in three months and adjust from there.": "Puede causar malestar estomacal al principio, normalmente mejora en un par de semanas. Tómelo con comida. Revisaremos su A1C en tres meses y ajustaremos.",
        "I'd also like you to see a diabetes educator about diet, and get your eyes checked — the blurry vision you mentioned is worth a retinal exam.": "También quiero que vea a un educador en diabetes sobre la dieta, y que revise sus ojos — la visión borrosa que mencionó merece un examen de retina.",
        "Often it improves once blood sugar comes down. But we check to be safe. Let's get the referral in today.": "Con frecuencia mejora cuando baja el azúcar en la sangre. Pero lo revisamos por seguridad. Hagamos la referencia hoy.",
        "Any other questions? I have another patient waiting, but the front desk can book your follow-up.": "¿Alguna otra pregunta? Tengo otro paciente esperando, pero la recepción puede agendar su seguimiento.",
    },
    "en": {
        "¿Ocho punto dos es muy malo? No entiendo qué significa ese número.": "Is eight point two very bad? I don't understand what that number means.",
        "¿Voy a tomar esto para siempre? ¿Tiene efectos secundarios?": "Will I take this forever? Does it have side effects?",
        "Está bien. ¿Y la vista se va a arreglar?": "Okay. And will my vision get better?",
        "No, creo que no. Gracias doctor.": "No, I don't think so. Thank you doctor.",
    },
}

LANGUAGES = [
    {"code": "en", "label": "English", "native": "English"},
    {"code": "es", "label": "Spanish", "native": "Español"},
    {"code": "zh", "label": "Chinese", "native": "中文"},
    {"code": "vi", "label": "Vietnamese", "native": "Tiếng Việt"},
    {"code": "tl", "label": "Tagalog", "native": "Tagalog"},
    {"code": "ar", "label": "Arabic", "native": "العربية"},
    {"code": "ru", "label": "Russian", "native": "Русский"},
    {"code": "ko", "label": "Korean", "native": "한국어"},
    {"code": "pt", "label": "Portuguese", "native": "Português"},
    {"code": "fr", "label": "French", "native": "Français"},
    {"code": "ht", "label": "Haitian Creole", "native": "Kreyòl Ayisyen"},
    {"code": "bn", "label": "Bengali", "native": "বাংলা"},
]

READING_LEVELS = [
    {
        "code": "simple",
        "label": "Simple",
        "hint": "Short sentences, everyday words. Around a 5th-grade level.",
    },
    {
        "code": "standard",
        "label": "Standard",
        "hint": "Plain language, a little more detail.",
    },
    {
        "code": "detailed",
        "label": "Detailed",
        "hint": "Keeps medical terms, explains them as it goes.",
    },
]
