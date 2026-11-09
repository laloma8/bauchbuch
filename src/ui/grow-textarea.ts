export interface GrowingTextarea {
  /** Back to its starting height, e.g. after clearing the text. */
  reset(): void;
}

/**
 * Lets a textarea grow with its text, so the whole entry stays visible,
 * and makes Enter save the form instead of starting a new line.
 */
export function setUpGrowingTextarea(textarea: HTMLTextAreaElement, form: HTMLFormElement): GrowingTextarea {
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 2}px`;
  });

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  return {
    reset() {
      textarea.style.height = "";
    },
  };
}
