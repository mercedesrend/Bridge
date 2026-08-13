"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { AskBridge } from "@/components/ask/AskBridge";
import { loadBridgeSettings, shortLanguageLabel } from "@/lib/settings";
import { Icon } from "./Icon";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function AccountChip() {
  if (!clerkEnabled) {
    return (
      <Link
        href="/settings"
        className="flex items-center gap-2 rounded-lg transition hover:opacity-90"
        aria-label="Open settings"
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--brand-soft)] text-[13px] font-semibold text-[var(--brand)]">
          M
        </span>
        <span className="hidden text-sm font-medium text-[var(--foreground)] sm:block">
          Mercedes
        </span>
      </Link>
    );
  }

  return <ClerkAccountChip />;
}

function ClerkAccountChip() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <span className="h-11 w-11 rounded-full bg-[var(--brand-soft)]/70" />
        <span className="hidden h-4 w-20 rounded bg-[var(--surface-raised)] sm:block" />
      </div>
    );
  }

  if (!userId) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]"
      >
        Sign in
      </Link>
    );
  }

  const label =
    user?.firstName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <div className="flex items-center gap-2">
      <UserButton />
      <span className="hidden text-sm font-medium text-[var(--foreground)] sm:block">
        {label}
      </span>
    </div>
  );
}

export function TopBar() {
  const [settings] = useState(() => loadBridgeSettings());
  const languageBadge = useMemo(
    () => shortLanguageLabel(settings.interfaceLanguage),
    [settings.interfaceLanguage],
  );

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:px-6">
      <div className="ml-auto flex items-center gap-3">
        <AskBridge />
        <Link
          href="/settings"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--brand-soft)]"
        >
          <Icon name="globe" className="h-4 w-4 text-[var(--brand)]" />
          {languageBadge}
        </Link>
        <span className="relative grid h-11 w-11 place-items-center rounded-lg text-[var(--muted)]">
          <Icon name="bell" className="h-[18px] w-[18px]" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[var(--surface)]" />
        </span>
        <AccountChip />
      </div>
    </header>
  );
}
