export type ShareOutcome = "shared" | "cancelled" | "downloaded";

/**
 * Hands a file to the iPhone's share menu (print, save to Files, mail …). Where sharing files
 * isn't possible, e.g. on the laptop, the file is downloaded instead. Must be called from a tap.
 */
export async function shareFile(file: File, title: string): Promise<ShareOutcome> {
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      throw error;
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "downloaded";
}
