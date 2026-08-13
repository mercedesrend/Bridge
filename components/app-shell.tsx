"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { readProfile, readQuestions } from "@/lib/storage";
import { PhaseKey } from "@/lib/types";
import clsx from "clsx";

const tabs: Array<{ href: string; label: string; phase: PhaseKey }> = [
  { href: "/prep", label: "Before", phase: "before" },
  { href: "/visit", label: "During", phase: "during" },
  { href: "/recap", label: "After", phase: "after" }
];

function getUnlockState() {
  const profile = readProfile();
  const questions = readQuestions().filter((item) => item.selected);
  return {
    before: true,
    during: Boolean(profile && questions.length),
    after: Boolean(profile && questions.length)
  };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const unlockState = getUnlockState();

  return (
    <div className="print-shell min-h-screen px-3 py-4 sm:px-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md flex-col rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[0_18px_60px_rgba(93,77,55,0.18)]">
        <header className="border-b border-[color:var(--line)] px-4 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Prep for one visit
              </p>
              <h1 className="mt-1 text-2xl font-semibold">PrepDoc</h1>
            </div>
            <p className="max-w-[9rem] text-right text-xs leading-5 text-[color:var(--muted)]">
              Worth asking about. Your doctor can tell you whether this fits.
            </p>
          </div>
        </header>

        <main className="flex-1 px-4 py-4">{children}</main>

        <footer className="border-t border-[color:var(--line)] px-4 py-3">
          <nav className="no-print grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const unlocked =
                tab.phase === "before"
                  ? unlockState.before
                  : tab.phase === "during"
                    ? unlockState.during
                    : unlockState.after;
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={unlocked ? tab.href : "/"}
                  className={clsx(
                    "rounded-2xl border px-3 py-3 text-center text-sm font-medium transition",
                    active
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                      : "border-[color:var(--line)] bg-white text-[color:var(--ink)]",
                    !unlocked && "opacity-50"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-3 text-center text-xs leading-5 text-[color:var(--muted)]">
            This is a preparation tool, not medical advice. Your care team decides what&apos;s right for you.
          </p>
        </footer>
      </div>
    </div>
  );
}
