import Link from "next/link";
import { Icon } from "./Icon";

/**
 * Placeholder for sidebar sections that are designed but not built yet.
 * Deliberately explicit that nothing here is real, so a demo never implies
 * these features work.
 */
export function ComingSoon({
  icon,
  eyebrow,
  title,
  blurb,
  planned,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  blurb: string;
  planned: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name={icon} className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          {blurb}
        </p>
      </section>

      <section className="card p-5">
        <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          Not built yet
        </p>
        <p className="mt-3 text-sm text-slate-600">
          This section is a placeholder so the navigation is complete. Nothing
          on this page is functional — no data is saved or generated here.
        </p>

        <h2 className="mt-5 text-sm font-bold text-slate-900">Planned</h2>
        <ul className="mt-2 space-y-2">
          {planned.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[13px] text-slate-600">
              <span className="h-[16px] w-[16px] shrink-0 rounded-full border-2 border-slate-300" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-[var(--brand-soft)] p-5">
        <h2 className="text-sm font-bold text-slate-900">
          What does work today
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
          Clinical trial matching is fully built: enter a profile and Companion
          compares it against currently recruiting trials, criterion by
          criterion.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-block rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
        >
          Find clinical trials
        </Link>
      </section>
    </div>
  );
}
