import Link from "next/link";
import { AskBridgeCard } from "@/components/ask/AskBridgeCard";
import { Icon } from "@/components/shell/Icon";

interface Step {
  done: boolean;
  label: string;
}

function JourneyCard({
  tone,
  icon,
  title,
  blurb,
  steps,
  cta,
  href,
}: {
  tone: "before" | "during" | "after";
  icon: string;
  title: string;
  blurb: string;
  steps: Step[];
  cta: string;
  href: string;
}) {
  const tones = {
    before: {
      card: "bg-[var(--before)]",
      chip: "bg-white text-[var(--before-ink)]",
      btn: "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]",
    },
    during: {
      card: "bg-[var(--during)]",
      chip: "bg-white text-[var(--during-ink)]",
      btn: "bg-[#f5c56b] text-[#7a5410] hover:bg-[#f0b949]",
    },
    after: {
      card: "bg-[var(--after)]",
      chip: "bg-white text-[var(--after-ink)]",
      btn: "bg-[#a8dcc0] text-[#1f5c42] hover:bg-[#93d3b1]",
    },
  }[tone];

  return (
    <section className={`flex flex-col rounded-2xl p-5 ${tones.card}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones.chip}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{blurb}</p>

      <ul className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[13px]">
            {s.done ? (
              <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                <Icon name="check" className="h-3 w-3" />
              </span>
            ) : (
              <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-slate-300 bg-white/60" />
            )}
            <span className={s.done ? "text-slate-700" : "text-slate-500"}>
              {s.label}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-5 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${tones.btn}`}
      >
        {cta}
      </Link>
    </section>
  );
}

function QuickAction({
  icon,
  title,
  blurb,
  href,
}: {
  icon: string;
  title: string;
  blurb: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3.5 transition hover:border-[var(--brand)]/30 hover:shadow-sm"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon name={icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="block truncate text-xs text-[var(--muted)]">
          {blurb}
        </span>
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      {/* Greeting + reassurance banner */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">
            Good morning, Mercedes <span aria-hidden>👋</span>
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Bridge is here to help you prepare, advocate, and take action for
            your health.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--before)] p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-xl">
            <span aria-hidden>🤝</span>
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">
              You&rsquo;re not alone.
            </span>
            <span className="mt-0.5 block text-[13px] leading-relaxed text-slate-600">
              We&rsquo;re here to help you feel informed, confident, and heard.
            </span>
          </span>
        </div>
      </div>

      {/* Journey */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-900">
          Your Appointment Journey
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <JourneyCard
            tone="before"
            icon="doc"
            title="Before"
            blurb="Prepare for your appointment with personalized insights and smart suggestions."
            steps={[
              { done: true, label: "Describe symptoms" },
              { done: true, label: "Possible conditions" },
              { done: true, label: "Questions to ask" },
              { done: false, label: "What to expect" },
            ]}
            cta="Start Preparing"
            href="/before"
          />
          <JourneyCard
            tone="during"
            icon="pulse"
            title="During"
            blurb="Get real-time support during your appointment."
            steps={[
              { done: true, label: "Live transcription" },
              { done: true, label: "Translation support" },
              { done: true, label: "Smart note-taking" },
              { done: false, label: "Key points & questions" },
            ]}
            cta="Use During Visit"
            href="/during"
          />
          <JourneyCard
            tone="after"
            icon="doc"
            title="After"
            blurb="Review, reflect, and take action with clarity and confidence."
            steps={[
              { done: true, label: "Appointment summary" },
              { done: true, label: "Treatment options" },
              { done: false, label: "Where to go next" },
              { done: false, label: "Second opinions" },
            ]}
            cta="View After Visit"
            href="/after"
          />
        </div>
      </div>

      {/* Lower grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Icon name="calendar" className="h-4 w-4 text-[var(--brand)]" />
              Upcoming Appointment
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] leading-none">
                <span className="text-[10px] font-semibold uppercase text-[var(--brand)]">
                  Aug
                </span>
                <span className="text-lg font-bold text-[var(--brand)]">14</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Dr. Sarah Kim
                </p>
                <p className="text-xs text-[var(--muted)]">Rheumatology</p>
                <p className="mt-1 text-xs text-slate-600">
                  Thursday, Aug 14, 2026 &middot; 10:30 AM
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Mount Sinai Medical Center
                </p>
              </div>
              <Link
                href="/before"
                className="rounded-xl border border-[var(--brand)]/40 px-4 py-2 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
              >
                View Details
              </Link>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
            <ul className="mt-3 divide-y divide-[var(--line)]">
              {[
                {
                  icon: "pulse",
                  text: "You added symptoms: fatigue, joint pain, headaches",
                  when: "2 hours ago",
                  href: "/before",
                },
                {
                  icon: "chat",
                  text: "Generated 5 questions to ask your doctor",
                  when: "Yesterday",
                  href: "/before",
                },
                {
                  icon: "bookmark",
                  text: "Saved treatment option: Biologic Therapy",
                  when: "2 days ago",
                  href: "/saved",
                },
              ].map((a) => (
                <li key={a.text}>
                  <Link
                    href={a.href}
                    className="flex items-center gap-3 py-3 transition hover:opacity-70"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Icon name={a.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-slate-800">
                        {a.text}
                      </span>
                      <span className="block text-xs text-[var(--muted)]">
                        {a.when}
                      </span>
                    </span>
                    <Icon
                      name="arrow"
                      className="h-4 w-4 shrink-0 text-slate-400"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Icon name="bulb" className="h-4 w-4 text-amber-500" />
              Today&rsquo;s Tip
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Write down your top 3 goals for this appointment. It helps you and
              your doctor stay focused. Examples:
            </p>
            <ul className="mt-2 space-y-1 text-[13px] text-slate-600">
              {[
                "Understand my diagnosis",
                "Explore treatment options",
                "Manage symptoms better",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden className="text-slate-400">
                    &bull;
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/before"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--brand)] hover:underline"
            >
              View all tips <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Icon name="globe" className="h-4 w-4 text-[var(--brand)]" />
              Language &amp; Translation
            </h2>
            <p className="mt-2 text-[13px] text-slate-600">
              I prefer in-appointment translation in:
            </p>
            <p className="mt-2 flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-slate-800">
              Spanish
              <span aria-hidden className="text-slate-400">
                &#9662;
              </span>
            </p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Translation features work best during appointments.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Icon name="headset" className="h-4 w-4 text-[var(--brand)]" />
              Need Help?
            </h2>
            <p className="mt-2 text-[13px] text-slate-600">
              We&rsquo;re here for you.
            </p>
            <Link
              href="/saved"
              className="mt-3 block rounded-xl border border-[var(--brand)]/40 px-4 py-2 text-center text-sm font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)]"
            >
              Contact Support
            </Link>
          </section>
        </div>
      </div>

      {/* Quick actions */}
      <section className="card p-5">
        <h2 className="text-sm font-bold text-slate-900">Quick Actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <QuickAction
            icon="plus"
            title="Add Symptoms"
            blurb="Describe what you're experiencing"
            href="/profile"
          />
          <QuickAction
            icon="flask"
            title="Find Clinical Trials"
            blurb="Match your profile against trials"
            href="/profile"
          />
          <AskBridgeCard />
        </div>
      </section>
    </div>
  );
}
