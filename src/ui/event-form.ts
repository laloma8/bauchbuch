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
import { byId } from "./dom";
import { setUpGrowingTextarea } from "./grow-textarea";
import { createLevelSlider } from "./level-slider";

const ERROR_TEXT: Record<EventError | "failed", string> = {
  "nothing-set": "Bitte stell Schmerzen oder Stuhlgang ein.",
  "too-long": "Bitte höchstens 200 Zeichen.",
  future: "Die Zeit liegt in der Zukunft.",
  failed: "Speichern hat nicht geklappt. Bitte versuch es noch einmal.",
};

export interface EventForm {
  /** Resets the form: time = now, all sliders at zero, urgency hidden, empty note. */
  open(now: Date): void;
}

export function createEventForm(store: EntriesStore, onSaved: (event: SymptomEvent) => void): EventForm {
  const form = byId<HTMLFormElement>("event");
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

  // Guards against a double tap on "Speichern" saving the event twice.
  let saved = false;

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
    if (saved) return;
    const result = check(new Date());
    if (!result.ok) {
      error.textContent = ERROR_TEXT[result.error];
      return;
    }
    if (store.addEntry(result.event) === "failed") {
      error.textContent = ERROR_TEXT.failed;
      return;
    }
    saved = true;
    onSaved(result.event);
  });

  return {
    open(now) {
      saved = false;
      timeInput.value = toDateTimeInputValue(now);
      timeInput.max = toDateTimeInputValue(now);
      pain.reset();
      stool.reset();
      urgency.reset();
      urgencyField.hidden = true;
      noteInput.value = "";
      note.reset();
      error.textContent = "";
      updateReady();
    },
  };
}
