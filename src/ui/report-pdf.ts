import { formatDate, formatLongDay, reportFileName, reportLine, type ReportDay, type ReportRange } from "../core";
import { shareFile } from "./share-file";

const TITLE = "Ess- und Beschwerdeprotokoll";

// A4 portrait in mm.
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const BOTTOM = PAGE_HEIGHT - MARGIN - 6; // room for the page number
const TIME_X = MARGIN + 2;
const KIND_X = MARGIN + 16;
const TEXT_X = MARGIN + 38;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN - TEXT_X;
const LINE = 4.6; // line height for 10 pt text
const DAY_HEADING = 7;
const DAY_GAP = 4;

type Doc = InstanceType<(typeof import("jspdf"))["jsPDF"]>;

interface DrawnLine {
  time: string;
  kind: string;
  text: string[];
  note: string[];
}

/** Lines of one day, already wrapped to the text column. */
function layoutDay(doc: Doc, day: ReportDay): DrawnLine[] {
  return day.entries.map((entry) => {
    const line = reportLine(entry);
    doc.setFont("helvetica", "normal");
    const text = doc.splitTextToSize(line.text, TEXT_WIDTH) as string[];
    doc.setFont("helvetica", "italic");
    const note = line.note === undefined ? [] : (doc.splitTextToSize(`„${line.note}“`, TEXT_WIDTH) as string[]);
    return { time: line.time, kind: line.kind, text, note };
  });
}

function lineHeight(line: DrawnLine): number {
  return (line.text.length + line.note.length) * LINE + 1;
}

/**
 * The report as a PDF: title, period and a diary-like list – each day as a heading with its entries
 * from morning to evening. A day is kept on one page whenever it fits on a page at all.
 * Built in the app because printing doesn't work reliably in iPhone home-screen apps.
 */
export async function buildReportPdf(days: readonly ReportDay[], range: ReportRange): Promise<Blob> {
  // Loaded only when needed, so the app itself starts quickly; the service worker keeps it offline.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(TITLE, MARGIN, MARGIN + 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${formatDate(range.from)} – ${formatDate(range.to)}`, MARGIN, MARGIN + 11);

  let y = MARGIN + 20;
  doc.setFontSize(10);

  function newPage(): void {
    doc.addPage();
    y = MARGIN;
  }

  for (const day of days) {
    const lines = layoutDay(doc, day);
    const height =
      DAY_HEADING + (lines.length === 0 ? LINE + 1 : lines.reduce((sum, line) => sum + lineHeight(line), 0)) + DAY_GAP;
    const fitsOnAPage = height <= BOTTOM - MARGIN;
    if (y + height > BOTTOM && fitsOnAPage) newPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(formatLongDay(day.day), MARGIN, y + 4);
    y += DAY_HEADING;
    doc.setFontSize(10);

    if (lines.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(90);
      doc.text("keine Einträge", TIME_X, y + 3);
      doc.setTextColor(0);
      y += LINE + 1;
    }
    for (const line of lines) {
      // Only a day too long for a whole page is split, and then never inside an entry.
      if (y + lineHeight(line) > BOTTOM) newPage();
      doc.setFont("helvetica", "normal");
      doc.text(line.time, TIME_X, y + 3);
      doc.setTextColor(90);
      doc.text(line.kind, KIND_X, y + 3);
      doc.setTextColor(0);
      doc.text(line.text, TEXT_X, y + 3);
      if (line.note.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.text(line.note, TEXT_X, y + 3 + line.text.length * LINE);
      }
      y += lineHeight(line);
    }

    doc.setDrawColor(190);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
    y += DAY_GAP;
  }

  const pages = doc.getNumberOfPages();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.text(`Seite ${page} von ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN / 2, { align: "right" });
  }

  return doc.output("blob");
}

/** Builds the PDF and hands it to the share menu (or downloads it where sharing isn't possible). */
export async function shareReportPdf(days: readonly ReportDay[], range: ReportRange): Promise<void> {
  const file = new File([await buildReportPdf(days, range)], reportFileName(range.from, range.to), {
    type: "application/pdf",
  });
  await shareFile(file, TITLE);
}
