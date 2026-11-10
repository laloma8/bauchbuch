/** How far a finger has to move sideways before it counts as a swipe to another day. */
const MIN_DISTANCE_PX = 60;
/** The move must be clearly sideways, so scrolling a long list never changes the day. */
const MIN_SIDEWAYS_RATIO = 1.5;

export type SwipeDirection = "previous" | "next";

/**
 * Swiping right shows the day before, swiping left the day after – like turning pages.
 * Listeners are passive, so normal scrolling is never held up.
 */
export function setUpDaySwipe(
  element: Pick<Document, "addEventListener">,
  isBlocked: () => boolean,
  onSwipe: (direction: SwipeDirection) => void,
  /** Touches that start here never change the day (e.g. entries, which swipe to delete). */
  ignore: (target: EventTarget | null) => boolean = () => false,
): void {
  let start: { x: number; y: number } | undefined;

  element.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      start =
        event.touches.length === 1 && touch !== undefined && !ignore(event.target)
          ? { x: touch.clientX, y: touch.clientY }
          : undefined;
    },
    { passive: true },
  );

  element.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      if (start === undefined || touch === undefined || isBlocked()) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = undefined;
      if (Math.abs(dx) < MIN_DISTANCE_PX || Math.abs(dx) < MIN_SIDEWAYS_RATIO * Math.abs(dy)) return;
      onSwipe(dx > 0 ? "previous" : "next");
    },
    { passive: true },
  );

  element.addEventListener("touchcancel", () => {
    start = undefined;
  });
}
