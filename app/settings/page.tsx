import Link from "next/link";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { Icon } from "@/components/shell/Icon";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="settings" className="h-3.5 w-3.5" />
          Settings
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Language and preferences
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          This is where language and translation preferences live, so they do not compete with your next-step dashboard.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Current language
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              English interface, Spanish in-appointment translation.
            </p>
          </div>
          <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            Active
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm text-[var(--foreground)]">
            Preferred interface language: English
          </div>
          <div className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--foreground)]">
            In-appointment translation: Spanish
          </div>
        </div>
      </section>

      <AskBridgeInlinePrompts
        title="Ask about language support"
        blurb="Bridge can help you phrase interpreter requests, prepare for translated visits, or decide what to ask the clinic before you arrive."
      />

      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
