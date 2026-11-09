import { describe, expect, it } from "vitest";
import { entriesOfDay, isSameLocalDay } from "./day";
import type { Entry } from "./entry";

function meal(text: string, time: Date): Entry {
  return { id: text, kind: "meal", time: time.toISOString(), text };
}

function symptom(id: string, time: Date): Entry {
  return { id, kind: "event", time: time.toISOString(), pain: "low", stool: "none", note: "" };
}

describe("isSameLocalDay", () => {
  it("separates 23:59 and 00:01 of the next day", () => {
    expect(isSameLocalDay(new Date(2026, 10, 8, 23, 59), new Date(2026, 10, 9, 0, 1))).toBe(false);
    expect(isSameLocalDay(new Date(2026, 10, 9, 0, 1), new Date(2026, 10, 9, 23, 59))).toBe(true);
  });

  it("uses local time on the day the clocks go back", () => {
    // 25.10.2026, 23:30 in Berlin is 22:30 UTC — still the 25th locally.
    expect(isSameLocalDay(new Date(2026, 9, 25, 23, 30), new Date(2026, 9, 25, 1, 0))).toBe(true);
  });
});

describe("entriesOfDay", () => {
  it("returns only that day's entries, latest first", () => {
    const breakfast = meal("Müsli", new Date(2026, 10, 9, 8, 0));
    const lunch = meal("Nudeln", new Date(2026, 10, 9, 12, 30));
    const yesterday = meal("Pizza", new Date(2026, 10, 8, 23, 59));
    const tomorrow = meal("Brot", new Date(2026, 10, 10, 0, 1));

    const result = entriesOfDay([breakfast, yesterday, lunch, tomorrow], new Date(2026, 10, 9, 15, 0));

    expect(result.map((entry) => entry.id)).toEqual(["Nudeln", "Müsli"]);
  });

  it("mixes meals and events by time", () => {
    const entries = [
      meal("Müsli", new Date(2026, 10, 9, 8, 0)),
      symptom("Bauchweh", new Date(2026, 10, 9, 14, 0)),
      meal("Nudeln", new Date(2026, 10, 9, 12, 30)),
      symptom("früh", new Date(2026, 10, 9, 6, 15)),
    ];

    expect(entriesOfDay(entries, new Date(2026, 10, 9)).map((entry) => entry.id)).toEqual([
      "Bauchweh",
      "Nudeln",
      "Müsli",
      "früh",
    ]);
  });

  it("returns an empty list when nothing was entered that day", () => {
    expect(entriesOfDay([], new Date(2026, 10, 9))).toEqual([]);
  });
});
