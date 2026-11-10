import { eventLine, formatDate, formatShortDay, mealLine, reportFileName, type ReportDay, type ReportRange } from "../core";

const TITLE = "Ess- und Beschwerdeprotokoll";
/** Page margin in mm (A4 portrait: 210 × 297 mm). */
const MARGIN = 14;

/**
 * The report as a PDF: title, period and one table row per day, black on white, A4 portrait.
 * Built in the app because printing doesn't work reliably in iPhone home-screen apps.
 */
export async function buildReportPdf(days: readonly ReportDay[], range: ReportRange): Promise<Blob> {
  // Loaded only when needed, so the app itself starts quickly; the service worker keeps it offline.
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(TITLE, MARGIN, MARGIN + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${formatDate(range.from)} – ${formatDate(range.to)}`, MARGIN, MARGIN + 11);

  autoTable(doc, {
    startY: MARGIN + 16,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN + 6 },
    theme: "grid",
    head: [["Tag", "Mahlzeiten", "Ereignisse"]],
    body: days.map((day) => [
      formatShortDay(day.day),
      day.meals.length === 0 ? "–" : day.meals.map(mealLine).join("\n"),
      day.events.length === 0
        ? "–"
        : day.events
            // A cell has only one font, so the note stands in quotes on its own line.
            .map((event) => (event.note === "" ? eventLine(event) : `${eventLine(event)}\n„${event.note}“`))
            .join("\n"),
    ]),
    // A day is never split across two pages; the header row repeats on every page.
    rowPageBreak: "avoid",
    showHead: "everyPage",
    styles: { font: "helvetica", fontSize: 9, textColor: 0, lineColor: 160, lineWidth: 0.2, cellPadding: 1.8 },
    headStyles: { fillColor: 230, textColor: 0, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 22 } },
    didDrawPage: () => {
      const page = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.text(`Seite ${page}`, 210 - MARGIN, 297 - MARGIN / 2, { align: "right" });
    },
  });

  return doc.output("blob");
}

/**
 * Hands the PDF to the iPhone's share menu (print, save to Files, mail …). Where sharing files
 * isn't possible, e.g. on the laptop, the PDF is downloaded instead. Cancelling the menu is fine.
 */
export async function shareReportPdf(days: readonly ReportDay[], range: ReportRange): Promise<void> {
  const name = reportFileName(range.from, range.to);
  const file = new File([await buildReportPdf(days, range)], name, { type: "application/pdf" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: TITLE });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
    return;
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
