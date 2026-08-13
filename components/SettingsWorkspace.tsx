"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { openAskBridge } from "@/components/ask/openAskBridge";
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

type SettingsSection = "profile" | "language" | "privacy";

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  icon: string;
}> = [
  { id: "profile", label: "Profile", icon: "users" },
  { id: "language", label: "Language", icon: "globe" },
  { id: "privacy", label: "Privacy & data", icon: "shield" },
];

const selectClass =
  "min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]";

export function SettingsWorkspace() {
  const [section, setSection] = useState<SettingsSection>("profile");
  const [settings, setSettings] = useState<BridgeSettings>(() =>
    loadBridgeSettings(),
  );
  const [status, setStatus] = useState("");

  const activeLabel = useMemo(
    () => SECTIONS.find((item) => item.id === section)?.label ?? "Settings",
    [section],
  );

  function updateSetting<K extends keyof BridgeSettings>(
    key: K,
    value: BridgeSettings[K],
  ) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveBridgeSettings(next);
    setStatus("Saved on this device");
  }

  function runDestructiveAction(action: () => void, successMessage: string) {
    action();
    setStatus(successMessage);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Manage your profile and how Bridge personalizes your visit prep.
        </p>
      </header>

      {status ? (
        <p className="mb-4 rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-sm text-slate-700">
          {status}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="border-b border-[var(--line)] bg-[var(--surface-raised)]/60 p-3 lg:border-b-0 lg:border-r">
            <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {SECTIONS.map((item) => {
                const active = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand)]"
                        : "font-medium text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">{activeLabel}</h2>

            {section === "profile" ? (
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Profile setup
                    </p>
                    <p className="text-xs text-slate-500">
                      Trials · visits · local only
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--brand-soft)]">
                    <div className="h-full w-[70%] rounded-full bg-[var(--brand)]" />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)]">
                  <Link
                    href="/profile"
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Health profile
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        Diagnosis, stage, treatments, biomarkers, ZIP
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-[var(--brand)]">
                      Edit
                    </span>
                  </Link>
                  <div className="h-px bg-[var(--line)]" />
                  <Link
                    href="/saved"
                    className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-white"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Saved visit history
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        Notes, prescriptions, follow-ups, and PDFs
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-[var(--brand)]">
                      Open
                    </span>
                  </Link>
                </div>
              </div>
            ) : null}

            {section === "language" ? (
              <div className="mt-5 space-y-4">
                <p className="text-sm text-slate-600">
                  Preferences stay on this device.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      Interface language
                    </span>
                    <select
                      value={settings.interfaceLanguage}
                      onChange={(event) =>
                        updateSetting("interfaceLanguage", event.target.value)
                      }
                      className={selectClass}
                    >
                      {INTERFACE_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-800">
                      In-appointment translation
                    </span>
                    <select
                      value={settings.translationLanguage}
                      onChange={(event) =>
                        updateSetting("translationLanguage", event.target.value)
                      }
                      className={selectClass}
                    >
                      {TRANSLATION_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openAskBridge("How do I ask for an interpreter?")
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] hover:underline"
                >
                  <Icon name="sparkle" className="h-3.5 w-3.5" />
                  Ask Bridge about interpreters
                </button>
              </div>
            ) : null}

            {section === "privacy" ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-600">
                  Clears data in this browser only. Nothing is stored on a Bridge
                  server yet.
                </p>

                <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() =>
                      runDestructiveAction(
                        clearSavedHistory,
                        "Saved visit history removed",
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[var(--surface-raised)]"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Delete saved visit history
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        Appointment notes and attached PDFs
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-rose-600">
                      Delete
                    </span>
                  </button>
                  <div className="h-px bg-[var(--line)]" />
                  <button
                    type="button"
                    onClick={() =>
                      runDestructiveAction(
                        clearAskBridgeThread,
                        "Ask Bridge conversation cleared",
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[var(--surface-raised)]"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        Clear Ask Bridge conversation
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">
                        Starts a fresh assistant thread
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-slate-700">
                      Clear
                    </span>
                  </button>
                  <div className="h-px bg-[var(--line)]" />
                  <button
                    type="button"
                    onClick={() =>
                      runDestructiveAction(
                        clearAllLocalBridgeData,
                        "All local Bridge data cleared",
                      )
                    }
                    className="flex w-full items-center justify-between gap-4 bg-rose-50 px-4 py-3.5 text-left transition hover:bg-rose-100/70"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-rose-900">
                        Delete everything stored locally
                      </span>
                      <span className="mt-0.5 block text-sm text-rose-700">
                        Preferences, history, and Ask Bridge session
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-rose-700">
                      Reset
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
