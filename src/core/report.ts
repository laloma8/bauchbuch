import { addDays, entriesOfDay, startOfDay } from "./day";
import type { Entry } from "./entry";
import { describeEvent, type SymptomEvent } from "./event";
import { formatClock, toDateInputValue } from "./format";
import type { Meal } from "./meal";

/** How far back the report goes by default: the last 4 weeks up to today. */
const DEFAULT_DAYS_BACK = 28;

export interface ReportRange {
  from: Date;
  to: Date;
}

export type RangeResult = ({ ok: true } & ReportRange) | { ok: false; error: "from-after-to" };

/** One table row: a day with its meals and events, each earliest first. */
export interface ReportDay {
  day: Date;
  meals: Meal[];
  events: SymptomEvent[];
}

export function defaultReportRange(today: Date): ReportRange {
  const to = startOfDay(today);
  return { from: addDays(to, -DEFAULT_DAYS_BACK), to };
}

/** "Bis" never lies in the future; "Von" must not be after "Bis". */
export function checkReportRange(from: Date, to: Date, today: Date): RangeResult {
  const latest = startOfDay(today);
  const end = startOfDay(to).getTime() > latest.getTime() ? latest : startOfDay(to);
  const start = startOfDay(from);
  if (start.getTime() > end.getTime()) return { ok: false, error: "from-after-to" };
  return { ok: true, from: start, to: end };
}

/** Every day from `from` to `to` (both included), oldest first – also days without entries. */
export function buildReportDays(entries: readonly Entry[], from: Date, to: Date): ReportDay[] {
  const days: ReportDay[] = [];
  for (let day = startOfDay(from); day.getTime() <= startOfDay(to).getTime(); day = addDays(day, 1)) {
    // entriesOfDay lists the latest first; a report reads like a diary, so turn it around.
    const ofDay = entriesOfDay(entries, day).reverse();
    days.push({
      day,
      meals: ofDay.filter((entry): entry is Meal => entry.kind === "meal"),
      events: ofDay.filter((entry): entry is SymptomEvent => entry.kind === "event"),
    });
  }
  return days;
}

export function hasReportEntries(days: readonly ReportDay[]): boolean {
  return days.some((day) => day.meals.length > 0 || day.events.length > 0);
}

/** "08:00 Müsli". */
export function mealLine(meal: Meal): string {
  return `${formatClock(new Date(meal.time))} ${meal.text}`;
}

/** "10:30 Schmerzen mittel · Stuhlgang flüssig · Dringlichkeit stark"; the note is shown separately. */
export function eventLine(event: SymptomEvent): string {
  return `${formatClock(new Date(event.time))} ${describeEvent(event)}`;
}

/** File name without any personal details, e.g. "Ess-und-Beschwerdeprotokoll_2026-10-12_bis_2026-11-10.pdf". */
export function reportFileName(from: Date, to: Date): string {
  return `Ess-und-Beschwerdeprotokoll_${toDateInputValue(from)}_bis_${toDateInputValue(to)}.pdf`;
}
