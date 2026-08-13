import Link from "next/link";
import { Icon } from "@/components/shell/Icon";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="headset" className="h-3.5 w-3.5" />
          Support
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Get help with Bridge
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Support is available for account questions, accessibility help, and issues using the appointment tools.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Fastest ways to get help
        </h2>
        <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
          <div className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
            Send a message through Ask Bridge for product guidance during a task.
          </div>
          <div className="rounded-2xl bg-[var(--surface-raised)] px-4 py-3">
            Contact the care-team support desk for appointment logistics and records questions.
          </div>
        </div>
      </section>

      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
