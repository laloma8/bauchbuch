import { TEXT_MAX, createId } from "./meal";

export const PAIN_LEVELS = ["none", "low", "medium", "high"] as const;
export const STOOL_LEVELS = ["none", "normal", "soft", "liquid"] as const;
export const URGENCY_LEVELS = ["none", "some", "strong"] as const;

export type PainLevel = (typeof PAIN_LEVELS)[number];
export type StoolLevel = (typeof STOOL_LEVELS)[number];
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

/** Labels under the sliders, in the order of the levels. */
export const LEVEL_LABELS = {
  pain: ["keine", "wenig", "mittel", "stark"],
  stool: ["keiner", "normal", "weich", "flüssig"],
  urgency: ["keine", "etwas", "stark"],
} as const;

export interface SymptomEvent {
  id: string;
  kind: "event";
  /** Point in time as an ISO string (UTC). */
  time: string;
  pain: PainLevel;
  stool: StoolLevel;
  /** Only present when there was a bowel movement. */
  urgency?: UrgencyLevel;
  note: string;
}

export type EventError = "nothing-set" | "too-long" | "future";

export type EventResult = { ok: true; event: SymptomEvent } | { ok: false; error: EventError };

export interface EventInput {
  time: Date;
  pain: PainLevel;
  stool: StoolLevel;
  urgency: UrgencyLevel;
  note: string;
}

/**
 * Checks the form input and turns it into an event. Pain or a bowel movement must be set;
 * urgency only counts together with a bowel movement.
 */
export function validateEvent(input: EventInput, now: Date, random: () => number = Math.random): EventResult {
  if (input.pain === "none" && input.stool === "none") return { ok: false, error: "nothing-set" };
  const note = input.note.trim();
  if (note.length > TEXT_MAX) return { ok: false, error: "too-long" };
  if (input.time.getTime() > now.getTime()) return { ok: false, error: "future" };
  const event: SymptomEvent = {
    id: createId(now, random),
    kind: "event",
    time: input.time.toISOString(),
    pain: input.pain,
    stool: input.stool,
    note,
  };
  if (input.stool !== "none") event.urgency = input.urgency;
  return { ok: true, event };
}

function levelText<T extends string>(levels: readonly T[], labels: readonly string[], level: T): string {
  return labels[levels.indexOf(level)] ?? level;
}

/** The line shown under "Ereignis", e.g. "Schmerzen mittel · Stuhlgang flüssig · Dringlichkeit stark". */
export function describeEvent(event: SymptomEvent): string {
  const parts = [
    event.pain === "none"
      ? "keine Schmerzen"
      : `Schmerzen ${levelText(PAIN_LEVELS, LEVEL_LABELS.pain, event.pain)}`,
    event.stool === "none"
      ? "kein Stuhlgang"
      : `Stuhlgang ${levelText(STOOL_LEVELS, LEVEL_LABELS.stool, event.stool)}`,
  ];
  if (event.stool !== "none" && event.urgency !== undefined) {
    parts.push(
      event.urgency === "none"
        ? "keine Dringlichkeit"
        : `Dringlichkeit ${levelText(URGENCY_LEVELS, LEVEL_LABELS.urgency, event.urgency)}`,
    );
  }
  return parts.join(" · ");
}
