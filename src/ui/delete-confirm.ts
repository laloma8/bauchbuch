import { byId } from "./dom";

export interface DeleteConfirm {
  /** Shows the "Löschen" button (when editing) or hides the whole area (when adding). */
  show(visible: boolean): void;
}

/**
 * "Löschen" in an overlay: the first tap asks "Diesen Eintrag löschen?" with "Abbrechen" and a
 * red "Löschen"; only the second deletes. Element ids start with `prefix` (see index.html).
 */
export function createDeleteConfirm(prefix: string, onConfirm: () => void): DeleteConfirm {
  const area = byId<HTMLElement>(`${prefix}-delete`);
  const start = byId<HTMLButtonElement>(`${prefix}-delete-start`);
  const ask = byId<HTMLElement>(`${prefix}-delete-ask`);

  function asking(yes: boolean): void {
    start.hidden = yes;
    ask.hidden = !yes;
  }

  start.addEventListener("click", () => asking(true));
  byId<HTMLButtonElement>(`${prefix}-delete-cancel`).addEventListener("click", () => asking(false));
  byId<HTMLButtonElement>(`${prefix}-delete-confirm`).addEventListener("click", onConfirm);

  return {
    show(visible) {
      area.hidden = !visible;
      asking(false);
    },
  };
}
