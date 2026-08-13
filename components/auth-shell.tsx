import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
};

const previewPoints = [
  "Save your prep flow between sessions",
  "Keep visit notes and follow-up together",
  "Return for the next appointment without starting over",
];

export function AuthShell({
  eyebrow,
  title,
  body,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(108,92,231,0.12),_transparent_32%),radial-gradient(circle_at_80%_15%,_rgba(108,92,231,0.08),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <section className="rounded-[32px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-6 shadow-[var(--card-shadow)] backdrop-blur sm:p-8">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand)]">
                B
              </span>
              Bridge
            </Link>

            <div className="mt-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--brand)]">
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-[var(--foreground)]">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
                {body}
              </p>
            </div>

            <div className="mt-8 rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[var(--soft-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--muted)]">
                    Appointment flow
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    Before → During → After
                  </p>
                </div>
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand)]">
                  Bridge account
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {previewPoints.map((point) => (
                  <div
                    key={point}
                    className="flex min-h-12 items-center gap-3 rounded-2xl bg-[var(--surface-raised)] px-4 py-3"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand)] text-sm font-semibold text-white">
                      ✓
                    </span>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                <span className="rounded-full bg-[var(--surface-raised)] px-3 py-2">
                  Real care timeline
                </span>
                <span className="rounded-full bg-[var(--surface-raised)] px-3 py-2">
                  Ask Bridge across pages
                </span>
                <span className="rounded-full bg-[var(--surface-raised)] px-3 py-2">
                  Clerk-ready
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-8">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
