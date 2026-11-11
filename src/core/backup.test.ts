import { describe, expect, it } from "vitest";
import { backupFileName, backupReminder, createBackup, formatEntryCount } from "./backup";
import type { Entry } from "./entry";

const entries: Entry[] = [
  { id: "a", kind: "meal", time: "2026-11-10T07:00:00.000Z", text: "Müsli" },
  { id: "b", kind: "event", time: "2026-11-10T09:30:00.000Z", pain: "low", stool: "soft", urgency: "some", note: "x" },
];

describe("createBackup", () => {
  it("contains every entry and marks the file as a Bauchbuch backup", () => {
    const now = new Date("2026-11-11T08:00:00.000Z");
    expect(JSON.parse(createBackup(entries, now))).toEqual({
      app: "bauchbuch",
      format: 1,
      createdAt: "2026-11-11T08:00:00.000Z",
      entries,
    });
  });
});

describe("backupFileName", () => {
  it("has the date and nothing personal", () => {
    expect(backupFileName(new Date(2026, 10, 11, 9, 0))).toBe("Bauchbuch-Sicherung_2026-11-11.json");
  });
});

describe("formatEntryCount", () => {
  it("uses singular and plural", () => {
    expect(formatEntryCount(1)).toBe("1 Eintrag");
    expect(formatEntryCount(143)).toBe("143 Einträge");
  });
});

describe("backupReminder", () => {
  const now = new Date(2026, 10, 25, 20, 0);

  it("says nothing when there is nothing to back up", () => {
    expect(backupReminder(undefined, 0, now)).toBeUndefined();
  });

  it("reminds when there never was a backup", () => {
    expect(backupReminder(undefined, 3, now)).toBe("Noch keine Sicherung – jetzt sichern");
  });

  it("stays quiet up to 14 days and reminds after that", () => {
    expect(backupReminder(new Date(2026, 10, 11, 23, 0), 3, now)).toBeUndefined();
    expect(backupReminder(new Date(2026, 10, 10, 6, 0), 3, now)).toBe("Letzte Sicherung vor 15 Tagen – jetzt sichern");
  });

  it("counts calendar days across the change to winter time", () => {
    expect(backupReminder(new Date(2026, 9, 10, 12, 0), 1, new Date(2026, 9, 26, 12, 0))).toBe(
      "Letzte Sicherung vor 16 Tagen – jetzt sichern",
    );
  });
});
