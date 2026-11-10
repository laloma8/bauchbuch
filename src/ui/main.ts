import "./style.css";
import { addDays, formatDateTime, prefillTime, startOfDay, type Entry } from "../core";
import { createEntriesStore } from "../storage/entries-store";
import { requestPersistentStorage } from "../storage/persistence";
import { setUpDaySwipe } from "./day-swipe";
import { byId } from "./dom";
import { createEventForm } from "./event-form";
import { createIcon } from "./icons";
import { showInstallHintIfNeeded } from "./install-hint";
import { createMealForm } from "./meal-form";
import { createSheet, type Sheet } from "./sheet";
import { createStartScreen } from "./start-screen";

const store = createEntriesStore(window.localStorage);
let pendingMessage: string | undefined;
let openSheet: Sheet | undefined;
/** The day shown under the buttons (local midnight); never later than today. */
let shownDay = startOfDay(new Date());

function today(): Date {
  return startOfDay(new Date());
}

function renderDay(): void {
  start.render(store.loadEntries(), shownDay, today());
}

function showDay(day: Date): void {
  const latest = today();
  // The date picker's limit isn't always honoured on iOS, so cap it here too.
  shownDay = day.getTime() > latest.getTime() ? latest : startOfDay(day);
  renderDay();
}

const start = createStartScreen({
  onPrevious: () => showDay(addDays(shownDay, -1)),
  onNext: () => showDay(addDays(shownDay, 1)),
  onPick: showDay,
});

// Every way of closing an overlay goes through the history, so the phone's
// back button, swiping down and tapping outside behave the same. Only the first
// request counts, otherwise a quick second tap would leave the app.
function requestCloseSheet(): void {
  if (openSheet === undefined) return;
  openSheet = undefined;
  history.back();
}

function onSaved(entry: Entry): void {
  // Show the day the entry belongs to, so you see it right away.
  shownDay = startOfDay(new Date(entry.time));
  pendingMessage = "Gespeichert.";
  requestCloseSheet();
}

const mealSheet = createSheet("meal", requestCloseSheet);
const eventSheet = createSheet("event", requestCloseSheet);
const mealForm = createMealForm(store, onSaved);
const eventForm = createEventForm(store, onSaved);

function showStart(): void {
  openSheet = undefined;
  mealSheet.close();
  eventSheet.close();
  renderDay();
  if (pendingMessage !== undefined) {
    start.showMessage(pendingMessage);
    pendingMessage = undefined;
  }
}

function showSheet(name: string, sheet: Sheet, form: { open(prefill: Date): void }): void {
  if (openSheet !== undefined) return;
  openSheet = sheet;
  history.pushState({ sheet: name }, "");
  // On an earlier day, suggest that day at the current time of day, to make filling in quicker.
  form.open(prefillTime(shownDay, new Date()));
  sheet.open();
}

const openMeal = byId<HTMLButtonElement>("open-meal");
const openEvent = byId<HTMLButtonElement>("open-event");
// The button has its own label ("… eintragen"), so the icon itself stays silent.
openMeal.prepend(createIcon("meal", "button-icon"));
openEvent.prepend(createIcon("event", "button-icon"));
for (const icon of document.querySelectorAll(".button-icon")) icon.setAttribute("aria-hidden", "true");
openMeal.addEventListener("click", () => showSheet("meal", mealSheet, mealForm));
openEvent.addEventListener("click", () => showSheet("event", eventSheet, eventForm));

setUpDaySwipe(
  byId<HTMLElement>("start"),
  () => openSheet !== undefined,
  (direction) => showDay(addDays(shownDay, direction === "previous" ? -1 : 1)),
);

// The phone's back button and history.back() both land here.
window.addEventListener("popstate", showStart);

// Reopening the app always shows today – also when the date changed overnight.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") showDay(today());
});

showInstallHintIfNeeded();
byId<HTMLParagraphElement>("version").textContent = `Version ${formatDateTime(new Date(__BUILD_TIME__))}`;
// Entries only live on this phone, so ask it not to clear them when space runs low.
void requestPersistentStorage(navigator.storage);

// After a reload the app always starts without an open overlay.
if (history.state !== null) history.replaceState(null, "");
showStart();
