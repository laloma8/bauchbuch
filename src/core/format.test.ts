import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatDateTime,
  formatDayName,
  formatLongDay,
  formatShortDay,
  fromDateInputValue,
  fromDateTimeInputValue,
  toDateInputValue,
  toDateTimeInputValue,
} from "./format";

describe("formatClock", () => {
  it("pads hours and minutes", () => {
    expect(formatClock(new Date(2026, 10, 9, 8, 5))).toBe("08:05");
  });
});

describe("formatDateTime", () => {
  it("shows the local date and time", () => {
    expect(formatDateTime(new Date("2026-11-09T18:30:00Z"))).toBe("09.11.2026 19:30");
    expect(formatDateTime(new Date(2026, 0, 5, 7, 4))).toBe("05.01.2026 07:04");
  });
});

describe("formatShortDay", () => {
  it("shows the short weekday and the date", () => {
    expect(formatShortDay(new Date(2026, 10, 7, 19, 0))).toBe("Sa, 07.11.");
    expect(formatShortDay(new Date(2026, 10, 8, 19, 0))).toBe("So, 08.11.");
  });
});

describe("datetime-local values", () => {
  it("writes local time", () => {
    expect(toDateTimeInputValue(new Date(2026, 10, 9, 12, 30))).toBe("2026-11-09T12:30");
  });

  it("reads local time and drops seconds", () => {
    expect(fromDateTimeInputValue("2026-11-09T12:30")).toEqual(new Date(2026, 10, 9, 12, 30));
    expect(fromDateTimeInputValue("2026-11-09T12:30:45")).toEqual(new Date(2026, 10, 9, 12, 30));
  });

  it("returns undefined for empty or invalid values", () => {
    expect(fromDateTimeInputValue("")).toBeUndefined();
    expect(fromDateTimeInputValue("gestern")).toBeUndefined();
    expect(fromDateTimeInputValue("2026-02-30T12:00")).toBeUndefined();
  });

  it("round-trips the same minute, also on the days the clocks change", () => {
    for (const date of [
      new Date(2026, 10, 9, 12, 30),
      new Date(2026, 9, 25, 12, 0), // clocks go back
      new Date(2026, 2, 29, 12, 0), // clocks go forward
    ]) {
      expect(fromDateTimeInputValue(toDateTimeInputValue(date))).toEqual(date);
    }
  });

  it("uses German time (summer and winter)", () => {
    expect(toDateTimeInputValue(new Date("2026-07-01T10:00:00Z"))).toBe("2026-07-01T12:00");
    expect(toDateTimeInputValue(new Date("2026-11-09T10:00:00Z"))).toBe("2026-11-09T11:00");
  });
});

describe("formatDayName", () => {
  const today = new Date(2026, 10, 9);

  it("names today and yesterday", () => {
    expect(formatDayName(new Date(2026, 10, 9), today)).toBe("Heute");
    expect(formatDayName(new Date(2026, 10, 8), today)).toBe("Gestern");
  });

  it("shows weekday and date for older days, with the year when it differs", () => {
    expect(formatDayName(new Date(2026, 10, 7), today)).toBe("Sa, 07.11.");
    expect(formatDayName(new Date(2025, 11, 26), today)).toBe("Fr, 26.12.2025");
  });

  it("says yesterday across the new year", () => {
    expect(formatDayName(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe("Gestern");
  });
});

describe("date input values", () => {
  it("round-trips a local day", () => {
    expect(toDateInputValue(new Date(2026, 10, 7, 15, 0))).toBe("2026-11-07");
    expect(fromDateInputValue("2026-11-07")).toEqual(new Date(2026, 10, 7));
  });

  it("returns undefined for empty or invalid values", () => {
    expect(fromDateInputValue("")).toBeUndefined();
    expect(fromDateInputValue("2026-02-30")).toBeUndefined();
  });
});

describe("formatLongDay", () => {
  it("adds the year", () => {
    expect(formatLongDay(new Date(2026, 10, 3))).toBe("Di, 03.11.2026");
  });
});
