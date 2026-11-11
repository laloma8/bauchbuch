import { describe, expect, it } from "vitest";
import { createBackupInfo } from "./backup-info";
import type { BrowserStorage } from "./entries-store";

function fakeStorage(initial: Record<string, string> = {}): BrowserStorage & { items: Map<string, string> } {
  const items = new Map(Object.entries(initial));
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
}

describe("createBackupInfo", () => {
  it("knows nothing at first", () => {
    expect(createBackupInfo(fakeStorage()).lastBackup()).toBeUndefined();
  });

  it("remembers the last backup for a new instance", () => {
    const storage = fakeStorage();
    const when = new Date("2026-11-11T08:00:00.000Z");
    createBackupInfo(storage).markBackedUp(when);
    expect(createBackupInfo(storage).lastBackup()).toEqual(when);
  });

  it("treats an unreadable value as never", () => {
    expect(createBackupInfo(fakeStorage({ "gesundheitstracker.lastBackup": "kaputt" })).lastBackup()).toBeUndefined();
  });

  it("keeps it apart from the entries", () => {
    const storage = fakeStorage();
    createBackupInfo(storage).markBackedUp(new Date());
    expect([...storage.items.keys()]).toEqual(["gesundheitstracker.lastBackup"]);
  });
});
