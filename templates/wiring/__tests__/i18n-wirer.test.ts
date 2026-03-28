import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { wireI18nNamespace, unwireI18nNamespace } from "../i18n-wirer";

describe("i18n-wirer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-wirer-"));
    const srcDir = path.join(tempDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, "i18n.ts"),
      `const ns = ["common", "auth", "dashboard"];

export default ns;
`,
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("wires a namespace to ns array", () => {
    wireI18nNamespace("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "i18n.ts"),
      "utf-8",
    );
    expect(content).toContain('"widgets"');
  });

  it("is idempotent — wiring same namespace twice produces no duplicate", () => {
    wireI18nNamespace("widgets", tempDir);
    wireI18nNamespace("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "i18n.ts"),
      "utf-8",
    );
    const count = (content.match(/"widgets"/g) || []).length;
    expect(count).toBe(1);
  });

  it("unwires a namespace from ns array", () => {
    wireI18nNamespace("widgets", tempDir);
    unwireI18nNamespace("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "src", "i18n.ts"),
      "utf-8",
    );
    expect(content).not.toContain('"widgets"');
  });
});
