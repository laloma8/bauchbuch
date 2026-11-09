import { ICONS, STROKE, type IconName } from "./icon-shapes";

export type { IconName } from "./icon-shapes";

const SVG_NS = "http://www.w3.org/2000/svg";

/** An icon as an SVG element; `label` is read out by screen readers. */
export function createIcon(name: IconName, className = "icon"): SVGSVGElement {
  const icon = ICONS[name];
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", className);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", icon.label);
  for (const [key, value] of Object.entries(STROKE)) svg.setAttribute(key, value);
  for (const shape of icon.shapes) {
    const element = document.createElementNS(SVG_NS, shape.tag);
    for (const [key, value] of Object.entries(shape)) {
      if (key !== "tag") element.setAttribute(key, String(value));
    }
    svg.append(element);
  }
  return svg;
}
