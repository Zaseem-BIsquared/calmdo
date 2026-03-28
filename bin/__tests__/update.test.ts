import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { updateAction } from "../commands/update";

const PROJECT_ROOT = path.resolve(__dirname, "../..");

function setupTempProject(tempDir: string): void {
  const convexDir = path.join(tempDir, "convex");
  const srcSharedDir = path.join(tempDir, "src", "shared");
  const srcDir = path.join(tempDir, "src");
  const templatesDir = path.join(tempDir, "templates");

  fs.mkdirSync(convexDir, { recursive: true });
  fs.mkdirSync(srcSharedDir, { recursive: true });
  fs.mkdirSync(templatesDir, { recursive: true });

  fs.cpSync(
    path.join(PROJECT_ROOT, "templates", "defaults.yaml"),
    path.join(templatesDir, "defaults.yaml"),
  );

  fs.writeFileSync(
    path.join(convexDir, "schema.ts"),
    `import { defineSchema, defineTable } from "convex/server";\nimport { v } from "convex/values";\nconst schema = defineSchema({\n  users: defineTable({ name: v.optional(v.string()) }),\n});\nexport default schema;\n`,
  );
  fs.writeFileSync(
    path.join(convexDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { target: "ESNext", module: "ESNext", moduleResolution: "bundler", strict: true, skipLibCheck: true },
      include: ["./**/*.ts"],
    }),
  );
  fs.writeFileSync(
    path.join(srcSharedDir, "nav.ts"),
    `export interface NavItem { label: string; i18nKey: string; to: string; }\nexport const navItems: NavItem[] = [\n  { label: "Dashboard", i18nKey: "d", to: "/dashboard" },\n  { label: "Settings", i18nKey: "s", to: "/dashboard/settings" },\n];\n`,
  );
  fs.writeFileSync(
    path.join(srcDir, "i18n.ts"),
    `const ns = ["common"];\nexport default ns;\n`,
  );
  fs.writeFileSync(
    path.join(srcSharedDir, "errors.ts"),
    `export const ERRORS = {\n  common: { UNKNOWN: "Unknown error." },\n} as const;\n`,
  );
}

describe("feather update", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "update-test-"));
    setupTempProject(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("reports no features found when none exist", async () => {
    const result = await updateAction({}, tempDir);
    expect(result.success).toBe(true);
    expect(result.message).toContain("No feature YAML");
  });

  it("regenerates features from YAML files", async () => {
    // Create a feature with YAML
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await updateAction({}, tempDir);
    expect(result.success).toBe(true);
    expect(result.message).toContain("widgets");
    expect(result.message).toContain("regenerated");
  });

  it("dry run shows what would happen without changes", async () => {
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await updateAction({ dryRun: true }, tempDir);
    expect(result.success).toBe(true);
    expect(result.message).toContain("preview");
  });
});
