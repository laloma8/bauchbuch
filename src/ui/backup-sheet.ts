import { backupFileName, createBackup, formatDate, formatEntryCount, type Entry } from "../core";
import { byId } from "./dom";
import { shareFile } from "./share-file";

const NOTHING_YET = "Noch keine Einträge zum Sichern.";
const FAILED = "Die Sicherung konnte nicht erstellt werden. Bitte versuch es noch einmal.";

export interface BackupSheet {
  /** Fills the overlay with the current entries and the date of the last backup. */
  show(entries: readonly Entry[], lastBackup: Date | undefined): void;
}

/** Content of the "Sicherung" overlay: how many entries, when last backed up, and "Sicherung teilen". */
export function createBackupSheet(onBackedUp: (when: Date) => void): BackupSheet {
  const count = byId<HTMLParagraphElement>("backup-count");
  const last = byId<HTMLParagraphElement>("backup-last");
  const share = byId<HTMLButtonElement>("backup-share");
  const message = byId<HTMLParagraphElement>("backup-message");
  let entries: readonly Entry[] = [];
  let sharing = false;

  function showLast(lastBackup: Date | undefined): void {
    last.textContent = lastBackup === undefined ? "Noch nie gesichert." : `Letzte Sicherung: ${formatDate(lastBackup)}`;
  }

  share.addEventListener("click", () => {
    if (sharing || entries.length === 0) return;
    sharing = true;
    message.textContent = "Sicherung wird erstellt …";
    const now = new Date();
    const file = new File([createBackup(entries, now)], backupFileName(now), { type: "application/json" });
    shareFile(file, "Bauchbuch-Sicherung")
      .then((outcome) => {
        message.textContent = "";
        // Cancelling the share menu is not a backup.
        if (outcome === "cancelled") return;
        showLast(now);
        onBackedUp(now);
      })
      .catch(() => {
        message.textContent = FAILED;
      })
      .finally(() => {
        sharing = false;
      });
  });

  return {
    show(newEntries, lastBackup) {
      entries = newEntries;
      count.textContent = formatEntryCount(entries.length);
      showLast(lastBackup);
      const anything = entries.length > 0;
      share.disabled = !anything;
      share.classList.toggle("ready", anything);
      message.textContent = anything ? "" : NOTHING_YET;
    },
  };
}
