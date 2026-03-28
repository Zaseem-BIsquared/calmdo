import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { wireErrors, unwireErrors } from "../errors-wirer";

describe("errors-wirer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "errors-wirer-"));
    const sharedDir = path.join(tempDir, "src", "shared");
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.writeFileSync(
      path.join(sharedDir, "errors.ts"),
      `export const ERRORS = {
  auth: {
    EMAIL_NOT_SENT: "Unable to send email.",
  },
  common: {
    UNKNOWN: "Unknown error.",
  },
} as const;
`,
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("wires an error group to ERRORS object", () => {
    wireErrors(
      {
        featureName: "widgets",
        errors: {
          NOT_FOUND: "Widget not found.",
          INVALID_INPUT: "Invalid widget input.",
        },
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "errors.ts"),
      "utf-8",
    );
    expect(content).toContain("widgets:");
    expect(content).toContain("NOT_FOUND");
    expect(content).toContain("Widget not found.");
  });

  it("is idempotent — wiring same group twice produces no duplicate", () => {
    const config = {
      featureName: "widgets",
      errors: { NOT_FOUND: "Widget not found." },
    };

    wireErrors(config, tempDir);
    wireErrors(config, tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "errors.ts"),
      "utf-8",
    );
    const count = (content.match(/widgets:/g) || []).length;
    expect(count).toBe(1);
  });

  it("unwires an error group", () => {
    wireErrors(
      {
        featureName: "widgets",
        errors: { NOT_FOUND: "Widget not found." },
      },
      tempDir,
    );

    unwireErrors("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "shared", "errors.ts"),
      "utf-8",
    );
    expect(content).not.toContain("widgets:");
  });
});
