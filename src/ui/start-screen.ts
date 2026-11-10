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

/** One row: time, the icon of the kind of entry, then what was entered. */
function renderEntry(entry: Entry): HTMLLIElement {
  const item = document.createElement("li");
  item.append(line("time", formatClock(new Date(entry.time))), createIcon(entry.kind, "kind-icon"));
  const details = document.createElement("span");
  details.className = "details";
  if (entry.kind === "meal") {
    details.append(line("text", entry.text));
  } else {
    details.append(line("summary", describeEvent(entry)));
    if (entry.note !== "") details.append(line("note", entry.note));
  }
  item.append(details);
  return item;
}

export interface DayBarActions {
  onPrevious(): void;
  onNext(): void;
  /** A day was chosen in the date picker. */
  onPick(day: Date): void;
}

export function createStartScreen(actions: DayBarActions): StartScreen {
  const list = byId<HTMLUListElement>("today-list");
  const empty = byId<HTMLParagraphElement>("today-empty");
  const message = byId<HTMLParagraphElement>("start-message");
  const dayName = byId<HTMLElement>("day-name");
  const picker = byId<HTMLInputElement>("day-picker");
  const next = byId<HTMLButtonElement>("day-next");
  let messageTimer: ReturnType<typeof setTimeout> | undefined;

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
      list.replaceChildren(...shown.map(renderEntry));
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
