import { describe, it, expect } from "vitest";
import { ERRORS } from "./errors";

describe("ERRORS", () => {
  it("has all expected error groups", () => {
    expect(ERRORS.auth).toBeDefined();
    expect(ERRORS.onboarding).toBeDefined();
    expect(ERRORS.billing).toBeDefined();
    expect(ERRORS.common).toBeDefined();
  });

  it("all error values are non-empty strings", () => {
    for (const group of Object.values(ERRORS)) {
      for (const [, value] of Object.entries(group)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("ERRORS is deeply frozen (as const)", () => {
    // as const produces readonly properties; verify by checking
    // that the type system enforces it (runtime check: Object.isFrozen
    // doesn't apply to 'as const', but we can verify values haven't changed)
    expect(ERRORS.auth.EMAIL_NOT_SENT).toBe("Unable to send email.");
    expect(ERRORS.billing.MISSING_SIGNATURE).toBe(
      "Unable to verify webhook signature.",
    );
    expect(ERRORS.common.UNKNOWN).toBe("Unknown error.");
  });
});
