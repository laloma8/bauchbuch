import { describe, expect, it, vi } from "vitest";
import { requestPersistentStorage } from "./persistence";

describe("requestPersistentStorage", () => {
  it("asks the browser to keep the data", async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    expect(await requestPersistentStorage({ persist })).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("does nothing when the browser has no such feature", async () => {
    expect(await requestPersistentStorage(undefined)).toBe(false);
  });

  it("swallows errors from the browser", async () => {
    expect(await requestPersistentStorage({ persist: () => Promise.reject(new Error("nope")) })).toBe(false);
  });
});
