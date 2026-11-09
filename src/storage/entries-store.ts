import { PAIN_LEVELS, STOOL_LEVELS, URGENCY_LEVELS, type Entry } from "../core";

const KEY = "gesundheitstracker.v1";
const VERSION = 1;

interface StoredData {
  version: typeof VERSION;
  entries: Entry[];
}

export type BrowserStorage = Pick<Storage, "getItem" | "setItem">;

export interface EntriesStore {
  /** All saved meals and events; empty if nothing is saved yet or the saved data can't be read. */
  loadEntries(): Entry[];
  /** Saves one more entry. "failed" if writing fails or the saved data can't be read. */
  addEntry(entry: Entry): "ok" | "failed";
}

type ReadResult = { ok: true; data: StoredData } | { ok: false };

function isOneOf<T extends string>(levels: readonly T[], value: unknown): value is T {
  return (levels as readonly unknown[]).includes(value);
}

function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  if (typeof entry.id !== "string" || typeof entry.time !== "string") return false;
  if (entry.kind === "meal") return typeof entry.text === "string";
  if (entry.kind === "event") {
    return (
      isOneOf(PAIN_LEVELS, entry.pain) &&
      isOneOf(STOOL_LEVELS, entry.stool) &&
      (entry.urgency === undefined || isOneOf(URGENCY_LEVELS, entry.urgency)) &&
      typeof entry.note === "string"
    );
  }
  return false;
}

function read(storage: BrowserStorage): ReadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return { ok: false };
  }
  if (raw === null) return { ok: true, data: { version: VERSION, entries: [] } };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return { ok: false };
    const { version, entries } = parsed as Record<string, unknown>;
    if (version !== VERSION || !Array.isArray(entries) || !entries.every(isEntry)) return { ok: false };
    return { ok: true, data: { version: VERSION, entries } };
  } catch {
    return { ok: false };
  }
}

export function createEntriesStore(storage: BrowserStorage): EntriesStore {
  return {
    loadEntries() {
      const result = read(storage);
      return result.ok ? result.data.entries : [];
    },
    addEntry(entry) {
      // Read again right before writing, and never overwrite data we can't read.
      const result = read(storage);
      if (!result.ok) return "failed";
      const data: StoredData = { version: VERSION, entries: [...result.data.entries, entry] };
      try {
        storage.setItem(KEY, JSON.stringify(data));
        return "ok";
      } catch {
        return "failed";
      }
    },
  };
}
