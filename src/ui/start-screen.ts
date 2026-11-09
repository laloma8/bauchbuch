import { describeEvent, entriesOfDay, formatClock, type Entry } from "../core";
import { byId } from "./dom";
import { createIcon } from "./icons";

const MESSAGE_MS = 3000;

export interface StartScreen {
  /** Shows today's meals and events, latest first. */
  renderToday(entries: readonly Entry[], now: Date): void;
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

export function createStartScreen(): StartScreen {
  const list = byId<HTMLUListElement>("today-list");
  const empty = byId<HTMLParagraphElement>("today-empty");
  const message = byId<HTMLParagraphElement>("start-message");
  let messageTimer: ReturnType<typeof setTimeout> | undefined;

  return {
    renderToday(entries, now) {
      const today = entriesOfDay(entries, now);
      list.replaceChildren(...today.map(renderEntry));
      empty.hidden = today.length > 0;
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
