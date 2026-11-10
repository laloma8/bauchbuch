import {
  describeEvent,
  entriesOfDay,
  formatClock,
  formatDayName,
  fromDateInputValue,
  isSameLocalDay,
  toDateInputValue,
  type Entry,
} from "../core";
import { byId } from "./dom";
import { createIcon } from "./icons";
import { setUpRowSwipe } from "./row-swipe";

const MESSAGE_MS = 3000;

export interface StartScreen {
  /** Shows the meals and events of `day`, latest first, and the day bar above them. */
  render(entries: readonly Entry[], day: Date, today: Date): void;
  /** Shows a short note that fades after a few seconds. */
  showMessage(text: string): void;
}

function line(className: string, text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = className;
  element.textContent = text;
  return element;
}

/**
 * One row: time, the icon of the kind of entry, then what was entered. The content lies on top of a
 * red "Löschen" button that shows when the row is swiped to the left (see row-swipe.ts).
 */
function renderEntry(entry: Entry): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "row";
  item.dataset.id = entry.id;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "row-delete";
  remove.textContent = "Löschen";
  remove.tabIndex = -1;

  const content = document.createElement("div");
  content.className = "row-content";
  content.setAttribute("role", "button");
  content.tabIndex = 0;
  content.append(line("time", formatClock(new Date(entry.time))), createIcon(entry.kind, "kind-icon"));
  const details = document.createElement("span");
  details.className = "details";
  if (entry.kind === "meal") {
    details.append(line("text", entry.text));
  } else {
    details.append(line("summary", describeEvent(entry)));
    if (entry.note !== "") details.append(line("note", entry.note));
  }
  content.append(details);

  item.append(remove, content);
  return item;
}

export interface StartActions {
  onPrevious(): void;
  onNext(): void;
  /** A day was chosen in the date picker. */
  onPick(day: Date): void;
  /** An entry was tapped, to change it. */
  onOpen(entry: Entry): void;
  /** The red "Löschen" button behind a swiped entry was tapped. */
  onDelete(entry: Entry): void;
}

export function createStartScreen(actions: StartActions): StartScreen {
  const list = byId<HTMLUListElement>("today-list");
  const empty = byId<HTMLParagraphElement>("today-empty");
  const message = byId<HTMLParagraphElement>("start-message");
  const dayName = byId<HTMLElement>("day-name");
  const picker = byId<HTMLInputElement>("day-picker");
  const next = byId<HTMLButtonElement>("day-next");
  let messageTimer: ReturnType<typeof setTimeout> | undefined;
  let entriesById = new Map<string, Entry>();

  /** The entry of the row an event happened in. */
  function entryOf(target: EventTarget | null): Entry | undefined {
    const row = target instanceof Element ? target.closest<HTMLElement>(".row") : null;
    return row?.dataset.id === undefined ? undefined : entriesById.get(row.dataset.id);
  }

  const rowSwipe = setUpRowSwipe(list);

  // One listener for all rows; the rows are rebuilt on every render.
  list.addEventListener("click", (event) => {
    const entry = entryOf(event.target);
    if (entry === undefined) return;
    if (event.target instanceof Element && event.target.closest(".row-delete")) actions.onDelete(entry);
    else actions.onOpen(entry);
  });

  byId<HTMLButtonElement>("day-prev").addEventListener("click", () => actions.onPrevious());
  next.addEventListener("click", () => actions.onNext());
  // iOS reports the choice with "change" when the picker closes, other browsers with "input".
  const pick = () => {
    const day = fromDateInputValue(picker.value);
    if (day !== undefined) actions.onPick(day);
  };
  picker.addEventListener("change", pick);
  picker.addEventListener("input", pick);

  return {
    render(entries, day, today) {
      const isToday = isSameLocalDay(day, today);
      dayName.textContent = formatDayName(day, today);
      next.disabled = isToday;
      picker.max = toDateInputValue(today);
      picker.value = toDateInputValue(day);
      const shown = entriesOfDay(entries, day);
      rowSwipe.reset();
      list.replaceChildren(...shown.map(renderEntry));
      entriesById = new Map(shown.map((entry) => [entry.id, entry]));
      empty.textContent = isToday ? "Heute noch keine Einträge." : "Keine Einträge an diesem Tag.";
      empty.hidden = shown.length > 0;
    },

    showMessage(text) {
      clearTimeout(messageTimer);
      message.textContent = text;
      messageTimer = setTimeout(() => {
        message.textContent = "";
      }, MESSAGE_MS);
    },
  };
}
