import Link from "next/link";
import { AuthCta } from "@/components/auth-cta";

const journeySteps = [
  {
    label: "Before the visit",
    title: "Turn a diagnosis note into a prep plan",
    body: "Bridge parses what the doctor told you, pulls in sourced treatment context, and builds a focused question list."
  },
  {
    label: "During the visit",
    title: "Stay grounded while the room moves fast",
    body: "Use one-question-at-a-time guidance, jot notes, and mark what was answered versus what still needs follow-up."
  },
  {
    label: "After the visit",
    title: "Leave with next steps you can actually use",
    body: "Bridge turns your answers, skipped questions, and discussed options into a recap you can print or share."
  }
];

const trustPoints = [
  "Sourced treatment explanations from public health data",
  "A patient-friendly flow for before, during, and after care visits",
  "Local-first state today, with Clerk-ready account auth when you turn it on"
];

export function LandingPage() {
  const checklistPreview = [
    { label: "Describe symptoms", meta: "fatigue, joint pain, headaches", done: true },
    { label: "Possible conditions", meta: "2 worth asking about", done: true },
    { label: "Questions to ask", meta: "5 generated", done: true },
    { label: "What to expect", meta: "Start", done: false }
  ];

  return (
    <div className="min-h-screen bg-transparent text-[color:var(--ink)]">
      <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[color:rgba(248,248,252,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-lg font-semibold text-[color:var(--accent-strong)]">
              B
            </div>
            <div>
              <p className="text-lg font-semibold">Bridge</p>
              <p className="text-sm text-[color:var(--muted)]">Your patient appointment companion</p>
            </div>
          </Link>

          <AuthCta compact />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[color:var(--line)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(108,92,231,0.12),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(108,92,231,0.1),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.78),_rgba(248,248,252,0.96))]" />
          <div className="absolute -right-20 top-28 h-64 w-64 rounded-full bg-[color:rgba(108,92,231,0.08)] blur-3xl" />
          <div className="absolute left-[-4rem] top-12 h-44 w-44 rounded-full bg-[color:rgba(108,92,231,0.08)] blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <p className="inline-flex rounded-full border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium">
              Built for the moments patients usually have to manage alone
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Walk into the appointment knowing what to ask, what it means, and what happens next.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
              Bridge turns scattered diagnosis notes, treatment research, and visit follow-up into one calm workflow before, during, and after care visits.
            </p>
            <div className="mt-8">
              <AuthCta />
            </div>

            <div className="mt-14 rounded-[32px] border border-[color:var(--line)] bg-[color:rgba(255,255,255,0.82)] p-5 shadow-[var(--card-shadow)] sm:p-7">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--accent-strong)]">Tomorrow · 10:30 AM</p>
                      <h2 className="mt-2 text-2xl font-semibold">Dr. Kim · Rheumatology</h2>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        Mount Sinai Medical Center · Friday, Aug 14
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[color:var(--muted)]">3 of 4 steps done</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <div className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--accent)] px-5 text-sm font-semibold text-white">
                      Finish preparing
                    </div>
                    <div className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--line)] px-5 text-sm font-semibold">
                      View details
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface-raised)] p-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="h-3 w-3 rounded-full bg-[color:var(--accent)]" />
                      <span className="font-semibold text-[color:var(--accent-strong)]">Before</span>
                      <span className="h-px flex-1 bg-[color:var(--line)]" />
                      <span className="text-[color:var(--muted)]">During opens at 10:30</span>
                      <span className="h-px flex-1 bg-[color:var(--line)]" />
                      <span className="text-[color:var(--muted)]">After opens after 11:30</span>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-[color:var(--line)] bg-white">
                      {checklistPreview.map((item) => (
                        <div
                          key={item.label}
                          className="flex min-h-14 items-center justify-between gap-4 border-b border-[color:var(--line)] px-4 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                                item.done
                                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                                  : "border-[color:var(--line)] text-[color:var(--muted)]"
                              }`}
                            >
                              {item.done ? "✓" : ""}
                            </span>
                            <span className={`text-sm ${item.done ? "text-[color:var(--muted)]" : "font-semibold"}`}>
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`text-sm ${
                              item.done
                                ? "text-[color:var(--muted)]"
                                : "font-semibold text-[color:var(--accent-strong)]"
                            }`}
                          >
                            {item.done ? item.meta : "Start →"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                    <p className="text-sm font-medium text-[color:var(--muted)]">In the room</p>
                    <h3 className="mt-2 text-xl font-semibold">One question at a time</h3>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      Mark what was answered, save exactly what the doctor said, and carry skipped questions into the recap.
                    </p>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-[color:var(--surface-raised)] p-4 text-sm font-medium">
                        What should I ask about side effects for this treatment?
                      </div>
                      <div className="rounded-2xl border border-[color:var(--line)] bg-white p-4 text-sm text-[color:var(--muted)]">
                        Note: &quot;Start with blood work first, then we decide whether infusion makes sense.&quot;
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[color:var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                    <p className="text-sm font-medium text-[color:var(--muted)]">After the visit</p>
                    <h3 className="mt-2 text-xl font-semibold">A recap you can act on</h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--muted)]">
                      <li className="rounded-2xl bg-[color:var(--surface-raised)] px-4 py-3">Call for lab results if they have not arrived by Monday.</li>
                      <li className="rounded-2xl bg-[color:var(--surface-raised)] px-4 py-3">Bring the unanswered fatigue question to the next visit.</li>
                      <li className="rounded-2xl bg-[color:var(--surface-raised)] px-4 py-3">Print or share the recap with family support.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-b border-[color:var(--line)] bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Bridge is designed around the actual rhythm of an appointment.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {journeySteps.map((step) => (
                <article
                  key={step.label}
                  className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--card)] p-6 shadow-[var(--soft-shadow)]"
                >
                  <p className="text-sm font-medium text-[color:var(--accent-strong)]">{step.label}</p>
                  <h3 className="mt-3 text-2xl font-semibold">{step.title}</h3>
                  <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--line)] bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Why Bridge
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Built for the questions patients carry home after the appointment ends.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted)]">
                The product you already have is strong at structured prep, source-grounded explanations, and visit recap. This landing page now tells that same story clearly while giving you a clean place to plug in authentication.
              </p>
            </div>

            <div className="space-y-4">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex min-h-16 items-center gap-4 rounded-[24px] border border-[color:var(--line)] bg-[color:var(--card)] px-5 py-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent-strong)]">
                    ✓
                  </span>
                  <p className="text-base leading-7">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-transparent">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--card)] p-8 shadow-[var(--card-shadow)] sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[color:var(--muted)]">
                    Ready to try it
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Start with the intake, or switch on Clerk and make it your signed-in experience.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[color:var(--muted)]">
                    The workflow is already usable as a demo today. When you add Clerk keys, the intake and journey pages will require sign-in automatically.
                  </p>
                </div>

                <AuthCta />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
