"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AskBridgeInlinePrompts } from "@/components/ask/AskBridgeInlinePrompts";
import {
  AddVisitDrawer,
  draftFromVisit,
  emptyVisitDraft,
  type VisitDraft,
} from "@/components/saved/AddVisitDrawer";
import { Icon } from "@/components/shell/Icon";
import { appointmentLabelFromVisit, composeAppointmentLabel } from "@/lib/appointments";
import {
  loadSavedHistory,
  makeSavedId,
  maxUploadBytes,
  saveSavedHistory,
} from "@/lib/savedHistory";
import type { SavedDocument, VisitRecord } from "@/lib/types";

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatSavedDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function humanFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
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

function visitFromDraft(id: string, draft: VisitDraft): VisitRecord {
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
    nextAppointmentDate: draft.nextAppointmentDate,
    nextAppointmentTime: draft.nextAppointmentTime,
    nextAppointment: composeAppointmentLabel(
      draft.nextAppointmentDate,
      draft.nextAppointmentTime,
    ).trim(),
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
      {children}
    </p>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[var(--brand)]";
const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition focus:border-[var(--brand)]";

export function AfterAppointmentWorkspace() {
  const [savedState, setSavedState] = useState(() => loadSavedHistory());
  const [activeVisitId, setActiveVisitId] = useState(
    () => loadSavedHistory().visits[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<VisitDraft>(() => {
    const firstVisit = loadSavedHistory().visits[0];
    return firstVisit ? draftFromVisit(firstVisit) : emptyVisitDraft;
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerDraft, setDrawerDraft] = useState<VisitDraft>(emptyVisitDraft);
  const [uploadError, setUploadError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");
  const [dragging, setDragging] = useState(false);

  const visits = savedState.visits;
  const documents = savedState.documents;
  const activeVisit =
    visits.find((visit) => visit.id === activeVisitId) ?? visits[0] ?? null;
  const activeDocuments = activeVisit ? docsForVisit(documents, activeVisit.id) : [];

  function commit(nextState: typeof savedState) {
    setSavedState(nextState);
    saveSavedHistory(nextState);
  }

  function updateDraft<K extends keyof VisitDraft>(key: K, value: VisitDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveNotice("");
  }

  function saveReview() {
    if (!activeVisit || !draft.date || !draft.doctor.trim() || !draft.summary.trim()) {
      return;
    }

    const nextVisit = visitFromDraft(activeVisit.id, draft);
    commit({
      ...savedState,
      visits: savedState.visits
        .map((visit) => (visit.id === activeVisit.id ? nextVisit : visit))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    });
    setSaveNotice("Saved to your care notebook.");
  }

  function openAddVisit() {
    setDrawerMode("add");
    setDrawerDraft(emptyVisitDraft);
    setDrawerOpen(true);
  }

  function openEditVisit() {
    if (!activeVisit) return;
    setDrawerMode("edit");
    setDrawerDraft(draftFromVisit(activeVisit));
    setDrawerOpen(true);
  }

  function handleDrawerSave(nextDraft: VisitDraft) {
    if (drawerMode === "add") {
      const nextVisit = visitFromDraft(makeSavedId("visit"), nextDraft);
      commit({
        ...savedState,
        visits: [nextVisit, ...savedState.visits].sort((a, b) =>
          a.date < b.date ? 1 : -1,
        ),
      });
      setActiveVisitId(nextVisit.id);
      setDraft(nextDraft);
      setSaveNotice("New visit added. You can finish the review here.");
    } else if (activeVisit) {
      const nextVisit = visitFromDraft(activeVisit.id, nextDraft);
      commit({
        ...savedState,
        visits: savedState.visits
          .map((visit) => (visit.id === activeVisit.id ? nextVisit : visit))
          .sort((a, b) => (a.date < b.date ? 1 : -1)),
      });
      setDraft(nextDraft);
      setSaveNotice("Visit details updated.");
    }

    setDrawerOpen(false);
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
      setSaveNotice("PDF added to this visit.");
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
    setSaveNotice("Document removed.");
  }

  const completionRows = useMemo(() => {
    if (!activeVisit) return [];
    return [
      {
        label: "Plain-language summary",
        done: Boolean(draft.summary.trim()),
        detail: draft.summary.trim()
          ? "Captured"
          : "Summarize what the doctor said in your own words",
      },
      {
        label: "Treatment options discussed",
        done: Boolean(draft.decisionsMade.trim()),
        detail: draft.decisionsMade.trim() ? "Saved" : "Add the choices or decisions made",
      },
      {
          label: "Where to go next",
          done: Boolean(draft.followUpPlan.trim() || draft.nextAppointment.trim()),
          detail:
            draft.followUpPlan.trim() || draft.nextAppointment.trim()
            ? appointmentLabelFromVisit({
                nextAppointmentDate: draft.nextAppointmentDate,
                nextAppointmentTime: draft.nextAppointmentTime,
                nextAppointment: draft.nextAppointment,
              }) || "Next steps saved"
            : "Capture the follow-up plan or next visit",
      },
      {
        label: "Records from today",
        done: activeDocuments.length > 0,
        detail: activeDocuments.length
          ? `${activeDocuments.length} PDF${activeDocuments.length === 1 ? "" : "s"} attached`
          : "Upload an after-visit summary, lab, or discharge PDF",
      },
    ];
  }, [
    activeDocuments.length,
    activeVisit,
    draft.decisionsMade,
    draft.followUpPlan,
    draft.nextAppointment,
    draft.nextAppointmentDate,
    draft.nextAppointmentTime,
    draft.summary,
  ]);

  const completedCount = completionRows.filter((row) => row.done).length;
  const summaryStats = [
    { label: "Visits captured", value: String(visits.length) },
    { label: "Documents saved", value: String(documents.length) },
    {
      label: "Review progress",
      value: activeVisit ? `${completedCount}/${completionRows.length}` : "0/4",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand)]">
          <Icon name="clock" className="h-3.5 w-3.5" />
          After Appointment
        </span>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Review and take action
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Turn a rushed appointment into a clear record you can actually use:
              what happened, what was decided, what comes next, and the PDFs you
              may need later.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openAddVisit}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add visit
            </button>
            <Link
              href="/saved"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              <Icon name="bookmark" className="h-4 w-4" />
              Open Saved & Notes
            </Link>
          </div>
        </div>
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

      <section className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Recent visits</h2>
              <span className="text-xs text-[var(--muted)]">newest first</span>
            </div>

            <div className="mt-4 space-y-3">
              {visits.length ? (
                visits.map((visit) => {
                  const isActive = visit.id === activeVisit?.id;
                  return (
                    <button
                      key={visit.id}
                      type="button"
                      onClick={() => {
                        setActiveVisitId(visit.id);
                        setDraft(draftFromVisit(visit));
                        setSaveNotice("");
                      }}
                      className={`min-h-11 w-full rounded-2xl border px-4 py-4 text-left transition ${
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
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--line-strong)] px-4 py-6 text-center">
                  <p className="text-sm leading-6 text-slate-600">
                    No visit records yet. Add one and this page becomes your
                    post-appointment workspace.
                  </p>
                </div>
              )}
            </div>
          </section>

          {activeVisit ? (
            <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
                <span className="text-sm font-semibold text-[var(--brand)]">
                  {completedCount} of {completionRows.length} done
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {completionRows.map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        row.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[var(--line-strong)] text-transparent"
                      }`}
                    >
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{row.label}</p>
                      <p className="mt-0.5 text-sm leading-6 text-slate-500">
                        {row.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>

        <div className="min-w-0 space-y-6">
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

                  <button
                    type="button"
                    onClick={openEditVisit}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[var(--brand)]/30 hover:bg-[var(--brand-soft)]"
                  >
                    <Icon name="settings" className="h-4 w-4" />
                    Edit visit details
                  </button>
                </div>

                {saveNotice ? (
                  <div className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-soft)] px-4 py-2 text-sm font-medium text-slate-800">
                    <Icon name="check" className="h-4 w-4 text-[var(--brand)]" />
                    {saveNotice}
                  </div>
                ) : null}
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Review worksheet
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Capture the key parts of the visit in plain language so you
                      can reference them later or bring them into your next
                      appointment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={saveReview}
                    disabled={!draft.date || !draft.doctor.trim() || !draft.summary.trim()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Icon name="check" className="h-4 w-4" />
                    Save review
                  </button>
                </div>

                <div className="mt-6 grid gap-6">
                  <div>
                    <SectionLabel>Plain-language summary</SectionLabel>
                    <textarea
                      rows={5}
                      value={draft.summary}
                      onChange={(event) => updateDraft("summary", event.target.value)}
                      className={`${textareaClass} mt-2`}
                      placeholder="What happened at this appointment?"
                    />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <SectionLabel>Treatment options discussed</SectionLabel>
                      <textarea
                        rows={5}
                        value={draft.decisionsMade}
                        onChange={(event) =>
                          updateDraft("decisionsMade", event.target.value)
                        }
                        className={`${textareaClass} mt-2`}
                        placeholder="What options or decisions came up?"
                      />
                    </div>

                    <div>
                      <SectionLabel>Where to go next</SectionLabel>
                      <textarea
                        rows={5}
                        value={draft.followUpPlan}
                        onChange={(event) =>
                          updateDraft("followUpPlan", event.target.value)
                        }
                        className={`${textareaClass} mt-2`}
                        placeholder="Follow-up plan, referrals, tests, or things to watch for"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                      <SectionLabel>Prescriptions & medications</SectionLabel>
                      <textarea
                        rows={4}
                        value={draft.prescriptions}
                        onChange={(event) =>
                          updateDraft("prescriptions", event.target.value)
                        }
                        className={`${textareaClass} mt-2`}
                        placeholder="New or continued medications mentioned at this visit"
                      />
                    </div>

                    <div>
                      <SectionLabel>Next appointment</SectionLabel>
                      <div className="mt-2 grid gap-3">
                        <input
                          type="date"
                          value={draft.nextAppointmentDate}
                          onChange={(event) => {
                            const nextDate = event.target.value;
                            updateDraft("nextAppointmentDate", nextDate);
                            updateDraft(
                              "nextAppointment",
                              composeAppointmentLabel(nextDate, draft.nextAppointmentTime),
                            );
                          }}
                          className={inputClass}
                        />
                        <input
                          type="time"
                          value={draft.nextAppointmentTime}
                          onChange={(event) => {
                            const nextTime = event.target.value;
                            updateDraft("nextAppointmentTime", nextTime);
                            updateDraft(
                              "nextAppointment",
                              composeAppointmentLabel(draft.nextAppointmentDate, nextTime),
                            );
                          }}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Records from today
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Upload a visit summary, lab report, discharge instructions, or
                  any PDF you want kept with this appointment record.
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
                    Drop a PDF here or click to upload
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    PDF only · under 2 MB · saved in this browser
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
                        className="flex min-h-11 flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {document.name}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {humanFileSize(document.sizeBytes)} · added{" "}
                            {formatSavedDate(document.uploadedAt)}
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
                            className="min-h-11 text-sm font-medium text-slate-500 transition hover:text-slate-900"
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
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon name="clock" className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                No appointment reviews yet
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">
                Start by adding a visit, then use this page to summarize what
                happened, save the next-step plan, and attach any PDFs from that
                day.
              </p>
              <button
                type="button"
                onClick={openAddVisit}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add your first visit
              </button>
            </section>
          )}

          <AskBridgeInlinePrompts
            title="Use Ask Bridge to unpack what happened"
            blurb="Ask Bridge to turn doctor-speak into plain language, help you draft follow-up questions, or figure out what is still unclear after the visit."
          />
        </div>
      </section>

      <AddVisitDrawer
        key={`${drawerMode}-${activeVisitId || "new"}-${drawerOpen ? "open" : "closed"}`}
        open={drawerOpen}
        mode={drawerMode}
        initialDraft={drawerDraft}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
      />
    </div>
  );
}
