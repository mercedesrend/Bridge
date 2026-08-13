"use client";

import Link from "next/link";
import { useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { Icon } from "@/components/shell/Icon";
import {
  clearAllLocalBridgeData,
  clearAskBridgeThread,
  clearSavedHistory,
  loadBridgeSettings,
  saveBridgeSettings,
  type BridgeSettings,
} from "@/lib/settings";

const INTERFACE_LANGUAGES = ["English", "Spanish", "French"] as const;
const TRANSLATION_LANGUAGES = ["Spanish", "English", "Mandarin", "Arabic"] as const;

export function SettingsWorkspace() {
  const [settings, setSettings] = useState<BridgeSettings>(() =>
    loadBridgeSettings(),
  );
  const [status, setStatus] = useState("");

  function updateSetting<K extends keyof BridgeSettings>(
    key: K,
    value: BridgeSettings[K],
  ) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveBridgeSettings(next);
    setStatus("Preferences saved on this device.");
  }

  function runDestructiveAction(action: () => void, successMessage: string) {
    action();
    setStatus(successMessage);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="settings" className="h-3.5 w-3.5" />
          Settings
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Profile, preferences, and privacy controls
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          This is where you set up the information Bridge uses most often,
          decide how language support should work, and clear local history when
          you need a fresh start.
        </p>
      </section>

      {status ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)] px-4 py-3 text-sm text-slate-700">
          {status}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Profile setup
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your clinical-trial profile lives on its own page so you can
                  keep diagnosis details, prior treatments, biomarkers, and
                  search radius up to date.
                </p>
              </div>
              <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                Main setup
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href="/profile"
                className="rounded-2xl border border-[var(--line)] px-4 py-4 transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Edit health profile
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Update diagnosis, stage, prior treatments, biomarkers, ZIP,
                  and trial search radius.
                </p>
              </Link>
              <Link
                href="/saved"
                className="rounded-2xl border border-[var(--line)] px-4 py-4 transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]"
              >
                <p className="text-sm font-semibold text-slate-900">
                  Open saved visit history
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review previous appointments, notes, follow-up plans, and PDFs
                  you stored locally.
                </p>
              </Link>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Language preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              These preferences stay on this device for now.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-800">
                  Interface language
                </span>
                <select
                  value={settings.interfaceLanguage}
                  onChange={(event) =>
                    updateSetting("interfaceLanguage", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                >
                  {INTERFACE_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-800">
                  In-appointment translation
                </span>
                <select
                  value={settings.translationLanguage}
                  onChange={(event) =>
                    updateSetting("translationLanguage", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
                >
                  {TRANSLATION_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Privacy and deletion
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Everything below clears data stored in this browser. This first
              pass does not delete anything from a remote account because this
              app is not saving these records to a backend yet.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() =>
                  runDestructiveAction(
                    clearSavedHistory,
                    "Saved visit history removed from this browser.",
                  )
                }
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--brand)]/35"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Delete saved visit history
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Removes appointment notes and attached PDFs stored on this
                    device.
                  </span>
                </span>
                <span className="text-sm font-medium text-rose-600">
                  Delete
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  runDestructiveAction(
                    clearAskBridgeThread,
                    "Ask Bridge conversation cleared for this browser session.",
                  )
                }
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--brand)]/35"
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Clear Ask Bridge conversation
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    Starts a fresh assistant thread without touching your saved
                    visit notes.
                  </span>
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Clear
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  runDestructiveAction(
                    clearAllLocalBridgeData,
                    "All local Bridge data cleared from this browser.",
                  )
                }
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition hover:border-rose-300"
              >
                <span>
                  <span className="block text-sm font-semibold text-rose-900">
                    Delete everything stored locally
                  </span>
                  <span className="mt-1 block text-sm text-rose-700">
                    Clears preferences, saved history, and Ask Bridge session
                    data.
                  </span>
                </span>
                <span className="text-sm font-medium text-rose-700">
                  Reset app
                </span>
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-[var(--brand-soft)] p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              What settings owns now
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Profile setup and editing</li>
              <li>Language preferences</li>
              <li>Saved visit history cleanup</li>
              <li>Session reset and privacy controls</li>
            </ul>
          </section>

          <AskBridgeInlinePrompts
            title="Ask about privacy or setup"
            blurb="Bridge can help you think through what to store, what to bring to a visit, and how to organize notes before you share anything with your care team."
          />
        </div>
      </section>
    </div>
  );
}
