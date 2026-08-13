"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/shell/Icon";
import { VisitAppLink } from "@/components/VisitAppLink";
import { appointmentDateFromVisit, appointmentLabelFromVisit } from "@/lib/appointments";
import { loadSavedHistory, type SavedHistoryState } from "@/lib/savedHistory";
import type { VisitRecord } from "@/lib/types";

type PhaseKey = "before" | "during" | "after";

type ChecklistStep = {
  label: string;
  done: boolean;
  result?: string;
  href: string;
};

type Phase = {
  key: PhaseKey;
  label: string;
  heading: string;
  cta: string;
  href: string;
  steps: ChecklistStep[];
};

function summarizeText(value: string, fallback: string, maxWords = 5) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const words = trimmed.split(/\s+/).slice(0, maxWords).join(" ");
  return trimmed.split(/\s+/).length > maxWords ? `${words}…` : words;
}

function buildPhases(visit: VisitRecord, documentCount: number): Phase[] {
  const symptomResult = visit.symptomsDiscussed.length
    ? visit.symptomsDiscussed.slice(0, 3).join(", ")
    : visit.preVisitNotes?.trim()
      ? "notes saved"
      : undefined;

  return [
    {
      key: "before",
      label: "Before",
      heading: "Get ready",
      cta: "Finish preparing",
      href: "/before",
      steps: [
        {
          label: "Describe symptoms",
          done: Boolean(visit.symptomsDiscussed.length || visit.preVisitNotes?.trim()),
          result: symptomResult,
          href: "/before",
        },
        {
          label: "Possible conditions",
          done: Boolean(visit.possibleConditions?.trim()),
          result: visit.possibleConditions?.trim()
            ? summarizeText(visit.possibleConditions, "saved")
            : undefined,
          href: "/before",
        },
        {
          label: "Questions to ask",
          done: Boolean(visit.questionsForDoctor?.length),
          result: visit.questionsForDoctor?.length
            ? `${visit.questionsForDoctor.length} generated`
            : undefined,
          href: "/before",
        },
        {
          label: "What to expect",
          done: Boolean(visit.whatToExpectNotes?.trim()),
          result: visit.whatToExpectNotes?.trim() ? "plan saved" : undefined,
          href: "/before",
        },
      ],
    },
    {
      key: "during",
      label: "During",
      heading: "During your visit",
      cta: "Start your visit",
      href: "/during",
      steps: [
        {
          label: "Running notes",
          done: Boolean(visit.duringVisitNotes?.trim()),
          result: visit.duringVisitNotes?.trim() ? "notes saved" : undefined,
          href: "/during",
        },
        {
          label: "Language support",
          done: Boolean(visit.languageSupportPlan?.trim()),
          result: visit.languageSupportPlan?.trim() ? "ready" : undefined,
          href: "/during",
        },
        {
          label: "Important terms",
          done: Boolean(visit.visitTerms?.length),
          result: visit.visitTerms?.length
            ? visit.visitTerms.slice(0, 2).join(", ")
            : undefined,
          href: "/during",
        },
        {
          label: "Key points & questions",
          done: Boolean(visit.remainingQuestions?.length || visit.duringKeyPoints?.trim()),
          result: visit.remainingQuestions?.length
            ? `${visit.remainingQuestions.length} still open`
            : visit.duringKeyPoints?.trim()
              ? "captured"
              : undefined,
          href: "/during",
        },
      ],
    },
    {
      key: "after",
      label: "After",
      heading: "Review",
      cta: "Review your visit",
      href: "/after",
      steps: [
        {
          label: "Appointment summary",
          done: Boolean(visit.summary.trim()),
          result: visit.summary.trim() ? "draft ready" : undefined,
          href: "/after",
        },
        {
          label: "Treatment options",
          done: Boolean(visit.decisionsMade.trim()),
          result: visit.decisionsMade.trim() ? "saved" : undefined,
          href: "/after",
        },
        {
          label: "Where to go next",
          done: Boolean(
            visit.followUpPlan.trim() || appointmentLabelFromVisit(visit).trim(),
          ),
          result: appointmentLabelFromVisit(visit).trim()
            ? appointmentLabelFromVisit(visit)
            : visit.followUpPlan.trim()
              ? "next steps saved"
              : undefined,
          href: "/after",
        },
        {
          label: "Records from today",
          done: documentCount > 0,
          result: documentCount ? `${documentCount} attached` : undefined,
          href: "/after",
        },
      ],
    },
  ];
}

function phaseForTime(now: Date, start: Date, end: Date): PhaseKey {
  if (now < start) return "before";
  if (now <= end) return "during";
  return "after";
}

function phaseUnlockText(phase: PhaseKey, start: Date, end: Date) {
  if (phase === "before") return "Open now";
  if (phase === "during") {
    return `opens at ${new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(start)}`;
  }
  return `opens after ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(end)}`;
}

function relativeAppointmentLabel(now: Date, start: Date) {
  const diffMs = start.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(
    (Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) -
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000,
  );

  if (diffDays === 0) {
    if (diffHours > 0) {
      return `Today · in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
    }
    return `Today · in ${Math.max(diffMinutes, 1)} minute${diffMinutes === 1 ? "" : "s"}`;
  }
  if (diffDays === 1) {
    return `Tomorrow · ${new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(start)}`;
  }
  if (diffDays < 0) {
    return `Completed · ${new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(start)}`;
  }
  return `In ${diffDays} days`;
}

function absoluteDate(start: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start);
}

function nextIncompleteStep(phase: Phase) {
  return phase.steps.find((step) => !step.done) ?? phase.steps[phase.steps.length - 1];
}

function completeCount(phase: Phase) {
  return phase.steps.filter((step) => step.done).length;
}

function pickDashboardVisit(savedState: SavedHistoryState, now: Date) {
  const visitsWithAppointments = savedState.visits
    .map((visit) => ({
      visit,
      appointmentStart: appointmentDateFromVisit(visit),
    }))
    .filter(
      (item): item is { visit: VisitRecord; appointmentStart: Date } =>
        item.appointmentStart instanceof Date,
    )
    .sort((a, b) => a.appointmentStart.getTime() - b.appointmentStart.getTime());

  const upcomingOrCurrent = visitsWithAppointments.find(({ appointmentStart }) => {
    const appointmentEnd = new Date(appointmentStart.getTime() + 60 * 60000);
    return appointmentEnd >= now;
  });

  if (upcomingOrCurrent) return upcomingOrCurrent;
  return visitsWithAppointments.at(-1) ?? null;
}

export function HomeDashboard() {
  const [savedState] = useState(() => loadSavedHistory());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const appointmentContext = useMemo(
    () => pickDashboardVisit(savedState, now),
    [now, savedState],
  );

  if (!appointmentContext) {
    return (
      <div className="mx-auto max-w-[1040px] space-y-6">
        <section className="rounded-[24px] bg-[var(--surface)] px-6 py-6 shadow-[var(--card-shadow)] ring-1 ring-[var(--line)]">
          <p className="text-sm font-medium text-[var(--muted)]">Home</p>
          <h1 className="mt-2 text-[26px] font-semibold tracking-tight text-[var(--foreground)]">
            No appointments scheduled
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Add your next appointment and Bridge will line up the right steps in the
            order you need them.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/saved"
              className="inline-flex min-h-11 items-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              Add an appointment
            </Link>
            <VisitAppLink className="inline-flex min-h-11 items-center rounded-xl border border-[var(--line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]">
              Open live visit
            </VisitAppLink>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <VisitAppLink className="rounded-[22px] bg-[var(--surface-raised)] px-5 py-5 shadow-[var(--soft-shadow)] transition hover:bg-[var(--surface)]">
            <p className="text-sm font-semibold text-[var(--foreground)]">Live visit</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Captions, questions, and the family note — the extra chair in the room.
            </p>
          </VisitAppLink>
          <Link
            href="/profile"
            className="rounded-[22px] bg-[var(--surface-raised)] px-5 py-5 shadow-[var(--soft-shadow)] transition hover:bg-[var(--surface)]"
          >
            <p className="text-sm font-semibold text-[var(--foreground)]">Find clinical trials</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Match your profile against active studies and build questions for your next conversation.
            </p>
          </Link>
        </section>
      </div>
    );
  }

  const { visit, appointmentStart } = appointmentContext;
  const start = appointmentStart;
  const end = new Date(start.getTime() + 60 * 60000);
  const activePhaseKey = phaseForTime(now, start, end);
  const documentCount = savedState.documents.filter((doc) => doc.visitId === visit.id).length;
  const phases = buildPhases(visit, documentCount);
  const activePhase = phases.find((phase) => phase.key === activePhaseKey) ?? phases[0];
  const heroStep = nextIncompleteStep(activePhase);
  const progressText = `${completeCount(activePhase)} of ${activePhase.steps.length} steps done`;

  return (
    <div className="mx-auto max-w-[1040px] space-y-6">
      <section className="rounded-[24px] bg-[var(--surface)] px-6 py-6 shadow-[var(--card-shadow)] ring-1 ring-[var(--line)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--brand)]">
              {relativeAppointmentLabel(now, start)}
            </p>
            <h1 className="mt-2 text-[22px] font-medium tracking-tight text-[var(--foreground)]">
              {visit.doctor} · {visit.specialty || "Upcoming appointment"}
            </h1>
            <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">
              {[visit.location, absoluteDate(start)]
                .filter(Boolean)
                .join(" · ")}{" "}
              ·{" "}
              {new Intl.DateTimeFormat("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }).format(start)}
            </p>
          </div>

          <p className="shrink-0 text-sm font-medium text-[var(--muted)] md:pt-1">
            {progressText}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {activePhaseKey === "during" ? (
            <VisitAppLink className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]">
              {activePhase.cta}
            </VisitAppLink>
          ) : (
            <Link
              href={heroStep.href}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              {activePhase.cta}
            </Link>
          )}
          <Link
            href={activePhase.href}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
          >
            View details
          </Link>
        </div>
      </section>

      <section className="rounded-[20px] bg-[var(--surface)] px-4 py-4 shadow-[var(--soft-shadow)] ring-1 ring-[var(--line)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {phases.map((phase, index) => {
            const isActive = phase.key === activePhaseKey;
            const isLocked =
              (phase.key === "during" && activePhaseKey === "before") ||
              (phase.key === "after" && activePhaseKey !== "after");

            return (
              <div key={phase.key} className="flex min-w-0 flex-1 items-center gap-3">
                <div
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    isActive
                      ? "bg-[var(--brand)] text-white"
                      : "bg-transparent text-[var(--muted)] ring-1 ring-[var(--line-strong)]"
                  }`}
                >
                  {isLocked ? (
                    <Icon name="lock" className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--muted)]/70" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-[var(--brand)]" : "text-[var(--foreground)]"
                    }`}
                  >
                    {phase.label}
                    {isLocked ? " · " : ""}
                    {isLocked ? (
                      <span className="font-normal text-[var(--muted)]">
                        {phaseUnlockText(phase.key, start, end)}
                      </span>
                    ) : null}
                  </p>
                </div>
                {index < phases.length - 1 ? (
                  <div className="hidden h-px flex-1 bg-[var(--line-strong)] md:block" />
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] bg-[var(--surface)] px-5 py-5 shadow-[var(--card-shadow)] ring-1 ring-[var(--line)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Active phase
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {activePhase.heading}
            </h2>
          </div>
          <span className="text-sm font-medium text-[var(--muted)]">
            {progressText}
          </span>
        </div>

        <div className="mt-4 divide-y divide-[var(--hairline)]">
          {activePhase.steps.map((step) => {
            if (step.done) {
              return (
                <div
                  key={step.label}
                  className="flex min-h-12 items-center gap-3 py-3"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                    <Icon name="check" className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-[var(--muted)]">
                    {step.label}
                  </span>
                  <span className="max-w-[42%] truncate text-right text-sm text-[var(--muted)]">
                    {step.result}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={step.label}
                href={step.href}
                className="flex min-h-12 items-center gap-3 py-3 transition hover:bg-[var(--surface-raised)]"
              >
                <span className="h-6 w-6 shrink-0 rounded-full border border-[var(--line-strong)] bg-transparent" />
                <span className="min-w-0 flex-1 text-sm font-medium text-[var(--foreground)]">
                  {step.label}
                </span>
                <span className="text-sm font-semibold text-[var(--brand)]">
                  Start →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <VisitAppLink className="rounded-[22px] bg-[var(--surface-raised)] px-5 py-5 shadow-[var(--soft-shadow)] transition hover:bg-[var(--surface)]">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Icon name="globe" className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold">Live visit</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            When you are in the room, open the companion for captions, questions, and the family note.
          </p>
        </VisitAppLink>

        <Link
          href="/profile"
          className="rounded-[22px] bg-[var(--surface-raised)] px-5 py-5 shadow-[var(--soft-shadow)] transition hover:bg-[var(--surface)]"
        >
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <Icon name="flask" className="h-4 w-4 text-[var(--brand)]" />
            <h2 className="text-sm font-semibold">Find clinical trials</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Match your profile against active studies and turn the results into questions worth bringing to your care team.
          </p>
        </Link>
      </section>
    </div>
  );
}
