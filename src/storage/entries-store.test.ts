import { describe, expect, it } from "vitest";
import type { Meal, SymptomEvent } from "../core";
import { createEntriesStore, type BrowserStorage } from "./entries-store";

const KEY = "gesundheitstracker.v1";

class FakeStorage implements BrowserStorage {
  readonly items = new Map<string, string>();
  failOnWrite = false;

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failOnWrite) throw new Error("QuotaExceededError");
    this.items.set(key, value);
  }
}

const pasta: Meal = { id: "a", kind: "meal", time: "2026-11-09T11:30:00.000Z", text: "Nudeln mit Pesto" };
const muesli: Meal = { id: "b", kind: "meal", time: "2026-11-09T07:00:00.000Z", text: "Müsli" };
const cramps: SymptomEvent = {
  id: "c",
  kind: "event",
  time: "2026-11-09T13:00:00.000Z",
  pain: "medium",
  stool: "liquid",
  urgency: "strong",
  note: "nach dem Kaffee",
};
const painOnly: SymptomEvent = { id: "d", kind: "event", time: "2026-11-09T15:00:00.000Z", pain: "low", stool: "none", note: "" };

describe("createEntriesStore", () => {
  it("starts empty", () => {
    expect(createEntriesStore(new FakeStorage()).loadEntries()).toEqual([]);
  });

  it("keeps saved meals and events for a new store on the same storage", () => {
    const storage = new FakeStorage();
    const store = createEntriesStore(storage);
    for (const entry of [pasta, cramps, muesli, painOnly]) expect(store.addEntry(entry)).toBe("ok");

    expect(createEntriesStore(storage).loadEntries()).toEqual([pasta, cramps, muesli, painOnly]);
  });

  it("reads data saved before events existed and adds an event to it", () => {
    const storage = new FakeStorage();
    storage.items.set(KEY, JSON.stringify({ version: 1, entries: [pasta, muesli] }));
    const store = createEntriesStore(storage);

    expect(store.loadEntries()).toEqual([pasta, muesli]);
    expect(store.addEntry(cramps)).toBe("ok");
    expect(store.loadEntries()).toEqual([pasta, muesli, cramps]);
  });

  it("reports a failed write and keeps the earlier entries", () => {
    const storage = new FakeStorage();
    const store = createEntriesStore(storage);
    store.addEntry(pasta);
    storage.failOnWrite = true;

    expect(store.addEntry(cramps)).toBe("failed");
    expect(store.loadEntries()).toEqual([pasta]);
  });

  it("never overwrites data it can't read", () => {
    for (const unreadable of [
      "{kaputt",
      JSON.stringify({ version: 2, entries: [] }),
      JSON.stringify({ version: 1, entries: [{ id: 1 }] }),
      JSON.stringify({ version: 1, entries: [{ ...cramps, stool: "Durchfall" }] }),
      JSON.stringify({ version: 1, entries: [{ ...cramps, kind: "other" }] }),
    ]) {
      const storage = new FakeStorage();
      storage.items.set(KEY, unreadable);
      const store = createEntriesStore(storage);

      expect(store.loadEntries()).toEqual([]);
      expect(store.addEntry(pasta)).toBe("failed");
      expect(storage.items.get(KEY)).toBe(unreadable);
    }
  });
});
