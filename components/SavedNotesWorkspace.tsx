"use client";

import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import { Icon } from "@/components/shell/Icon";
import {
  loadSavedHistory,
  makeSavedId,
  maxUploadBytes,
  saveSavedHistory,
  type SavedHistoryState,
} from "@/lib/savedHistory";
import type { SavedDocument, VisitRecord } from "@/lib/types";

type VisitDraft = {
  date: string;
  doctor: string;
  specialty: string;
  location: string;
  summary: string;
  symptomsText: string;
  decisionsMade: string;
  followUpPlan: string;
  nextAppointment: string;
};

const emptyDraft: VisitDraft = {
  date: "",
  doctor: "",
  specialty: "",
  location: "",
  summary: "",
  symptomsText: "",
  decisionsMade: "",
  followUpPlan: "",
  nextAppointment: "",
};

function humanFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function docsForVisit(documents: SavedDocument[], visitId: string) {
  return documents.filter((doc) => doc.visitId === visitId);
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

export function SavedNotesWorkspace() {
  const [savedState, setSavedState] = useState<SavedHistoryState>(() =>
    loadSavedHistory(),
  );
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<VisitDraft>(emptyDraft);
  const [uploadError, setUploadError] = useState("");

  const visits = savedState.visits;
  const documents = savedState.documents;
  const activeVisit =
    visits.find((visit) => visit.id === activeVisitId) ?? visits[0] ?? null;
  const activeDocuments = activeVisit ? docsForVisit(documents, activeVisit.id) : [];

  function commit(nextState: SavedHistoryState) {
    setSavedState(nextState);
    saveSavedHistory(nextState);
  }

  function updateDraft<K extends keyof VisitDraft>(key: K, value: VisitDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addVisit() {
    if (!draft.date || !draft.doctor.trim() || !draft.summary.trim()) {
      return;
    }

    const visit: VisitRecord = {
      id: makeSavedId("visit"),
      date: draft.date,
      doctor: draft.doctor.trim(),
      specialty: draft.specialty.trim(),
      location: draft.location.trim(),
      summary: draft.summary.trim(),
      symptomsDiscussed: draft.symptomsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      decisionsMade: draft.decisionsMade.trim(),
      followUpPlan: draft.followUpPlan.trim(),
      nextAppointment: draft.nextAppointment.trim(),
    };

    const nextState = {
      ...savedState,
      visits: [visit, ...savedState.visits].sort((a, b) =>
        a.date < b.date ? 1 : -1,
      ),
    };
    commit(nextState);
    setActiveVisitId(visit.id);
    setDraft(emptyDraft);
  }

  function deleteVisit(visitId: string) {
    const nextVisits = savedState.visits.filter((visit) => visit.id !== visitId);
    const nextDocuments = savedState.documents.filter((doc) => doc.visitId !== visitId);
    const nextState = { visits: nextVisits, documents: nextDocuments };
    commit(nextState);
    setActiveVisitId(nextVisits[0]?.id ?? "");
  }

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !activeVisit) {
      return;
    }

    setUploadError("");

    if (file.type !== "application/pdf") {
      setUploadError("Upload a PDF so this page stays focused on visit records.");
      return;
    }

    if (file.size > maxUploadBytes()) {
      setUploadError("This first pass keeps files local, so PDFs need to stay under 2 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      const nextDocument: SavedDocument = {
        id: makeSavedId("doc"),
        visitId: activeVisit.id,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      };

      commit({
        ...savedState,
        documents: [nextDocument, ...savedState.documents],
      });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload this file.",
      );
    }
  }

  function removeDocument(documentId: string) {
    commit({
      ...savedState,
      documents: savedState.documents.filter((doc) => doc.id !== documentId),
    });
  }

  const summaryStats = useMemo(
    () => [
      {
        label: "Visits saved",
        value: String(visits.length),
      },
      {
        label: "Documents",
        value: String(documents.length),
      },
      {
        label: "Latest follow-up",
        value: activeVisit?.nextAppointment || "Not set",
      },
    ],
    [activeVisit?.nextAppointment, documents.length, visits.length],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="bookmark" className="h-3.5 w-3.5" />
          Saved & Notes
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Keep the story from one visit to the next
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Save what happened at each appointment, keep the next-step plan in one
          place, and attach PDFs like after-visit summaries or lab reports so
          Bridge has the context you want close at hand.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-[var(--brand-soft)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Recent visits</h2>
              <span className="text-xs text-[var(--muted)]">
                newest first
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {visits.map((visit) => {
                const isActive = visit.id === activeVisit?.id;
                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => setActiveVisitId(visit.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-[var(--line)] bg-white hover:border-[var(--brand)]/30"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {formatVisitDate(visit.date)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {visit.doctor}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {visit.specialty || "Specialty not added"}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {visit.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Add a visit</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Start with the basics, then add what actually happened that day.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="date"
                value={draft.date}
                onChange={(event) => updateDraft("date", event.target.value)}
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <input
                value={draft.doctor}
                onChange={(event) => updateDraft("doctor", event.target.value)}
                placeholder="Doctor name"
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <input
                value={draft.specialty}
                onChange={(event) => updateDraft("specialty", event.target.value)}
                placeholder="Specialty"
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <input
                value={draft.location}
                onChange={(event) => updateDraft("location", event.target.value)}
                placeholder="Clinic or hospital"
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <textarea
                rows={3}
                value={draft.summary}
                onChange={(event) => updateDraft("summary", event.target.value)}
                placeholder="What happened at the visit?"
                className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <input
                value={draft.symptomsText}
                onChange={(event) => updateDraft("symptomsText", event.target.value)}
                placeholder="Symptoms discussed, comma-separated"
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <textarea
                rows={2}
                value={draft.decisionsMade}
                onChange={(event) => updateDraft("decisionsMade", event.target.value)}
                placeholder="Decisions made"
                className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <textarea
                rows={2}
                value={draft.followUpPlan}
                onChange={(event) => updateDraft("followUpPlan", event.target.value)}
                placeholder="Follow-up plan"
                className="w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <input
                value={draft.nextAppointment}
                onChange={(event) =>
                  updateDraft("nextAppointment", event.target.value)
                }
                placeholder="Next appointment"
                className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-slate-900 outline-none focus:border-[var(--brand)]"
              />
              <button
                type="button"
                onClick={addVisit}
                className="min-h-11 w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                Save visit
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {activeVisit ? (
            <>
              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {formatVisitDate(activeVisit.date)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {activeVisit.doctor}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {[activeVisit.specialty, activeVisit.location]
                        .filter(Boolean)
                        .join(" · ") || "Add specialty and location details"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteVisit(activeVisit.id)}
                    className="min-h-11 rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Remove visit
                  </button>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      What happened
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {activeVisit.summary}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Symptoms discussed
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeVisit.symptomsDiscussed.length ? (
                        activeVisit.symptomsDiscussed.map((symptom) => (
                          <span
                            key={symptom}
                            className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-sm text-slate-700"
                          >
                            {symptom}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No symptoms captured yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Decisions made
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {activeVisit.decisionsMade || "No treatment or testing decisions saved yet."}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Follow-up plan
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {activeVisit.followUpPlan || "No follow-up plan saved yet."}
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-800">
                      Next appointment:{" "}
                      <span className="font-normal text-slate-600">
                        {activeVisit.nextAppointment || "Not scheduled"}
                      </span>
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Visit documents
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Upload PDFs like after-visit summaries, labs, or discharge notes. This first pass stores them locally in this browser.
                    </p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]">
                    <Icon name="upload" className="h-4 w-4" />
                    Upload PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        void handleUpload(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {uploadError ? (
                  <p className="mt-4 text-sm text-rose-700">{uploadError}</p>
                ) : null}

                <div className="mt-5 space-y-3">
                  {activeDocuments.length ? (
                    activeDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {humanFileSize(document.sizeBytes)} · added{" "}
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).format(new Date(document.uploadedAt))}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <a
                            href={document.dataUrl}
                            download={document.name}
                            className="text-sm font-medium text-[var(--brand)] hover:underline"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            onClick={() => removeDocument(document.id)}
                            className="text-sm font-medium text-slate-500 hover:text-slate-900"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-6 text-sm text-slate-500">
                      No PDFs attached to this visit yet.
                    </p>
                  )}
                </div>
              </section>
            </>
          ) : null}

          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Saved items queue
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              This page can also become the home for saved trials, treatment options, and reusable question lists from the rest of Bridge.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                {
                  title: "Saved trials",
                  blurb: "Pin studies worth revisiting after you talk with your care team.",
                },
                {
                  title: "Treatment options",
                  blurb: "Keep plain-language summaries of options discussed across visits.",
                },
                {
                  title: "Question lists",
                  blurb: "Carry the strongest questions from one appointment into the next.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-[var(--brand-soft)] px-4 py-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.blurb}</p>
                </div>
              ))}
            </div>
          </section>

          <AskBridgeInlinePrompts
            title="Use Ask Bridge on top of your history"
            blurb="Now that visit notes and PDFs live here, Bridge can help you turn that history into cleaner follow-up questions and next-step checklists."
          />
        </div>
      </section>
    </div>
  );
}
