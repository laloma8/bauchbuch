import { fromDateTimeInputValue, toDateTimeInputValue, validateMeal, type Meal, type MealError } from "../core";
import type { EntriesStore } from "../storage/entries-store";
import { byId } from "./dom";
import { setUpGrowingTextarea } from "./grow-textarea";

const ERROR_TEXT: Record<MealError | "failed", string> = {
  "empty-text": "Bitte gib ein, was du gegessen hast.",
  "too-long": "Bitte höchstens 200 Zeichen.",
  future: "Die Zeit liegt in der Zukunft.",
  failed: "Speichern hat nicht geklappt. Bitte versuch es noch einmal.",
};

export interface MealForm {
  /** Resets the form: time = now, empty text, no error. */
  open(now: Date): void;
}

export function createMealForm(store: EntriesStore, onSaved: (meal: Meal) => void): MealForm {
  const form = byId<HTMLFormElement>("meal");
  const timeInput = byId<HTMLInputElement>("meal-time");
  const textInput = byId<HTMLTextAreaElement>("meal-text");
  const error = byId<HTMLParagraphElement>("meal-error");
  const saveButton = byId<HTMLButtonElement>("meal-save");
  const text = setUpGrowingTextarea(textInput, form);
  // Guards against a double tap on "Speichern" saving the meal twice.
  let saved = false;

  function check(now: Date): ReturnType<typeof validateMeal> {
    // An emptied time field means "now".
    const time = fromDateTimeInputValue(timeInput.value) ?? now;
    return validateMeal({ time, text: textInput.value }, now);
  }

  /** "Speichern" stands out once the meal could be saved; it stays tappable to explain what's missing. */
  function updateReady(): void {
    saveButton.classList.toggle("ready", check(new Date()).ok);
  }

  textInput.addEventListener("input", updateReady);
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
    if (store.addEntry(result.meal) === "failed") {
      error.textContent = ERROR_TEXT.failed;
      return;
    }
    saved = true;
    onSaved(result.meal);
  });

  return {
    open(now) {
      saved = false;
      timeInput.value = toDateTimeInputValue(now);
      timeInput.max = toDateTimeInputValue(now);
      textInput.value = "";
      text.reset();
      error.textContent = "";
      updateReady();
    },
  };
}
