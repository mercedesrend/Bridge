"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shell/Icon";
import { labelForPath, suggestedPrompts } from "@/lib/askBridge";
import { openAskBridge } from "./openAskBridge";

export function AskBridgeInlinePrompts({
  title = "Ask Bridge about this page",
  blurb,
  promptCount = 3,
}: {
  title?: string;
  blurb?: string;
  promptCount?: number;
}) {
  const pathname = usePathname();
  const label = useMemo(() => labelForPath(pathname), [pathname]);
  const prompts = useMemo(
    () => suggestedPrompts(label).slice(0, Math.max(1, promptCount)),
    [label, promptCount],
  );

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <Icon name="sparkle" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {blurb ??
              `Bridge already knows you're on ${label}. Start with one of these page-aware prompts or ask your own question.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => openAskBridge(prompt)}
            className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-left text-sm text-slate-700 transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
