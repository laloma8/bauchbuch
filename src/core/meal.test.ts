import { describe, expect, it } from "vitest";
import { TEXT_MAX, createId, validateMeal } from "./meal";

const now = new Date(2026, 10, 9, 12, 30, 40);
const sameMinute = new Date(2026, 10, 9, 12, 30);

describe("validateMeal", () => {
  it("accepts a meal and trims the text", () => {
    const result = validateMeal({ time: sameMinute, text: "  Nudeln mit Pesto " }, now, () => 0.5);
    expect(result).toEqual({
      ok: true,
      meal: { id: expect.any(String) as string, kind: "meal", time: sameMinute.toISOString(), text: "Nudeln mit Pesto" },
    });
  });

  it("rejects an empty text or only spaces", () => {
    expect(validateMeal({ time: sameMinute, text: "" }, now)).toEqual({ ok: false, error: "empty-text" });
    expect(validateMeal({ time: sameMinute, text: "   " }, now)).toEqual({ ok: false, error: "empty-text" });
  });

  it("allows 200 characters and rejects 201", () => {
    expect(validateMeal({ time: sameMinute, text: "a".repeat(TEXT_MAX) }, now).ok).toBe(true);
    expect(validateMeal({ time: sameMinute, text: "a".repeat(TEXT_MAX + 1) }, now)).toEqual({
      ok: false,
      error: "too-long",
    });
  });

  it("rejects a time in the future", () => {
    const nextMinute = new Date(2026, 10, 9, 12, 31);
    expect(validateMeal({ time: nextMinute, text: "Müsli" }, now)).toEqual({ ok: false, error: "future" });
  });

  it("checks the text before the time", () => {
    const nextMinute = new Date(2026, 10, 9, 12, 31);
    expect(validateMeal({ time: nextMinute, text: "" }, now)).toEqual({ ok: false, error: "empty-text" });
  });
});

describe("createId", () => {
  it("gives different ids for different random values", () => {
    expect(createId(now, () => 0.1)).not.toBe(createId(now, () => 0.2));
  });
});
