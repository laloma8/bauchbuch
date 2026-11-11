import type { BrowserStorage } from "./entries-store";

const KEY = "gesundheitstracker.lastBackup";

export interface BackupInfo {
  /** When the entries were last backed up; undefined if never (or the saved value is unreadable). */
  lastBackup(): Date | undefined;
  markBackedUp(when: Date): void;
}

/** Remembers the date of the last backup on this phone, apart from the entries themselves. */
export function createBackupInfo(storage: BrowserStorage): BackupInfo {
  return {
    lastBackup() {
      let raw: string | null;
      try {
        raw = storage.getItem(KEY);
      } catch {
        return undefined;
      }
      if (raw === null) return undefined;
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? undefined : date;
    },
    markBackedUp(when) {
      try {
        storage.setItem(KEY, when.toISOString());
      } catch {
        // Only the reminder depends on this; the backup itself has already been handed on.
      }
    },
  };
}
