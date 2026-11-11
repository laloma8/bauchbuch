// Pure data, no DOM: used by icons.ts in the app and by scripts/make-icons.ts for the home-screen icon.

export type Shape =
  | { tag: "path"; d: string }
  | { tag: "circle"; cx: number; cy: number; r: number }
  | { tag: "rect"; x: number; y: number; width: number; height: number; rx: number };

/** Simple line icons on a 24×24 grid, drawn in the current text colour. */
export const ICONS = {
  // Plate between fork and knife, with a little space on both sides.
  meal: {
    label: "Mahlzeit",
    shapes: [
      { tag: "circle", cx: 12, cy: 12, r: 5 },
      { tag: "circle", cx: 12, cy: 12, r: 2.5 },
      { tag: "path", d: "M3 3v18M1.5 3v4.5a1.5 1.5 0 0 0 3 0V3" },
      { tag: "path", d: "M22.5 21V3c-1.5 1-2.5 3-2.5 6v3h2.5" },
    ],
  },
  // A pile of poo: two stacked tiers, topped by a flat swirl that ends in a point.
  event: {
    label: "Ereignis",
    shapes: [
      { tag: "rect", x: 2.5, y: 15.5, width: 19, height: 5, rx: 2.5 },
      { tag: "rect", x: 5, y: 11, width: 14, height: 4.5, rx: 2.25 },
      { tag: "path", d: "M8 11c-.6-2.6 1.4-4.3 3.6-4.8 1-.3 1.6-1.2 1.4-2.7 2.3 1 3.6 3.4 3.4 5.4-.1.8-.4 1.5-.9 2.1" },
    ],
  },
  // A sheet of paper with a folded corner and lines of text: the report for the doctor.
  report: {
    label: "Auswertung",
    shapes: [
      { tag: "path", d: "M6 2.5h8.5L19 7v14.5H6z" },
      { tag: "path", d: "M14.5 2.5V7H19" },
      { tag: "path", d: "M9 11.5h7M9 15h7M9 18.5h4" },
    ],
  },
  // An arrow going down into a tray: keep a copy of everything.
  backup: {
    label: "Sicherung",
    shapes: [
      { tag: "path", d: "M12 3v11" },
      { tag: "path", d: "M7.5 9.5 12 14l4.5-4.5" },
      { tag: "path", d: "M4 14.5V19a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-4.5" },
    ],
  },
} satisfies Record<string, { label: string; shapes: Shape[] }>;

export type IconName = keyof typeof ICONS;

/** How the lines are drawn, shared by the app and the home-screen icon. */
export const STROKE = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "1.6",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
} as const;

/** The icon's shapes as SVG markup (without the outer <svg>), e.g. for a <g> element. */
export function iconShapesMarkup(name: IconName): string {
  return ICONS[name].shapes
    .map((shape) => {
      const attributes = Object.entries(shape)
        .filter(([key]) => key !== "tag")
        .map(([key, value]) => `${key}="${String(value)}"`)
        .join(" ");
      return `<${shape.tag} ${attributes}/>`;
    })
    .join("");
}
