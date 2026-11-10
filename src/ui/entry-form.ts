import type { Entry } from "../core";

/** What the meal and event overlays report back to main.ts. */
export interface EntryFormCallbacks<T extends Entry> {
  onSaved(entry: T): void;
  onDeleted(): void;
}

/** Shared by both overlays. */
export interface EntryForm<T extends Entry> {
  /** New entry: time = `prefill`, everything else empty. */
  open(prefill: Date): void;
  /** Existing entry: all fields filled in, title "… ändern", "Löschen" shown. */
  edit(entry: T): void;
}

export const SAVE_FAILED = "Speichern hat nicht geklappt. Bitte versuch es noch einmal.";
export const DELETE_FAILED = "Löschen hat nicht geklappt. Bitte versuch es noch einmal.";
