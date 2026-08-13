"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shell/Icon";
import {
  emptyStateFor,
  labelForPath,
  suggestedPrompts,
  type ChatMessage,
} from "@/lib/askBridge";
import { decodeProfile } from "@/lib/profile";
import { ASK_BRIDGE_OPEN, type AskBridgeOpenDetail } from "./openAskBridge";

const STORAGE_KEY = "bridge:ask-thread";

function newId(role: string) {
  return `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: newId(role), role, content };
}

/**
 * The trial profile travels in the `p` URL param. Read it at send time rather
 * than through useSearchParams — this component sits in the root layout, and a
 * search-param hook there would opt every page out of static rendering.
 */
function currentProfile() {
  if (typeof window === "undefined") return null;
  return decodeProfile(new URLSearchParams(window.location.search).get("p"));
}

function loadThread(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveThread(messages: ChatMessage[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Private-mode storage failures shouldn't break the conversation.
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-[var(--brand)] px-3.5 py-2 text-[14px] leading-6 text-white">
          {message.content}
        </p>
      </div>
    );
  }
  return (
    <p className="whitespace-pre-wrap text-[14px] leading-7 text-slate-800">
      {message.content}
    </p>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-label="Bridge is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 motion-reduce:animate-none"
          style={{ animationDelay: `${-0.3 + i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function AskBridge() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Lazily rehydrated so the thread survives a full page load. Safe against a
  // hydration mismatch: the panel starts closed, so none of this renders until
  // the user opens it.
  const [messages, setMessages] = useState<ChatMessage[]>(loadThread);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The question that failed, held aside so retry re-sends it exactly once
  // rather than stacking a second copy onto the thread.
  const [failedPrompt, setFailedPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const label = useMemo(() => labelForPath(pathname), [pathname]);
  const prompts = useMemo(() => suggestedPrompts(label), [label]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AskBridgeOpenDetail>).detail;
      if (detail?.prompt) setInput(detail.prompt);
      setOpen(true);
    };
    window.addEventListener(ASK_BRIDGE_OPEN, handler);
    return () => window.removeEventListener(ASK_BRIDGE_OPEN, handler);
  }, []);

  // Escape closes; the page behind the panel shouldn't scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending, error]);

  const send = useCallback(
    (raw: string) => {
      const content = raw.trim();
      if (!content || pending) return;

      const userMessage = makeMessage("user", content);
      const placeholder = makeMessage("assistant", "");
      const history = [...messages, userMessage];

      setMessages([...history, placeholder]);
      setInput("");
      setError(null);
      setFailedPrompt(null);
      setPending(true);

      void (async () => {
        try {
          const response = await fetch("/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: history.map(({ role, content }) => ({ role, content })),
              context: {
                pathname,
                label,
                profile: currentProfile(),
              },
            }),
          });

          if (!response.ok || !response.body) {
            const payload = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            throw new Error(payload?.error ?? "Bridge could not respond.");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let answer = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            answer += decoder.decode(value, { stream: true });
            setMessages((current) =>
              current.map((m) =>
                m.id === placeholder.id ? { ...m, content: answer } : m,
              ),
            );
          }

          const settled = [
            ...history,
            { ...placeholder, content: answer.trim() },
          ];
          setMessages(settled);
          saveThread(settled);
        } catch (err) {
          // Roll the failed turn back out of the thread entirely, so the model
          // never sees a question it never answered.
          setMessages(messages);
          saveThread(messages);
          setFailedPrompt(content);
          setError(
            err instanceof Error ? err.message : "Bridge could not respond.",
          );
        } finally {
          setPending(false);
        }
      })();
    },
    [label, messages, pathname, pending],
  );

  const startNew = () => {
    setMessages([]);
    setError(null);
    setFailedPrompt(null);
    setInput("");
    saveThread([]);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand)] px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-strong)] focus:outline-none focus:ring-4 focus:ring-[var(--brand-soft)]"
      >
        <Icon name="sparkle" className="h-4 w-4" />
        <span className="hidden sm:inline">Ask Bridge</span>
        <span className="sr-only sm:hidden">Ask Bridge</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close Ask Bridge"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/25"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Ask Bridge"
            className="relative flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon name="sparkle" className="h-4 w-4" />
                </span>
                Ask Bridge
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon name="close" className="h-[18px] w-[18px]" />
              </button>
            </header>

            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-2.5">
              <p className="min-w-0 truncate text-xs text-[var(--muted)]">
                Answering about{" "}
                <span className="font-semibold text-slate-700">{label}</span>
              </p>
              {messages.length ? (
                <button
                  type="button"
                  onClick={startNew}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  New
                </button>
              ) : null}
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
              aria-live="polite"
            >
              {messages.length ? (
                messages.map((message) =>
                  message.role === "assistant" && !message.content ? null : (
                    <MessageBubble key={message.id} message={message} />
                  ),
                )
              ) : (
                <div>
                  <p className="text-[14px] leading-7 text-slate-600">
                    {emptyStateFor(label)}
                  </p>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Try asking
                  </p>
                  <div className="mt-2 space-y-2">
                    {prompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => send(prompt)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3.5 py-2.5 text-left text-[13px] text-slate-700 transition hover:border-[var(--brand)]/40 hover:bg-[var(--brand-soft)]"
                      >
                        {prompt}
                        <Icon
                          name="arrow"
                          className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pending ? <TypingDots /> : null}

              {error ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">
                  <p className="font-semibold">Bridge hit a snag.</p>
                  <p className="mt-1">{error}</p>
                  {failedPrompt ? (
                    <button
                      type="button"
                      onClick={() => send(failedPrompt)}
                      className="mt-2 font-semibold underline underline-offset-4"
                    >
                      Try that question again
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="border-t border-[var(--line)] px-5 py-4">
              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2 rounded-2xl border border-[var(--line)] p-2 focus-within:border-[var(--brand)]/40 focus-within:ring-4 focus-within:ring-[var(--brand-soft)]"
              >
                <label className="sr-only" htmlFor="ask-bridge-input">
                  Ask Bridge a question
                </label>
                <textarea
                  id="ask-bridge-input"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Ask about this page or your next step…"
                  className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[14px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  aria-label="Send message"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
                >
                  <Icon name="send" className="h-4 w-4" />
                </button>
              </form>
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">
                Bridge is an informational tool and does not provide medical
                advice. Final eligibility for any trial is determined by the
                trial site.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
