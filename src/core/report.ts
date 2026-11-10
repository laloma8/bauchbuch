import { addDays, entriesOfDay, startOfDay } from "./day";
import type { Entry } from "./entry";
import { describeEvent } from "./event";
import { formatClock, toDateInputValue } from "./format";

/** How far back the report goes by default: the last 4 weeks up to today. */
const DEFAULT_DAYS_BACK = 28;

export interface ReportRange {
  from: Date;
  to: Date;
}

export type RangeResult = ({ ok: true } & ReportRange) | { ok: false; error: "from-after-to" };

/** One day of the report with its meals and events mixed, earliest first. */
export interface ReportDay {
  day: Date;
  entries: Entry[];
}

/** One line of the report: "08:00  Mahlzeit  Müsli", the note of an event below it. */
export interface ReportLine {
  time: string;
  kind: "Mahlzeit" | "Ereignis";
  text: string;
  note?: string;
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
    days.push({ day, entries: entriesOfDay(entries, day).reverse() });
  }
  return days;
}

export function hasReportEntries(days: readonly ReportDay[]): boolean {
  return days.some((day) => day.entries.length > 0);
}

export function reportLine(entry: Entry): ReportLine {
  const time = formatClock(new Date(entry.time));
  if (entry.kind === "meal") return { time, kind: "Mahlzeit", text: entry.text };
  const line: ReportLine = { time, kind: "Ereignis", text: describeEvent(entry) };
  if (entry.note !== "") line.note = entry.note;
  return line;
}

/** File name without any personal details, e.g. "Ess-und-Beschwerdeprotokoll_2026-10-12_bis_2026-11-10.pdf". */
export function reportFileName(from: Date, to: Date): string {
  return `Ess-und-Beschwerdeprotokoll_${toDateInputValue(from)}_bis_${toDateInputValue(to)}.pdf`;
}
