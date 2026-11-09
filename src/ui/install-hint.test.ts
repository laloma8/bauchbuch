import { describe, expect, it } from "vitest";
import { shouldShowInstallHint } from "./install-hint";

describe("shouldShowInstallHint", () => {
  it("shows the hint on the published site in Safari", () => {
    expect(shouldShowInstallHint({ protocol: "https:", standalone: false })).toBe(true);
  });

  it("hides it when opened from the home screen", () => {
    expect(shouldShowInstallHint({ protocol: "https:", standalone: true })).toBe(false);
  });

  it("hides it on the laptop test over http", () => {
    expect(shouldShowInstallHint({ protocol: "http:", standalone: false })).toBe(false);
  });
});
