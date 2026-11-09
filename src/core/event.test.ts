import { describe, expect, it } from "vitest";
import { describeEvent, validateEvent, type EventInput, type SymptomEvent } from "./event";
import { TEXT_MAX } from "./meal";

const now = new Date(2026, 10, 9, 14, 0, 30);
const time = new Date(2026, 10, 9, 14, 0);
const base: EventInput = { time, pain: "none", stool: "none", urgency: "none", note: "" };

function event(fields: Partial<SymptomEvent>): SymptomEvent {
  return { id: "x", kind: "event", time: time.toISOString(), pain: "none", stool: "none", note: "", ...fields };
}

describe("validateEvent", () => {
  it("needs pain or a bowel movement", () => {
    expect(validateEvent(base, now)).toEqual({ ok: false, error: "nothing-set" });
    expect(validateEvent({ ...base, urgency: "strong" }, now)).toEqual({ ok: false, error: "nothing-set" });
    expect(validateEvent({ ...base, pain: "low" }, now).ok).toBe(true);
    expect(validateEvent({ ...base, stool: "normal" }, now).ok).toBe(true);
  });

  it("keeps urgency only together with a bowel movement", () => {
    const withStool = validateEvent({ ...base, stool: "liquid", urgency: "strong" }, now);
    const withoutStool = validateEvent({ ...base, pain: "medium", urgency: "strong" }, now);

    expect(withStool.ok && withStool.event.urgency).toBe("strong");
    expect(withoutStool.ok && "urgency" in withoutStool.event).toBe(false);
  });

  it("stores the levels, the time and the trimmed note", () => {
    const result = validateEvent({ ...base, pain: "high", stool: "soft", urgency: "some", note: " nach dem Kaffee " }, now);

    expect(result).toEqual({
      ok: true,
      event: {
        id: expect.any(String) as string,
        kind: "event",
        time: time.toISOString(),
        pain: "high",
        stool: "soft",
        urgency: "some",
        note: "nach dem Kaffee",
      },
    });
  });

  it("allows 200 characters of note and rejects 201", () => {
    expect(validateEvent({ ...base, pain: "low", note: "a".repeat(TEXT_MAX) }, now).ok).toBe(true);
    expect(validateEvent({ ...base, pain: "low", note: "a".repeat(TEXT_MAX + 1) }, now)).toEqual({
      ok: false,
      error: "too-long",
    });
  });

  it("rejects a time in the future, after checking that something is set", () => {
    const later = new Date(2026, 10, 9, 14, 1);
    expect(validateEvent({ ...base, pain: "low", time: later }, now)).toEqual({ ok: false, error: "future" });
    expect(validateEvent({ ...base, time: later }, now)).toEqual({ ok: false, error: "nothing-set" });
  });
});

describe("describeEvent", () => {
  it("lists pain, stool and urgency", () => {
    expect(describeEvent(event({ pain: "medium", stool: "liquid", urgency: "strong" }))).toBe(
      "Schmerzen mittel · Stuhlgang flüssig · Dringlichkeit stark",
    );
  });

  it("leaves out urgency without a bowel movement", () => {
    expect(describeEvent(event({ pain: "low" }))).toBe("Schmerzen wenig · kein Stuhlgang");
  });

  it("names the zero levels", () => {
    expect(describeEvent(event({ stool: "normal", urgency: "none" }))).toBe(
      "keine Schmerzen · Stuhlgang normal · keine Dringlichkeit",
    );
    expect(describeEvent(event({ pain: "high", stool: "soft", urgency: "some" }))).toBe(
      "Schmerzen stark · Stuhlgang weich · Dringlichkeit etwas",
    );
  });
});
