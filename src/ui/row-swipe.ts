/** Width of the red "Löschen" button behind a row (matches .row-delete in style.css). */
const BUTTON_WIDTH_PX = 88;
/** Movement before a touch counts as a swipe, so taps still open the entry. */
const START_PX = 10;

export interface RowSwipe {
  /** Forget an open row, e.g. after the rows were rebuilt. */
  reset(): void;
}

/**
 * Swiping a row to the left slides its content aside and shows the red "Löschen" button behind it,
 * like in iPhone Mail; swiping right slides it back. Only one row is open at a time, and a tap
 * anywhere closes it without opening anything – except a tap on its "Löschen" button.
 */
export function setUpRowSwipe(list: HTMLElement): RowSwipe {
  let openContent: HTMLElement | undefined;
  let drag:
    | { content: HTMLElement; startX: number; startY: number; from: number; offset: number; sideways?: boolean }
    | undefined;
  let swallowClick = false;

  function slide(content: HTMLElement, offset: number): void {
    content.style.transform = offset === 0 ? "" : `translateX(${offset}px)`;
  }

  function close(): void {
    if (openContent !== undefined) slide(openContent, 0);
    openContent = undefined;
  }

  list.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      const content =
        event.target instanceof Element ? event.target.closest<HTMLElement>(".row-content") : null;
      if (event.touches.length !== 1 || touch === undefined || content === null) {
        drag = undefined;
        return;
      }
      const from = content === openContent ? -BUTTON_WIDTH_PX : 0;
      drag = { content, startX: touch.clientX, startY: touch.clientY, from, offset: from };
    },
    { passive: true },
  );

  list.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (drag === undefined || touch === undefined) return;
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;
      if (drag.sideways === undefined) {
        if (Math.abs(dx) < START_PX && Math.abs(dy) < START_PX) return;
        // Decide once: sideways slides the row, anything else is left to scrolling.
        drag.sideways = Math.abs(dx) > Math.abs(dy);
        if (!drag.sideways) return;
        if (openContent !== undefined && openContent !== drag.content) close();
        drag.content.classList.add("dragging");
      }
      if (!drag.sideways) return;
      drag.offset = Math.min(0, Math.max(-BUTTON_WIDTH_PX, drag.from + dx));
      slide(drag.content, drag.offset);
    },
    { passive: true },
  );

  function endDrag(): void {
    if (drag?.sideways === true) {
      drag.content.classList.remove("dragging");
      const open = drag.offset < -BUTTON_WIDTH_PX / 2;
      slide(drag.content, open ? -BUTTON_WIDTH_PX : 0);
      openContent = open ? drag.content : undefined;
      // iOS may still send a click after a swipe; it must not open the entry.
      swallowClick = true;
      setTimeout(() => (swallowClick = false), 400);
    }
    drag = undefined;
  }

  list.addEventListener("touchend", endDrag);
  list.addEventListener("touchcancel", endDrag);

  // Runs before the list's own click handler (capture phase).
  document.addEventListener(
    "click",
    (event) => {
      if (swallowClick) {
        swallowClick = false;
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      if (openContent === undefined) return;
      const onOpenButton =
        event.target instanceof Element &&
        event.target.closest(".row-delete") !== null &&
        event.target.closest(".row") === openContent.closest(".row");
      if (onOpenButton) return;
      const inList = event.target instanceof Node && list.contains(event.target);
      close();
      // A tap on another row only closes the open one; taps outside the list still do their job.
      if (inList) {
        event.stopPropagation();
        event.preventDefault();
      }
    },
    { capture: true },
  );

  return {
    reset() {
      openContent = undefined;
      drag = undefined;
    },
  };
}
