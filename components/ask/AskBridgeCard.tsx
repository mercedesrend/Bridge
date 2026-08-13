"use client";

import { Icon } from "@/components/shell/Icon";
import { openAskBridge } from "./openAskBridge";

/**
 * Quick-action tile that opens the Ask Bridge panel. Mirrors the QuickAction
 * link styling on Home, but is a button because it opens a dialog rather than
 * navigating.
 */
export function AskBridgeCard({
  title = "Ask Bridge",
  blurb = "Get answers to your questions",
  prompt,
}: {
  title?: string;
  blurb?: string;
  prompt?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => openAskBridge(prompt)}
      className="flex w-full items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-3.5 text-left transition hover:border-[var(--brand)]/30 hover:shadow-sm"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon name="chat" className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="block truncate text-xs text-[var(--muted)]">
          {blurb}
        </span>
      </span>
    </button>
  );
}
