import type { SymptomEvent } from "./event";
import type { Meal } from "./meal";

/** Anything shown in the list: a meal or a symptom event. */
export type Entry = Meal | SymptomEvent;
