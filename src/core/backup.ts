import { startOfDay } from "./day";
import type { Entry } from "./entry";
import { toDateInputValue } from "./format";

/** Marks a file as a Bauchbuch backup, so reading it back (slice 10) can reject other files. */
export const BACKUP_APP = "bauchbuch";
export const BACKUP_FORMAT = 1;

/** Remind to back up once the last backup is more than this many days old. */
const REMIND_AFTER_DAYS = 14;

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  /** When the backup was made, as an ISO string. */
  createdAt: string;
  entries: Entry[];
}

/** All entries as the text of a backup file. */
export function createBackup(entries: readonly Entry[], now: Date): string {
  const backup: BackupFile = { app: BACKUP_APP, format: BACKUP_FORMAT, createdAt: now.toISOString(), entries: [...entries] };
  return JSON.stringify(backup, null, 1);
}

/** E.g. "Bauchbuch-Sicherung_2026-11-11.json" – the date only, nothing personal. */
export function backupFileName(day: Date): string {
  return `Bauchbuch-Sicherung_${toDateInputValue(day)}.json`;
}

/** "1 Eintrag", "143 Einträge". */
export function formatEntryCount(count: number): string {
  return count === 1 ? "1 Eintrag" : `${count} Einträge`;
}

/** Whole calendar days from `earlier` to `later`, also across clock changes. */
function daysBetween(earlier: Date, later: Date): number {
  const from = startOfDay(earlier);
  const to = startOfDay(later);
  const utc = (day: Date) => Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * The hint on the start page, or undefined when none is needed: nothing to back up yet,
 * or the last backup is at most 14 days old.
 */
export function backupReminder(lastBackup: Date | undefined, entryCount: number, now: Date): string | undefined {
  if (entryCount === 0) return undefined;
  if (lastBackup === undefined) return "Noch keine Sicherung – jetzt sichern";
  const days = daysBetween(lastBackup, now);
  return days > REMIND_AFTER_DAYS ? `Letzte Sicherung vor ${days} Tagen – jetzt sichern` : undefined;
}
