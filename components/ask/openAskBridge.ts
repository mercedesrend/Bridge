"use client";

// The Ask Bridge panel lives in the layout's top bar, so anything else that
// wants to open it (a card on Home, a link in a page body) does it by event
// rather than by threading state through server components.

export const ASK_BRIDGE_OPEN = "bridge:ask-open";

export interface AskBridgeOpenDetail {
  /** Pre-fills the composer instead of sending immediately. */
  prompt?: string;
}

export function openAskBridge(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AskBridgeOpenDetail>(ASK_BRIDGE_OPEN, {
      detail: { prompt },
    }),
  );
}
