import Link from "next/link";
import { AuthCta } from "@/components/auth-cta";
import { Icon } from "@/components/shell/Icon";

const journeySteps = [
  {
    label: "Before the visit",
    title: "Turn scattered notes into a prep plan",
    body: "Capture symptoms, possible conditions, and the questions you actually want to ask before the room starts moving fast.",
  },
  {
    label: "During the visit",
    title: "Keep up while the appointment is happening",
    body: "Track what was answered, save key phrases, and keep remaining questions visible while you are still in the room.",
  },
  {
    label: "After the visit",
    title: "Leave with follow-up you can act on",
    body: "Summaries, treatment decisions, next steps, and uploaded records stay together so the next appointment starts from context.",
  },
];

const trustPoints = [
  "Ask Bridge works across home, journey pages, and care-history workflows",
  "Saved visits, PDFs, and notes stay organized around real appointments",
  "Clerk can turn the experience into a signed-in product when you are ready",
];

const checklistPreview = [
  { label: "Describe symptoms", meta: "fatigue, joint pain, headaches", done: true },
  { label: "Possible conditions", meta: "2 worth asking about", done: true },
  { label: "Questions to ask", meta: "5 generated", done: true },
  { label: "What to expect", meta: "Start →", done: false },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-[var(--foreground)]">
      <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgba(248,248,252,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <Icon name="heart" className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-semibold text-[var(--foreground)]">
                Bridge
              </span>
              <span className="block text-sm text-[var(--muted)]">
                Your healthcare advocate
              </span>
            </span>
          </Link>

          <AuthCta compact />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(108,92,231,0.12),_transparent_34%),radial-gradient(circle_at_78%_18%,_rgba(108,92,231,0.1),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.78),_rgba(248,248,252,0.96))]" />
          <div className="absolute -right-20 top-28 h-64 w-64 rounded-full bg-[rgba(108,92,231,0.08)] blur-3xl" />
          <div className="absolute left-[-4rem] top-12 h-44 w-44 rounded-full bg-[rgba(108,92,231,0.08)] blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <p className="inline-flex rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
              Built for the moments patients usually have to manage alone
            </p>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Walk into the appointment knowing what to ask, what it means, and what happens next.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--muted)]">
              Bridge turns care history, treatment research, visit notes, and follow-up into one calm flow before, during, and after the appointment.
            </p>
            <div className="mt-8">
              <AuthCta />
            </div>

            <div className="mt-14 rounded-[32px] border border-[var(--line)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[var(--card-shadow)] sm:p-7">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--brand)]">
                        Tomorrow · 10:30 AM
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                        Dr. Sarah Kim · Rheumatology
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Mount Sinai Medical Center · Friday, Aug 14
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[var(--muted)]">
                      3 of 4 steps done
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/home"
                      className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                    >
                      Finish preparing
                    </Link>
                    <Link
                      href="/saved"
                      className="inline-flex min-h-11 items-center rounded-xl border border-[var(--line)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
                    >
                      View details
                    </Link>
                  </div>

                  <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface-raised)] p-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="h-3 w-3 rounded-full bg-[var(--brand)]" />
                      <span className="font-semibold text-[var(--brand)]">
                        Before
                      </span>
                      <span className="h-px min-w-12 flex-1 bg-[var(--line)]" />
                      <span className="text-[var(--muted)]">
                        During opens at 10:30
                      </span>
                      <span className="h-px min-w-12 flex-1 bg-[var(--line)]" />
                      <span className="text-[var(--muted)]">
                        After opens after 11:30
                      </span>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-[var(--line)] bg-white">
                      {checklistPreview.map((item) => (
                        <div
                          key={item.label}
                          className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--line)] px-4 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`grid h-6 w-6 place-items-center rounded-full border text-xs font-semibold ${
                                item.done
                                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                  : "border-[var(--line)] text-[var(--muted)]"
                              }`}
                            >
                              {item.done ? "✓" : ""}
                            </span>
                            <span
                              className={`text-sm ${
                                item.done
                                  ? "text-[var(--muted)]"
                                  : "font-semibold text-[var(--foreground)]"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <span
                            className={`text-sm ${
                              item.done
                                ? "text-[var(--muted)]"
                                : "font-semibold text-[var(--brand)]"
                            }`}
                          >
                            {item.done ? item.meta : item.meta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                    <p className="text-sm font-medium text-[var(--muted)]">
                      In the room
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      Ask Bridge without leaving the page
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      Use the assistant to explain terms, translate a question,
                      or help organize the next thing you need to ask.
                    </p>
                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-[var(--surface-raised)] p-4 text-sm font-medium text-[var(--foreground)]">
                        What should I ask about side effects for this treatment?
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">
                        Note: &quot;Start with blood work first, then we decide
                        whether infusion makes sense.&quot;
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
                    <p className="text-sm font-medium text-[var(--muted)]">
                      After the visit
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                      A recap you can act on
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                      <li className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
                        Save what happened in the appointment and what still
                        needs follow-up.
                      </li>
                      <li className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
                        Keep treatment options, records, and next steps in one
                        timeline.
                      </li>
                      <li className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
                        Upload PDFs or visit paperwork so the next appointment
                        starts with context.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-b border-[var(--line)] bg-transparent"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Bridge is designed around the actual rhythm of an appointment.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {journeySteps.map((step) => (
                <article
                  key={step.label}
                  className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--soft-shadow)]"
                >
                  <p className="text-sm font-medium text-[var(--brand)]">
                    {step.label}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                    {step.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--line)] bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                Why Bridge
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Built for the questions patients carry home after the appointment ends.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">
                The product now tells the same story as the app itself: guided
                prep, support in the room, and a care timeline that remembers
                what happened last time.
              </p>
            </div>

            <div className="space-y-4">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex min-h-16 items-center gap-4 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-5 py-4"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-soft)] font-semibold text-[var(--brand)]">
                    ✓
                  </span>
                  <p className="text-base leading-7 text-[var(--foreground)]">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-transparent">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--card-shadow)] sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
                    Ready to try it
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    Start with the dashboard now, then turn on Clerk when you want account-based access.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
                    The app already supports OpenRouter-powered guidance,
                    appointment timelines, and saved visit notes. Clerk just
                    lets us make it personal and persistent.
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
