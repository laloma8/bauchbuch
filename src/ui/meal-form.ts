import { fromDateTimeInputValue, toDateTimeInputValue, validateMeal, type Meal, type MealError } from "../core";
import type { EntriesStore } from "../storage/entries-store";
import { createDeleteConfirm } from "./delete-confirm";
import { byId } from "./dom";
import { DELETE_FAILED, SAVE_FAILED, type EntryForm, type EntryFormCallbacks } from "./entry-form";
import { setUpGrowingTextarea } from "./grow-textarea";

const ERROR_TEXT: Record<MealError, string> = {
  "empty-text": "Bitte gib ein, was du gegessen hast.",
  "too-long": "Bitte höchstens 200 Zeichen.",
  future: "Die Zeit liegt in der Zukunft.",
};

export function createMealForm(store: EntriesStore, callbacks: EntryFormCallbacks<Meal>): EntryForm<Meal> {
  const form = byId<HTMLFormElement>("meal");
  const title = byId<HTMLElement>("meal-title");
  const timeInput = byId<HTMLInputElement>("meal-time");
  const textInput = byId<HTMLTextAreaElement>("meal-text");
  const error = byId<HTMLParagraphElement>("meal-error");
  const saveButton = byId<HTMLButtonElement>("meal-save");
  const text = setUpGrowingTextarea(textInput, form);
  /** The meal being changed; undefined while adding a new one. */
  let editing: Meal | undefined;
  // Guards against a double tap saving or deleting twice.
  let done = false;

  const deleteConfirm = createDeleteConfirm("meal", () => {
    if (done || editing === undefined) return;
    if (store.deleteEntry(editing.id) === "failed") {
      error.textContent = DELETE_FAILED;
      return;
    }
    done = true;
    callbacks.onDeleted();
  });

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
    if (done) return;
    const result = check(new Date());
    if (!result.ok) {
      error.textContent = ERROR_TEXT[result.error];
      return;
    }
    // A changed meal keeps its id, so it replaces the old one.
    const meal = editing === undefined ? result.meal : { ...result.meal, id: editing.id };
    const outcome = editing === undefined ? store.addEntry(meal) : store.updateEntry(meal);
    if (outcome === "failed") {
      error.textContent = SAVE_FAILED;
      return;
    }
    done = true;
    callbacks.onSaved(meal);
  });

  function fill(meal: Meal | undefined, time: Date): void {
    editing = meal;
    done = false;
    title.textContent = meal === undefined ? "Mahlzeit" : "Mahlzeit ändern";
    timeInput.value = toDateTimeInputValue(time);
    timeInput.max = toDateTimeInputValue(new Date());
    textInput.value = meal?.text ?? "";
    text.reset();
    error.textContent = "";
    deleteConfirm.show(meal !== undefined);
    updateReady();
  }

  return {
    open(prefill) {
      fill(undefined, prefill);
    },
    edit(meal) {
      fill(meal, new Date(meal.time));
      // Let the field fit a long text right away.
      textInput.dispatchEvent(new Event("input"));
    },
  };
}
