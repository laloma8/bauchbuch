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
