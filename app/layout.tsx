import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Sidebar, MobileNav } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = {
  title: "Bridge — your healthcare advocate",
  description:
    "Prepare, advocate, and take action for your health. Final eligibility for any clinical trial is determined by the trial site, not this tool.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/*
        suppressHydrationWarning: browser extensions (Grammarly, password
        managers) inject attributes like data-gr-ext-installed into <body>
        before React hydrates, which the server HTML can't know about. This
        only suppresses attribute mismatches on <body> itself — mismatches
        inside our own components still surface normally.
      */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <MobileNav />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            <footer className="px-4 pb-8 pt-2 text-xs text-[var(--muted)] sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Private. Secure. You&apos;re in control.</span>
                <span aria-hidden>·</span>
                <span>
                  Bridge is an informational tool and does not provide medical
                  advice.
                </span>
                <span aria-hidden>·</span>
                <Link href="/support" className="underline underline-offset-2">
                  Support
                </Link>
                <span aria-hidden>·</span>
                <Link href="/settings" className="underline underline-offset-2">
                  English
                </Link>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
