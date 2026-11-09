const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local time of day, e.g. "08:05". */
export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Short local day, e.g. "Sa, 08.11.". */
export function formatShortDay(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${pad(date.getDate())}.${pad(date.getMonth() + 1)}.`;
}

/** Value for <input type="datetime-local">, in local time, e.g. "2026-11-09T12:30". */
export function toDateTimeInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${formatClock(date)}`;
}

const DATE_TIME_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

/** Reads a datetime-local value as local time; undefined if empty or invalid. Seconds are dropped. */
export function fromDateTimeInputValue(value: string): Date | undefined {
  const match = DATE_TIME_INPUT.exec(value);
  if (!match) return undefined;
  const [year, month, day, hours, minutes] = match.slice(1, 6).map(Number) as [
    number,
    number,
    number,
    number,
    number,
  ];
  const date = new Date(year, month - 1, day, hours, minutes);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : undefined;
}

/** Local date and time, e.g. "09.11.2026 19:30". */
export function formatDateTime(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${formatClock(date)}`;
}
