import type { VisitRecord } from "./types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseLooseAppointment(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const exact = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
  );
  if (!exact) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, datePart, hourPart, minutePart, meridiemPart] = exact;
  const [year, month, day] = datePart.split("-").map(Number);
  let hours = hourPart ? Number(hourPart) : 12;
  const minutes = minutePart ? Number(minutePart) : 0;
  const meridiem = meridiemPart?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return new Date(year, month - 1, day, hours, minutes);
}

export function inferAppointmentInputs(raw: string) {
  const parsed = parseLooseAppointment(raw);
  if (!parsed) {
    return { date: "", time: "" };
  }

  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

export function composeAppointmentLabel(date: string, time: string) {
  if (!date) return "";
  if (!time) return date;

  const [hoursRaw, minutesRaw] = time.split(":").map(Number);
  const hours = Number.isFinite(hoursRaw) ? hoursRaw : 0;
  const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 0;
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${date} ${hour12}:${pad(minutes)} ${suffix}`;
}

export function appointmentDateFromVisit(visit: Pick<VisitRecord, "nextAppointment" | "nextAppointmentDate" | "nextAppointmentTime">) {
  if (visit.nextAppointmentDate) {
    const [year, month, day] = visit.nextAppointmentDate.split("-").map(Number);
    const [hours, minutes] = (visit.nextAppointmentTime || "12:00")
      .split(":")
      .map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
  }

  return parseLooseAppointment(visit.nextAppointment);
}

export function appointmentLabelFromVisit(
  visit: Pick<VisitRecord, "nextAppointment" | "nextAppointmentDate" | "nextAppointmentTime">,
) {
  if (visit.nextAppointmentDate) {
    return composeAppointmentLabel(
      visit.nextAppointmentDate,
      visit.nextAppointmentTime || "",
    );
  }
  return visit.nextAppointment;
}

export function formatAppointmentBadge(
  visit: Pick<VisitRecord, "nextAppointment" | "nextAppointmentDate" | "nextAppointmentTime">,
) {
  const parsed = appointmentDateFromVisit(visit);
  if (!parsed) return appointmentLabelFromVisit(visit);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
