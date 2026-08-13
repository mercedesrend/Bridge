"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridge } from "@/components/ask/AskBridge";
import { loadBridgeSettings, shortLanguageLabel } from "@/lib/settings";
import { Icon } from "./Icon";

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
      </div>
    </header>
  );
}
