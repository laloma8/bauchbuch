import {
  buildReportDays,
  checkReportRange,
  defaultReportRange,
  eventLine,
  formatDate,
  formatShortDay,
  fromDateInputValue,
  hasReportEntries,
  mealLine,
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

function cell(lines: HTMLElement[]): HTMLTableCellElement {
  const td = document.createElement("td");
  if (lines.length === 0) td.textContent = "–";
  else td.append(...lines);
  return td;
}

function text(className: string, value: string): HTMLElement {
  const element = document.createElement("div");
  element.className = className;
  element.textContent = value;
  return element;
}

function row(day: ReportDay): HTMLTableRowElement {
  const tr = document.createElement("tr");
  const dayCell = document.createElement("th");
  dayCell.scope = "row";
  dayCell.textContent = formatShortDay(day.day);
  tr.append(
    dayCell,
    cell(day.meals.map((meal) => text("report-line", mealLine(meal)))),
    cell(
      day.events.flatMap((event) => [
        text("report-line", eventLine(event)),
        ...(event.note === "" ? [] : [text("report-note", event.note)]),
      ]),
    ),
  );
  return tr;
}

export function createReportPage(actions: ReportActions): ReportPage {
  const fromInput = byId<HTMLInputElement>("report-from");
  const toInput = byId<HTMLInputElement>("report-to");
  const rangeText = byId<HTMLParagraphElement>("report-range");
  const share = byId<HTMLButtonElement>("report-share");
  const message = byId<HTMLParagraphElement>("report-message");
  const table = byId<HTMLTableElement>("report-table");
  const body = byId<HTMLTableSectionElement>("report-body");
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
      table.hidden = true;
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
    body.replaceChildren(...(anything ? days.map(row) : []));
    table.hidden = !anything;
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
