import {
  LEVEL_LABELS,
  PAIN_LEVELS,
  STOOL_LEVELS,
  URGENCY_LEVELS,
  fromDateTimeInputValue,
  toDateTimeInputValue,
  validateEvent,
  type EventError,
  type SymptomEvent,
} from "../core";
import type { EntriesStore } from "../storage/entries-store";
import { createDeleteConfirm } from "./delete-confirm";
import { byId } from "./dom";
import { DELETE_FAILED, SAVE_FAILED, type EntryForm, type EntryFormCallbacks } from "./entry-form";
import { setUpGrowingTextarea } from "./grow-textarea";
import { createLevelSlider } from "./level-slider";

const ERROR_TEXT: Record<EventError, string> = {
  "nothing-set": "Bitte stell Schmerzen oder Stuhlgang ein.",
  "too-long": "Bitte höchstens 200 Zeichen.",
  future: "Die Zeit liegt in der Zukunft.",
};

export function createEventForm(
  store: EntriesStore,
  callbacks: EntryFormCallbacks<SymptomEvent>,
): EntryForm<SymptomEvent> {
  const form = byId<HTMLFormElement>("event");
  const title = byId<HTMLElement>("event-title");
  const timeInput = byId<HTMLInputElement>("event-time");
  const noteInput = byId<HTMLTextAreaElement>("event-note");
  const urgencyField = byId<HTMLElement>("event-urgency-field");
  const error = byId<HTMLParagraphElement>("event-error");
  const saveButton = byId<HTMLButtonElement>("event-save");
  const note = setUpGrowingTextarea(noteInput, form);

  const pain = createLevelSlider("event-pain", PAIN_LEVELS, LEVEL_LABELS.pain, () => updateReady());
  const urgency = createLevelSlider("event-urgency", URGENCY_LEVELS, LEVEL_LABELS.urgency);
  // Urgency only makes sense together with a bowel movement.
  const stool = createLevelSlider("event-stool", STOOL_LEVELS, LEVEL_LABELS.stool, (value) => {
    urgencyField.hidden = value === "none";
    if (value === "none") urgency.reset();
    updateReady();
  });

  /** The event being changed; undefined while adding a new one. */
  let editing: SymptomEvent | undefined;
  // Guards against a double tap saving or deleting twice.
  let done = false;

  const deleteConfirm = createDeleteConfirm("event", () => {
    if (done || editing === undefined) return;
    if (store.deleteEntry(editing.id) === "failed") {
      error.textContent = DELETE_FAILED;
      return;
    }
    done = true;
    callbacks.onDeleted();
  });

  function check(now: Date): ReturnType<typeof validateEvent> {
    // An emptied time field means "now".
    const time = fromDateTimeInputValue(timeInput.value) ?? now;
    return validateEvent(
      { time, pain: pain.value, stool: stool.value, urgency: urgency.value, note: noteInput.value },
      now,
    );
  }

  /** "Speichern" stands out once the event could be saved; it stays tappable to explain what's missing. */
  function updateReady(): void {
    saveButton.classList.toggle("ready", check(new Date()).ok);
  }

  noteInput.addEventListener("input", updateReady);
  timeInput.addEventListener("input", updateReady);
  timeInput.addEventListener("change", updateReady);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (done) return;
    const result = check(new Date());
    if (!result.ok) {
      error.textContent = ERROR_TEXT[result.error];
      return;
    }
    // A changed event keeps its id, so it replaces the old one.
    const saved = editing === undefined ? result.event : { ...result.event, id: editing.id };
    const outcome = editing === undefined ? store.addEntry(saved) : store.updateEntry(saved);
    if (outcome === "failed") {
      error.textContent = SAVE_FAILED;
      return;
    }
    done = true;
    callbacks.onSaved(saved);
  });

  function fill(event: SymptomEvent | undefined, time: Date): void {
    editing = event;
    done = false;
    title.textContent = event === undefined ? "Ereignis" : "Ereignis ändern";
    timeInput.value = toDateTimeInputValue(time);
    timeInput.max = toDateTimeInputValue(new Date());
    pain.set(event?.pain ?? "none");
    stool.set(event?.stool ?? "none");
    urgency.set(event?.urgency ?? "none");
    urgencyField.hidden = (event?.stool ?? "none") === "none";
    noteInput.value = event?.note ?? "";
    note.reset();
    error.textContent = "";
    deleteConfirm.show(event !== undefined);
    updateReady();
  }

  return {
    open(prefill) {
      fill(undefined, prefill);
    },
    edit(event) {
      fill(event, new Date(event.time));
      // Let the note field fit a long note right away.
      noteInput.dispatchEvent(new Event("input"));
    },
  };
}
