import { describe, expect, it } from "vitest";
import type { Entry } from "./entry";
import { formatDate } from "./format";
import {
  buildReportDays,
  checkReportRange,
  defaultReportRange,
  eventLine,
  hasReportEntries,
  mealLine,
  reportFileName,
} from "./report";

const today = new Date(2026, 10, 10, 9, 30);

function meal(id: string, time: Date, text = id): Entry {
  return { id, kind: "meal", time: time.toISOString(), text };
}

describe("defaultReportRange", () => {
  it("covers the last 4 weeks up to today", () => {
    expect(defaultReportRange(today)).toEqual({ from: new Date(2026, 9, 13), to: new Date(2026, 10, 10) });
  });
});

describe("checkReportRange", () => {
  it("keeps a valid range", () => {
    expect(checkReportRange(new Date(2026, 10, 1), new Date(2026, 10, 5), today)).toEqual({
      ok: true,
      from: new Date(2026, 10, 1),
      to: new Date(2026, 10, 5),
    });
  });

  it("never ends in the future", () => {
    const result = checkReportRange(new Date(2026, 10, 1), new Date(2026, 10, 20), today);
    expect(result.ok && result.to).toEqual(new Date(2026, 10, 10));
  });

  it("rejects a start after the end", () => {
    expect(checkReportRange(new Date(2026, 10, 6), new Date(2026, 10, 5), today)).toEqual({
      ok: false,
      error: "from-after-to",
    });
  });

  it("allows a single day", () => {
    expect(checkReportRange(new Date(2026, 10, 5), new Date(2026, 10, 5), today).ok).toBe(true);
  });
});

describe("buildReportDays", () => {
  const entries: Entry[] = [
    meal("lunch", new Date(2026, 10, 3, 12, 30)),
    { id: "cramps", kind: "event", time: new Date(2026, 10, 3, 10, 30).toISOString(), pain: "medium", stool: "none", note: "" },
    meal("breakfast", new Date(2026, 10, 3, 8, 0)),
    meal("before", new Date(2026, 10, 1, 23, 59)),
    meal("after", new Date(2026, 10, 5, 0, 1)),
  ];

  it("lists every day of the range, oldest first, including empty days", () => {
    const days = buildReportDays(entries, new Date(2026, 10, 2), new Date(2026, 10, 4));
    expect(days.map((day) => day.day)).toEqual([new Date(2026, 10, 2), new Date(2026, 10, 3), new Date(2026, 10, 4)]);
    expect(days[0]).toEqual({ day: new Date(2026, 10, 2), meals: [], events: [] });
  });

  it("orders each day from morning to evening and splits meals and events", () => {
    const [, day] = buildReportDays(entries, new Date(2026, 10, 2), new Date(2026, 10, 4));
    expect(day?.meals.map((m) => m.id)).toEqual(["breakfast", "lunch"]);
    expect(day?.events.map((e) => e.id)).toEqual(["cramps"]);
  });

  it("leaves out entries outside the range", () => {
    const ids = buildReportDays(entries, new Date(2026, 10, 2), new Date(2026, 10, 4)).flatMap((day) =>
      [...day.meals, ...day.events].map((entry) => entry.id),
    );
    expect(ids).not.toContain("before");
    expect(ids).not.toContain("after");
  });

  it("works across the change to winter time", () => {
    const days = buildReportDays([], new Date(2026, 9, 24), new Date(2026, 9, 26));
    expect(days.map((day) => day.day)).toEqual([new Date(2026, 9, 24), new Date(2026, 9, 25), new Date(2026, 9, 26)]);
  });

  it("knows whether there is anything to show", () => {
    expect(hasReportEntries(buildReportDays(entries, new Date(2026, 10, 2), new Date(2026, 10, 2)))).toBe(false);
    expect(hasReportEntries(buildReportDays(entries, new Date(2026, 10, 3), new Date(2026, 10, 3)))).toBe(true);
  });
});

describe("report texts", () => {
  it("writes meal and event lines", () => {
    expect(mealLine({ id: "a", kind: "meal", time: new Date(2026, 10, 3, 8, 0).toISOString(), text: "Müsli" })).toBe(
      "08:00 Müsli",
    );
    expect(
      eventLine({
        id: "b",
        kind: "event",
        time: new Date(2026, 10, 3, 10, 30).toISOString(),
        pain: "medium",
        stool: "liquid",
        urgency: "strong",
        note: "",
      }),
    ).toBe("10:30 Schmerzen mittel · Stuhlgang flüssig · Dringlichkeit stark");
  });

  it("formats dates and a file name without personal details", () => {
    expect(formatDate(new Date(2026, 9, 12))).toBe("12.10.2026");
    expect(reportFileName(new Date(2026, 9, 12), new Date(2026, 10, 10))).toBe(
      "Ess-und-Beschwerdeprotokoll_2026-10-12_bis_2026-11-10.pdf",
    );
  });
});
