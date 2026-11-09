import { byId } from "./dom";

export interface LevelSlider<T extends string> {
  readonly value: T;
  /** Back to the lowest level. */
  reset(): void;
}

/**
 * A slider that snaps to fixed levels, with a tappable label under each level.
 * The labels are buttons because iOS doesn't move the thumb when the track is tapped.
 */
export function createLevelSlider<T extends string>(
  containerId: string,
  levels: readonly T[],
  labels: readonly string[],
  onChange: (value: T) => void = () => {},
): LevelSlider<T> {
  const container = byId<HTMLElement>(containerId);
  const input = document.createElement("input");
  input.type = "range";
  input.id = `${containerId}-input`;
  input.min = "0";
  input.max = String(levels.length - 1);
  input.step = "1";

  const labelRow = document.createElement("div");
  labelRow.className = "level-labels";
  const buttons = labels.map((label, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    // Each label sits under its stop on the track.
    const position = (index / (levels.length - 1)) * 100;
    button.style.left = `${position}%`;
    button.dataset.edge = index === 0 ? "start" : index === levels.length - 1 ? "end" : "middle";
    button.addEventListener("click", () => select(index));
    return button;
  });
  labelRow.append(...buttons);
  container.append(input, labelRow);

  let index = 0;

  function show(): void {
    input.value = String(index);
    input.setAttribute("aria-valuetext", labels[index] ?? "");
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  }

  function select(next: number): void {
    if (next === index) return;
    index = next;
    show();
    onChange(levels[index] as T);
  }

  // "input" fires while dragging; "change" would only come when letting go.
  input.addEventListener("input", () => select(Number(input.value)));
  show();

  return {
    get value() {
      return levels[index] as T;
    },
    reset() {
      index = 0;
      show();
    },
  };
}
