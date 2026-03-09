import { describe, it, expect } from "vitest";
import { navItems } from "./nav";

describe("navItems", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(navItems)).toBe(true);
    expect(navItems.length).toBeGreaterThan(0);
  });

  it("each item has required fields (label, i18nKey, to)", () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(typeof item.label).toBe("string");
      expect(item.i18nKey).toBeTruthy();
      expect(typeof item.i18nKey).toBe("string");
      expect(item.to).toBeTruthy();
      expect(typeof item.to).toBe("string");
    }
  });

  it("has no duplicate 'to' paths", () => {
    const paths = navItems.map((item) => item.to);
    const uniquePaths = new Set(paths);
    expect(uniquePaths.size).toBe(paths.length);
  });

  it("all 'to' values start with /", () => {
    for (const item of navItems) {
      expect(item.to.startsWith("/")).toBe(true);
    }
  });
});
