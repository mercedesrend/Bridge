"use client";

import { useEffect, useId, useMemo } from "react";
import { Icon } from "@/components/shell/Icon";
import { appointmentLabelFromVisit } from "@/lib/appointments";
import type { SavedDocument, VisitRecord } from "@/lib/types";

function formatVisitDate(date: string) {
  if (!date) return "Undated";
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatShortDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
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

function DocSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6368]">
        {title}
      </h3>
      <div className="mt-2 text-[15px] leading-7 text-[#202124]">{children}</div>
    </section>
  );
}

export function CareNotebookTab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed right-0 top-[42%] z-30 flex -translate-y-1/2 items-center gap-2 rounded-l-xl border border-r-0 border-[var(--line)] bg-white px-2.5 py-3 shadow-[0_8px_24px_rgba(39,43,72,0.12)] transition hover:bg-[var(--brand-soft)]"
      aria-label="Open care notebook"
      title="Care notebook"
    >
      <Icon name="doc" className="h-4 w-4 text-[var(--brand)]" />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        Care notebook
      </span>
    </button>
  );
}

export function CareNotebook({
  open,
  onClose,
  visits,
  documents,
}: {
  open: boolean;
  onClose: () => void;
  visits: VisitRecord[];
  documents: SavedDocument[];
}) {
  const titleId = useId();
  const orderedVisits = useMemo(
    () => [...visits].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [visits],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8f9fa]">
      <header className="flex items-center justify-between gap-3 border-b border-[#dadce0] bg-white px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
            <Icon name="doc" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p id={titleId} className="truncate text-sm font-medium text-[#202124]">
              Care notebook
            </p>
            <p className="truncate text-xs text-[#5f6368]">
              All visits, documents, and prescriptions in one place
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden min-h-10 rounded-lg border border-[#dadce0] px-3 text-sm font-medium text-[#3c4043] transition hover:bg-[#f1f3f4] sm:inline-flex sm:items-center"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-[#5f6368] transition hover:bg-[#f1f3f4] hover:text-[#202124]"
            aria-label="Close care notebook"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-[#dadce0] bg-white p-4 lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6368]">
            Outline
          </p>
          <nav className="mt-3 space-y-1">
            {orderedVisits.map((visit) => (
              <a
                key={visit.id}
                href={`#notebook-${visit.id}`}
                className="block rounded-lg px-2.5 py-2 text-sm text-[#3c4043] transition hover:bg-[#f1f3f4]"
              >
                <span className="block font-medium">{formatShortDate(visit.date)}</span>
                <span className="block truncate text-xs text-[#5f6368]">
                  {visit.doctor}
                </span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex-1 overflow-y-auto px-3 py-8 sm:px-6">
          <article
            role="document"
            aria-labelledby={titleId}
            className="mx-auto min-h-[calc(100vh-8rem)] max-w-[816px] rounded-sm bg-white px-8 py-12 shadow-[0_1px_3px_rgba(60,64,67,0.15),0_4px_8px_3px_rgba(60,64,67,0.08)] sm:px-16 sm:py-14"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            <h1 className="text-3xl font-normal tracking-tight text-[#202124] sm:text-4xl">
              Care notebook
            </h1>
            <p
              className="mt-3 text-sm text-[#5f6368]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              A running record of visits, prescriptions, and attached documents.
              Stored locally in this browser.
            </p>
            <div className="mt-6 h-px bg-[#dadce0]" />

            {orderedVisits.length === 0 ? (
              <p className="mt-10 text-[15px] leading-7 text-[#5f6368]">
                No visits saved yet. Add a visit from Saved & Notes, then open this
                notebook to see everything in one continuous document.
              </p>
            ) : (
              orderedVisits.map((visit, index) => {
                const visitDocs = documents.filter((doc) => doc.visitId === visit.id);
                return (
                  <section
                    key={visit.id}
                    id={`notebook-${visit.id}`}
                    className={index === 0 ? "mt-10" : "mt-14 border-t border-[#e8eaed] pt-10"}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      Visit {orderedVisits.length - index}
                    </p>
                    <h2 className="mt-2 text-2xl font-normal text-[#202124]">
                      {formatVisitDate(visit.date)}
                    </h2>
                    <p
                      className="mt-1 text-sm text-[#5f6368]"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {[visit.doctor, visit.specialty, visit.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <DocSection title="What happened">
                      <p>{visit.summary}</p>
                    </DocSection>

                    {visit.symptomsDiscussed.length ? (
                      <DocSection title="Symptoms discussed">
                        <p>{visit.symptomsDiscussed.join(", ")}</p>
                      </DocSection>
                    ) : null}

                    {visit.preVisitNotes ? (
                      <DocSection title="Before the visit">
                        <p>{visit.preVisitNotes}</p>
                      </DocSection>
                    ) : null}

                    {visit.possibleConditions ? (
                      <DocSection title="Topics worth asking about">
                        <p>{visit.possibleConditions}</p>
                      </DocSection>
                    ) : null}

                    {visit.questionsForDoctor?.length ? (
                      <DocSection title="Questions for the doctor">
                        <ul className="list-disc space-y-1 pl-5">
                          {visit.questionsForDoctor.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </DocSection>
                    ) : null}

                    {visit.whatToExpectNotes ? (
                      <DocSection title="What to bring or expect">
                        <p>{visit.whatToExpectNotes}</p>
                      </DocSection>
                    ) : null}

                    {visit.duringVisitNotes ? (
                      <DocSection title="During the visit notes">
                        <p>{visit.duringVisitNotes}</p>
                      </DocSection>
                    ) : null}

                    {visit.languageSupportPlan ? (
                      <DocSection title="Language support plan">
                        <p>{visit.languageSupportPlan}</p>
                      </DocSection>
                    ) : null}

                    {visit.visitTerms?.length ? (
                      <DocSection title="Terms and names to revisit">
                        <p>{visit.visitTerms.join(", ")}</p>
                      </DocSection>
                    ) : null}

                    {visit.remainingQuestions?.length ? (
                      <DocSection title="Questions still open">
                        <ul className="list-disc space-y-1 pl-5">
                          {visit.remainingQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </DocSection>
                    ) : null}

                    {visit.duringKeyPoints ? (
                      <DocSection title="Key points before leaving">
                        <p>{visit.duringKeyPoints}</p>
                      </DocSection>
                    ) : null}

                    {visit.treatmentOptions?.length ? (
                      <DocSection title="Treatment options discussed">
                        <ul className="space-y-3" style={{ fontFamily: "var(--font-sans)" }}>
                          {visit.treatmentOptions.map((option) => (
                            <li key={option.id}>
                              <p className="font-medium text-[#202124]">
                                {option.name || "Unnamed option"}
                              </p>
                              <p className="text-[#5f6368]">
                                Status: {option.status.replaceAll("_", " ")}
                              </p>
                              {option.questions.length ? (
                                <p className="text-[#5f6368]">
                                  Questions: {option.questions.join(" | ")}
                                </p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </DocSection>
                    ) : null}

                    {visit.secondOpinionReasons?.length ? (
                      <DocSection title="Why a second opinion may help">
                        <ul className="list-disc space-y-1 pl-5">
                          {visit.secondOpinionReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </DocSection>
                    ) : null}

                    {visit.recordsRequestPlan ? (
                      <DocSection title="Records request plan">
                        <p>{visit.recordsRequestPlan}</p>
                      </DocSection>
                    ) : null}

                    {visit.specialistSearchNotes ? (
                      <DocSection title="Specialist search notes">
                        <p>{visit.specialistSearchNotes}</p>
                      </DocSection>
                    ) : null}

                    {visit.secondOpinionQuestions?.length ? (
                      <DocSection title="Second-opinion consult questions">
                        <ul className="list-disc space-y-1 pl-5">
                          {visit.secondOpinionQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      </DocSection>
                    ) : null}

                    {visit.decisionsMade ? (
                      <DocSection title="Decisions made">
                        <p>{visit.decisionsMade}</p>
                      </DocSection>
                    ) : null}

                    {visit.followUpPlan ? (
                      <DocSection title="Follow-up plan">
                        <p>{visit.followUpPlan}</p>
                      </DocSection>
                    ) : null}

                    {visit.prescriptions ? (
                      <DocSection title="Prescriptions & medications">
                        <p>{visit.prescriptions}</p>
                      </DocSection>
                    ) : null}

                    {appointmentLabelFromVisit(visit) ? (
                      <DocSection title="Next appointment">
                        <p>{appointmentLabelFromVisit(visit)}</p>
                      </DocSection>
                    ) : null}

                    <DocSection title="Documents">
                      {visitDocs.length ? (
                        <ul
                          className="space-y-2"
                          style={{ fontFamily: "var(--font-sans)" }}
                        >
                          {visitDocs.map((doc) => (
                            <li key={doc.id}>
                              <a
                                href={doc.dataUrl}
                                download={doc.name}
                                className="font-medium text-[var(--brand)] hover:underline"
                              >
                                {doc.name}
                              </a>
                              <span className="text-[#5f6368]">
                                {" "}
                                · {humanFileSize(doc.sizeBytes)} · added{" "}
                                {formatShortDate(doc.uploadedAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#5f6368]">No documents attached.</p>
                      )}
                    </DocSection>
                  </section>
                );
              })
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
