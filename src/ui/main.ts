import "./style.css";
import { addDays, formatDateTime, prefillTime, startOfDay, type Entry } from "../core";
import { createEntriesStore } from "../storage/entries-store";
import { requestPersistentStorage } from "../storage/persistence";
import { setUpDaySwipe } from "./day-swipe";
import { DELETE_FAILED } from "./entry-form";
import { byId } from "./dom";
import { createEventForm } from "./event-form";
import { createIcon } from "./icons";
import { showInstallHintIfNeeded } from "./install-hint";
import { createMealForm } from "./meal-form";
import { createReportPage } from "./report-page";
import { shareReportPdf } from "./report-pdf";
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
  onOpen: (entry) => {
    if (entry.kind === "meal") showSheet("meal", mealSheet, () => mealForm.edit(entry));
    else showSheet("event", eventSheet, () => eventForm.edit(entry));
  },
  // The red button behind a swiped row is the confirmation, so delete right away.
  onDelete: (entry) => {
    start.showMessage(store.deleteEntry(entry.id) === "ok" ? "Gelöscht." : DELETE_FAILED);
    renderDay();
  },
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
function onDeleted(): void {
  pendingMessage = "Gelöscht.";
  requestCloseSheet();
}

const mealForm = createMealForm(store, { onSaved, onDeleted });
const eventForm = createEventForm(store, { onSaved, onDeleted });

const startPage = byId<HTMLElement>("start");
const reportSection = byId<HTMLElement>("report");
const report = createReportPage({
  onBack: () => history.back(),
  onShare: shareReportPdf,
});

/** The report is a page of its own; like the overlays it goes through the history. */
function showReport(): void {
  if (openSheet !== undefined || !reportSection.hidden) return;
  history.pushState({ page: "report" }, "");
  report.open(store.loadEntries(), new Date());
  startPage.hidden = true;
  reportSection.hidden = false;
  window.scrollTo(0, 0);
}

function showStart(): void {
  reportSection.hidden = true;
  startPage.hidden = false;
  openSheet = undefined;
  mealSheet.close();
  eventSheet.close();
  renderDay();
  if (pendingMessage !== undefined) {
    start.showMessage(pendingMessage);
    pendingMessage = undefined;
  }
}

/** Opens an overlay; `fill` puts a new or an existing entry into its form first. */
function showSheet(name: string, sheet: Sheet, fill: () => void): void {
  if (openSheet !== undefined) return;
  openSheet = sheet;
  history.pushState({ sheet: name }, "");
  fill();
  sheet.open();
}

/** On an earlier day, suggest that day at the current time of day, to make filling in quicker. */
function newEntryTime(): Date {
  return prefillTime(shownDay, new Date());
}

const openMeal = byId<HTMLButtonElement>("open-meal");
const openEvent = byId<HTMLButtonElement>("open-event");
// The button has its own label ("… eintragen"), so the icon itself stays silent.
openMeal.prepend(createIcon("meal", "button-icon"));
openEvent.prepend(createIcon("event", "button-icon"));
const openReport = byId<HTMLButtonElement>("open-report");
openReport.append(createIcon("report", "top-icon"));
openReport.addEventListener("click", showReport);
for (const icon of document.querySelectorAll(".button-icon, .top-icon")) icon.setAttribute("aria-hidden", "true");
openMeal.addEventListener("click", () => showSheet("meal", mealSheet, () => mealForm.open(newEntryTime())));
openEvent.addEventListener("click", () => showSheet("event", eventSheet, () => eventForm.open(newEntryTime())));

// The whole screen reacts, also the empty space below a short list.
setUpDaySwipe(
  document,
  // Only on the start page, and never while an overlay is open.
  () => openSheet !== undefined || !reportSection.hidden,
  (direction) => showDay(addDays(shownDay, direction === "previous" ? -1 : 1)),
  // On an entry, sideways swipes show its "Löschen" button instead.
  (target) => target instanceof Element && target.closest(".entries .row") !== null,
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
