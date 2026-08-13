"use client";

import { useMemo, useState } from "react";
import { openAskBridge } from "@/components/ask/openAskBridge";
import {
  AddVisitDrawer,
  draftFromVisit,
  emptyVisitDraft,
  type VisitDraft,
} from "@/components/saved/AddVisitDrawer";
import { CareNotebook, CareNotebookTab } from "@/components/saved/CareNotebook";
import { Icon } from "@/components/shell/Icon";
import {
  loadSavedHistory,
  makeSavedId,
  maxUploadBytes,
  saveSavedHistory,
  type SavedHistoryState,
} from "@/lib/savedHistory";
import type { SavedDocument, VisitRecord } from "@/lib/types";

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

function formatFollowUp(value: string) {
  if (!value.trim()) return "";
  const isoish = value.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}:\d{2})\s*(AM|PM)?)?/i);
  if (!isoish) return value;
  const datePart = isoish[1];
  const timePart = isoish[2];
  const meridiem = isoish[3];
  const parsed = new Date(`${datePart}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
  if (!timePart) return dateLabel;
  return `${dateLabel} · ${timePart}${meridiem ? ` ${meridiem.toUpperCase()}` : ""}`;
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

function visitFromDraft(draft: VisitDraft, id: string): VisitRecord {
  return {
    id,
    date: draft.date,
    doctor: draft.doctor.trim(),
    specialty: draft.specialty.trim(),
    location: draft.location.trim(),
    summary: draft.summary.trim(),
    symptomsDiscussed: draft.symptoms,
    decisionsMade: draft.decisionsMade.trim(),
    followUpPlan: draft.followUpPlan.trim(),
    prescriptions: draft.prescriptions.trim(),
    nextAppointment: draft.nextAppointment.trim(),
  };
}

export function SavedNotesWorkspace() {
  const [savedState, setSavedState] = useState<SavedHistoryState>(() =>
    loadSavedHistory(),
  );
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerDraft, setDrawerDraft] = useState<VisitDraft>(emptyVisitDraft);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  const visits = savedState.visits;
  const documents = savedState.documents;
  const activeVisit =
    visits.find((visit) => visit.id === activeVisitId) ?? visits[0] ?? null;
  const activeDocuments = activeVisit
    ? docsForVisit(documents, activeVisit.id)
    : [];

  const askPrompts = useMemo(
    () => [
      "Turn this visit into next-visit questions",
      "Make a follow-up checklist from my notes",
    ],
    [],
  );

  function commit(nextState: SavedHistoryState) {
    setSavedState(nextState);
    saveSavedHistory(nextState);
  }

  function openAddDrawer() {
    setDrawerMode("add");
    setDrawerDraft(emptyVisitDraft);
    setDrawerOpen(true);
  }

  function openEditDrawer() {
    if (!activeVisit) return;
    setDrawerMode("edit");
    setDrawerDraft(draftFromVisit(activeVisit));
    setDrawerOpen(true);
    setMenuOpen(false);
  }

  function saveDraft(draft: VisitDraft) {
    if (drawerMode === "edit" && activeVisit) {
      const updated = visitFromDraft(draft, activeVisit.id);
      const nextVisits = savedState.visits
        .map((visit) => (visit.id === activeVisit.id ? updated : visit))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
      commit({ ...savedState, visits: nextVisits });
      setActiveVisitId(updated.id);
    } else {
      const visit = visitFromDraft(draft, makeSavedId("visit"));
      const nextState = {
        ...savedState,
        visits: [visit, ...savedState.visits].sort((a, b) =>
          a.date < b.date ? 1 : -1,
        ),
      };
      commit(nextState);
      setActiveVisitId(visit.id);
    }
    setDrawerOpen(false);
  }

  function deleteVisit(visitId: string) {
    const nextVisits = savedState.visits.filter((visit) => visit.id !== visitId);
    const nextDocuments = savedState.documents.filter(
      (doc) => doc.visitId !== visitId,
    );
    commit({ visits: nextVisits, documents: nextDocuments });
    setActiveVisitId(nextVisits[0]?.id ?? "");
    setMenuOpen(false);
  }

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !activeVisit) return;

    setUploadError("");

    if (file.type !== "application/pdf") {
      setUploadError("Upload a PDF so this page stays focused on visit records.");
      return;
    }

    if (file.size > maxUploadBytes()) {
      setUploadError(
        "This first pass keeps files local, so PDFs need to stay under 2 MB.",
      );
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

  return (
    <div className="relative mx-auto max-w-6xl">
      <CareNotebookTab onOpen={() => setNotebookOpen(true)} />

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
            <Icon name="bookmark" className="h-3.5 w-3.5" />
            Saved & Notes
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Visit notes
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            Review what happened, keep next steps close, and attach PDFs. Open the
            care notebook tab anytime for the full running document.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDrawer}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          <Icon name="plus" className="h-4 w-4" />
          Add visit
        </button>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-sm font-semibold text-slate-900">Recent visits</h2>
            <span className="text-xs text-[var(--muted)]">Newest first</span>
          </div>

          <div className="mt-3 space-y-2">
            {visits.length === 0 ? (
              <p className="rounded-xl bg-[var(--surface-raised)] px-3 py-4 text-sm text-slate-500">
                No visits yet. Add your first appointment notes.
              </p>
            ) : (
              visits.map((visit) => {
                const isActive = visit.id === activeVisit?.id;
                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => {
                      setActiveVisitId(visit.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full rounded-xl border px-3.5 py-3.5 text-left transition ${
                      isActive
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-transparent bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                      {formatVisitDate(visit.date)}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">
                      {visit.doctor}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                      {visit.summary}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {activeVisit ? (
            <>
              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      {formatVisitDate(activeVisit.date)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {activeVisit.doctor}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {[activeVisit.specialty, activeVisit.location]
                        .filter(Boolean)
                        .join(" · ") || "Add specialty and location"}
                    </p>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((open) => !open)}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--line)] text-slate-600 transition hover:bg-slate-50"
                      aria-label="Visit actions"
                      aria-expanded={menuOpen}
                    >
                      ···
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 z-10 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg">
                        <button
                          type="button"
                          onClick={openEditDrawer}
                          className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Edit visit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVisit(activeVisit.id)}
                          className="block w-full px-4 py-2.5 text-left text-sm text-rose-700 hover:bg-rose-50"
                        >
                          Remove visit
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {activeVisit.nextAppointment ? (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3.5 py-1.5 text-sm font-medium text-slate-800">
                    <Icon name="calendar" className="h-4 w-4 text-[var(--brand)]" />
                    Next appointment · {formatFollowUp(activeVisit.nextAppointment)}
                  </div>
                ) : null}

                <div className="mt-6 space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      What happened
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">
                      {activeVisit.summary}
                    </p>
                  </div>

                  {activeVisit.symptomsDiscussed.length ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Symptoms discussed
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeVisit.symptomsDiscussed.map((symptom) => (
                          <span
                            key={symptom}
                            className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-sm text-slate-700"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeVisit.decisionsMade ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Decisions made
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {activeVisit.decisionsMade}
                      </p>
                    </div>
                  ) : null}

                  {activeVisit.followUpPlan ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Follow-up plan
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {activeVisit.followUpPlan}
                      </p>
                    </div>
                  ) : null}

                  {activeVisit.prescriptions ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Prescriptions & medications
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {activeVisit.prescriptions}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-7 flex flex-wrap gap-2 border-t border-[var(--line)] pt-5">
                  {askPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => openAskBridge(prompt)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-2 text-sm text-slate-700 transition hover:border-[var(--brand)]/35 hover:bg-[var(--brand-soft)]"
                    >
                      <Icon name="sparkle" className="h-3.5 w-3.5 text-[var(--brand)]" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Visit documents
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Attach after-visit summaries, labs, or discharge notes. Stored
                  locally in this browser.
                </p>

                <label
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    void handleUpload(event.dataTransfer.files);
                  }}
                  className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition ${
                    dragging
                      ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                      : "border-[var(--line-strong)] bg-[var(--surface-raised)] hover:border-[var(--brand)]/40"
                  }`}
                >
                  <Icon name="upload" className="h-5 w-5 text-[var(--brand)]" />
                  <p className="mt-3 text-sm font-medium text-slate-800">
                    Drop a visit summary or labs PDF
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    or click to upload · PDF under 2 MB
                  </p>
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

                {uploadError ? (
                  <p className="mt-3 text-sm text-rose-700">{uploadError}</p>
                ) : null}

                {activeDocuments.length ? (
                  <div className="mt-4 space-y-2">
                    {activeDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
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
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <section className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                Start your visit history
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Save what your care team said so you can carry it into the next
                appointment — and into Ask Bridge.
              </p>
              <button
                type="button"
                onClick={openAddDrawer}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add visit
              </button>
            </section>
          )}
        </div>
      </section>

      <AddVisitDrawer
        key={`${drawerMode}-${activeVisitId || "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        mode={drawerMode}
        initialDraft={drawerDraft}
        onClose={() => setDrawerOpen(false)}
        onSave={saveDraft}
      />

      <CareNotebook
        open={notebookOpen}
        onClose={() => setNotebookOpen(false)}
        visits={visits}
        documents={documents}
      />
    </div>
  );
}
