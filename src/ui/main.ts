import "./style.css";
import { formatDateTime, formatShortDay, isSameLocalDay, type Entry } from "../core";
import { createEntriesStore } from "../storage/entries-store";
import { requestPersistentStorage } from "../storage/persistence";
import { byId } from "./dom";
import { createEventForm } from "./event-form";
import { createIcon } from "./icons";
import { showInstallHintIfNeeded } from "./install-hint";
import { createMealForm } from "./meal-form";
import { createSheet, type Sheet } from "./sheet";
import { createStartScreen } from "./start-screen";

const store = createEntriesStore(window.localStorage);
const start = createStartScreen();
let pendingMessage: string | undefined;
let openSheet: Sheet | undefined;

// Every way of closing an overlay goes through the history, so the phone's
// back button, swiping down and tapping outside behave the same. Only the first
// request counts, otherwise a quick second tap would leave the app.
function requestCloseSheet(): void {
  if (openSheet === undefined) return;
  openSheet = undefined;
  history.back();
}

function onSaved(entry: Entry): void {
  const time = new Date(entry.time);
  pendingMessage = isSameLocalDay(time, new Date()) ? "Gespeichert." : `Gespeichert für ${formatShortDay(time)}`;
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
  start.renderToday(store.loadEntries(), new Date());
  if (pendingMessage !== undefined) {
    start.showMessage(pendingMessage);
    pendingMessage = undefined;
  }
}

function showSheet(name: string, sheet: Sheet, form: { open(now: Date): void }): void {
  if (openSheet !== undefined) return;
  openSheet = sheet;
  history.pushState({ sheet: name }, "");
  form.open(new Date());
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

// The phone's back button and history.back() both land here.
window.addEventListener("popstate", showStart);

// "Heute" must follow the date when the app is reopened, e.g. after midnight.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") start.renderToday(store.loadEntries(), new Date());
});

showInstallHintIfNeeded();
byId<HTMLParagraphElement>("version").textContent = `Version ${formatDateTime(new Date(__BUILD_TIME__))}`;
// Entries only live on this phone, so ask it not to clear them when space runs low.
void requestPersistentStorage(navigator.storage);

// After a reload the app always starts without an open overlay.
if (history.state !== null) history.replaceState(null, "");
showStart();
