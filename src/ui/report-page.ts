import {
  buildReportDays,
  checkReportRange,
  defaultReportRange,
  formatDate,
  formatLongDay,
  fromDateInputValue,
  hasReportEntries,
  reportLine,
  toDateInputValue,
  type Entry,
  type ReportDay,
  type ReportRange,
} from "../core";
import { byId } from "./dom";

export interface ReportPage {
  /** Shows the last 4 weeks of `entries`. */
  open(entries: readonly Entry[], today: Date): void;
}

export interface ReportActions {
  onBack(): void;
  /** Builds the PDF and hands it on; resolves once that is done or cancelled. */
  onShare(days: ReportDay[], range: ReportRange): Promise<void>;
}

const WRONG_ORDER = "Bitte wähle ein Von-Datum vor dem Bis-Datum.";
const SHARE_FAILED = "Das PDF konnte nicht erstellt werden. Bitte versuch es noch einmal.";

function text(tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

/** A day heading with its entries from morning to evening, like a diary page. */
function dayBlock(day: ReportDay): HTMLElement {
  const block = document.createElement("section");
  block.className = "report-day";
  block.append(text("h2", "report-day-name", formatLongDay(day.day)));
  if (day.entries.length === 0) {
    block.append(text("p", "report-none", "keine Einträge"));
    return block;
  }
  const list = document.createElement("ul");
  list.className = "report-lines";
  for (const entry of day.entries) {
    const line = reportLine(entry);
    const item = document.createElement("li");
    const content = document.createElement("div");
    content.append(text("div", "report-text", line.text));
    if (line.note !== undefined) content.append(text("div", "report-note", line.note));
    item.append(text("span", "report-time", line.time), text("span", "report-kind", line.kind), content);
    list.append(item);
  }
  block.append(list);
  return block;
}

export function createReportPage(actions: ReportActions): ReportPage {
  const fromInput = byId<HTMLInputElement>("report-from");
  const toInput = byId<HTMLInputElement>("report-to");
  const rangeText = byId<HTMLParagraphElement>("report-range");
  const share = byId<HTMLButtonElement>("report-share");
  const message = byId<HTMLParagraphElement>("report-message");
  const list = byId<HTMLElement>("report-list");
  const empty = byId<HTMLParagraphElement>("report-empty");

  let entries: readonly Entry[] = [];
  let today = new Date();
  let current: { days: ReportDay[]; range: ReportRange } | undefined;
  let sharing = false;

  function setShareable(yes: boolean): void {
    share.disabled = !yes;
    share.classList.toggle("ready", yes);
  }

  function render(): void {
    const from = fromDateInputValue(fromInput.value);
    const to = fromDateInputValue(toInput.value);
    const fallback = defaultReportRange(today);
    const result = checkReportRange(from ?? fallback.from, to ?? fallback.to, today);
    current = undefined;
    message.textContent = "";
    if (!result.ok) {
      rangeText.textContent = "";
      message.textContent = WRONG_ORDER;
      list.hidden = true;
      empty.hidden = true;
      setShareable(false);
      return;
    }
    // Show what is actually used, e.g. "Bis" set back to today.
    fromInput.value = toDateInputValue(result.from);
    toInput.value = toDateInputValue(result.to);
    rangeText.textContent = `${formatDate(result.from)} – ${formatDate(result.to)}`;
    const days = buildReportDays(entries, result.from, result.to);
    const anything = hasReportEntries(days);
    list.replaceChildren(...(anything ? days.map(dayBlock) : []));
    list.hidden = !anything;
    empty.hidden = anything;
    setShareable(anything);
    if (anything) current = { days, range: { from: result.from, to: result.to } };
  }

  for (const input of [fromInput, toInput]) {
    // iOS reports the choice with "change" when the picker closes, other browsers with "input".
    input.addEventListener("change", render);
    input.addEventListener("input", render);
  }

  byId<HTMLButtonElement>("report-back").addEventListener("click", () => actions.onBack());

  share.addEventListener("click", () => {
    if (current === undefined || sharing) return;
    sharing = true;
    message.textContent = "PDF wird erstellt …";
    actions
      .onShare(current.days, current.range)
      .then(() => {
        message.textContent = "";
      })
      .catch(() => {
        message.textContent = SHARE_FAILED;
      })
      .finally(() => {
        sharing = false;
      });
  });

  return {
    open(newEntries, newToday) {
      entries = newEntries;
      today = newToday;
      const range = defaultReportRange(today);
      fromInput.max = toDateInputValue(today);
      toInput.max = toDateInputValue(today);
      fromInput.value = toDateInputValue(range.from);
      toInput.value = toDateInputValue(range.to);
      render();
    },
  };
}
