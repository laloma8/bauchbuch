/** Longest meal text or note, in characters. */
export const TEXT_MAX = 200;

export interface Meal {
  id: string;
  kind: "meal";
  /** Point in time as an ISO string (UTC). */
  time: string;
  text: string;
}

export type MealError = "empty-text" | "too-long" | "future";

export type MealResult = { ok: true; meal: Meal } | { ok: false; error: MealError };

/**
 * Builds an id from the time and a random part. Not crypto.randomUUID():
 * that only exists on https, and the phone opens the app over plain http while testing.
 */
export function createId(now: Date, random: () => number): string {
  const randomPart = Math.floor(random() * 36 ** 8)
    .toString(36)
    .padStart(8, "0");
  return `${now.getTime().toString(36)}-${randomPart}`;
}

/** Checks the form input and turns it into a meal. A time later than `now` is rejected. */
export function validateMeal(
  input: { time: Date; text: string },
  now: Date,
  random: () => number = Math.random,
): MealResult {
  const text = input.text.trim();
  if (text === "") return { ok: false, error: "empty-text" };
  if (text.length > TEXT_MAX) return { ok: false, error: "too-long" };
  if (input.time.getTime() > now.getTime()) return { ok: false, error: "future" };
  return {
    ok: true,
    meal: { id: createId(now, random), kind: "meal", time: input.time.toISOString(), text },
  };
}
