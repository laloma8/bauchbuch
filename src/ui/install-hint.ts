import { byId } from "./dom";

/**
 * The hint to put the app on the home screen only makes sense on the published site (https)
 * opened in Safari — not from the home-screen icon and not on the laptop test (http).
 */
export function shouldShowInstallHint(page: { protocol: string; standalone: boolean }): boolean {
  return page.protocol === "https:" && !page.standalone;
}

function isStandalone(): boolean {
  // iOS Safari reports the home-screen app through navigator.standalone.
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function showInstallHintIfNeeded(): void {
  byId<HTMLElement>("install-hint").hidden = !shouldShowInstallHint({
    protocol: window.location.protocol,
    standalone: isStandalone(),
  });
}
