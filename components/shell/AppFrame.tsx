"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { loadBridgeSettings } from "@/lib/settings";
import { MobileNav, Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/")
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings] = useState(() => loadBridgeSettings());

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  return (
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
              {settings.interfaceLanguage}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
