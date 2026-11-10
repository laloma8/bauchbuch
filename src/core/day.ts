/** True if both points in time fall on the same calendar day in local time. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** The entries of the given local day, latest first. */
export function entriesOfDay<T extends { time: string }>(entries: readonly T[], day: Date): T[] {
  return entries
    .filter((entry) => isSameLocalDay(new Date(entry.time), day))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

/** Local midnight of the given day. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Midnight of the day `days` later (or earlier, if negative); stays right across clock changes. */
export function addDays(day: Date, days: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() + days);
}

/** Suggested time for a new entry: now, or the current time of day on an earlier day being shown. */
export function prefillTime(shownDay: Date, now: Date): Date {
  if (isSameLocalDay(shownDay, now)) return now;
  return new Date(shownDay.getFullYear(), shownDay.getMonth(), shownDay.getDate(), now.getHours(), now.getMinutes());
}
