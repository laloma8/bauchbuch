// Draws the home-screen icon (plate + poo, lavender on Prussian Blue) and saves it as PNGs in src/ui/public.
// Run with `npm run icons` after changing the icons; the PNGs are committed, the build only copies them.
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { STROKE, iconShapesMarkup } from "../src/ui/icon-shapes.ts";

const BACKGROUND = "#192238"; // Prussian Blue, like the app
const LINE = "#c5d0e8"; // Lavender, like the icons in the app
const OUT_DIR = new URL("../src/ui/public/", import.meta.url);

/**
 * The icon on a 512×512 square. iOS and Android round the corners themselves, so the
 * background fills the whole square. `scale` < 1 leaves room for Android's round mask.
 */
function appIconSvg(scale: number): string {
  const iconSize = 168 * scale;
  const gap = 24 * scale;
  const left = (512 - (2 * iconSize + gap)) / 2;
  const top = (512 - iconSize) / 2;
  const stroke = Object.entries(STROKE)
    .map(([key, value]) => `${key}="${key === "stroke" ? LINE : value}"`)
    .join(" ");
  const place = (x: number) => `transform="translate(${x} ${top}) scale(${iconSize / 24})"`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">`,
    `<rect width="512" height="512" fill="${BACKGROUND}"/>`,
    `<g ${place(left)} ${stroke}>${iconShapesMarkup("meal")}</g>`,
    `<g ${place(left + iconSize + gap)} ${stroke}>${iconShapesMarkup("event")}</g>`,
    `</svg>`,
  ].join("");
}

function writePng(fileName: string, size: number, scale: number): void {
  const png = new Resvg(appIconSvg(scale), { fitTo: { mode: "width", value: size } }).render().asPng();
  writeFileSync(new URL(fileName, OUT_DIR), png);
  console.log(`wrote ${fileName} (${size}×${size})`);
}

writePng("apple-touch-icon.png", 180, 1);
writePng("icon-192.png", 192, 1);
writePng("icon-512.png", 512, 1);
writePng("icon-512-maskable.png", 512, 0.85);
