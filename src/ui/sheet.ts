import { byId } from "./dom";

/** How far the overlay must be pulled down before letting go closes it. */
const CLOSE_DISTANCE_PX = 80;
/** Movement before a touch counts as a swipe, so taps into fields still work. */
const DRAG_START_PX = 10;
/** Matches the transition in style.css. */
const ANIMATION_MS = 250;

export interface Sheet {
  open(): void;
  close(): void;
}

/**
 * An overlay that slides up from the bottom. Swiping down anywhere on it (while
 * its content is scrolled to the top) or tapping the dimmed backdrop calls
 * `onDismiss`; the caller decides how to close.
 */
export function createSheet(prefix: string, onDismiss: () => void): Sheet {
  const layer = byId<HTMLElement>(`${prefix}-sheet`);
  const panel = byId<HTMLElement>(`${prefix}-panel`);
  const backdrop = byId<HTMLElement>(`${prefix}-backdrop`);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let tracking = false;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let dragDistance = 0;

  backdrop.addEventListener("click", onDismiss);

  // Touch events instead of pointer events: only they let us take over a
  // downward swipe while still leaving taps, sideways moves and scrolling alone.
  panel.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      // Dragging a slider must never close the overlay, even when moving down a bit.
      const onSlider = event.target instanceof Element && event.target.closest(".level-slider") !== null;
      tracking = event.touches.length === 1 && touch !== undefined && panel.scrollTop <= 0 && !onSlider;
      dragging = false;
      dragDistance = 0;
      if (touch) {
        startX = touch.clientX;
        startY = touch.clientY;
      }
    },
    { passive: true },
  );

  panel.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!tracking || !touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
        if (dy <= 0 || Math.abs(dx) > dy) {
          // Upwards or sideways: leave it to scrolling and text selection.
          tracking = false;
          return;
        }
        dragging = true;
        panel.classList.add("dragging");
      }
      event.preventDefault();
      dragDistance = Math.max(0, dy);
      panel.style.transform = `translateY(${dragDistance}px)`;
    },
    { passive: false },
  );

  function endDrag(): void {
    tracking = false;
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("dragging");
    if (dragDistance > CLOSE_DISTANCE_PX) {
      // Stays where the finger left it; close() slides it out from there.
      onDismiss();
    } else {
      panel.style.transform = "";
    }
  }

  panel.addEventListener("touchend", endDrag);
  panel.addEventListener("touchcancel", endDrag);

  return {
    open() {
      clearTimeout(hideTimer);
      panel.style.transform = "";
      layer.hidden = false;
      document.body.style.overflow = "hidden";
      // Lay out the closed position first so the slide-in animates.
      panel.getBoundingClientRect();
      layer.classList.add("open");
    },

    close() {
      if (layer.hidden) return;
      layer.classList.remove("open");
      panel.style.transform = "";
      document.body.style.overflow = "";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        layer.hidden = true;
      }, ANIMATION_MS);
    },
  };
}
