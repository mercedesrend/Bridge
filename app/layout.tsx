import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrialLens — find clinical trials worth asking about",
  description:
    "Compare your profile against recruiting clinical trials, criterion by criterion. Final eligibility is determined by the trial site, not this tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-sky-600 text-white text-sm">
                TL
              </span>
              TrialLens
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-900">
                Profile
              </Link>
              <Link href="/questions" className="hover:text-slate-900">
                Questions
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 py-10 text-xs text-slate-400">
          TrialLens is an informational tool and does not provide medical advice.
          Final eligibility is determined by the trial site, not this tool.
        </footer>
      </body>
    </html>
  );
}
