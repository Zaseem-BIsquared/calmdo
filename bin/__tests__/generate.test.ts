import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { generateAction } from "../commands/generate";

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

describe("feather generate", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generate-test-"));
    setupTempProject(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("generates from valid YAML — files created in generated/", async () => {
    const yamlPath = path.join(tempDir, "widgets.yaml");
    fs.writeFileSync(
      yamlPath,
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await generateAction(undefined, { fromYaml: yamlPath }, tempDir);
    expect(result.success).toBe(true);
    expect(result.message).toContain("widgets");

    const genDir = path.join(tempDir, "src", "generated", "widgets");
    expect(fs.existsSync(genDir)).toBe(true);
  });

  it("generates with --dry-run — no files created", async () => {
    const yamlPath = path.join(tempDir, "widgets.yaml");
    fs.writeFileSync(
      yamlPath,
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await generateAction(
      undefined,
      { fromYaml: yamlPath, dryRun: true },
      tempDir,
    );
    expect(result.success).toBe(true);
    expect(result.message).toContain("Would create");

    const genDir = path.join(tempDir, "src", "generated", "widgets");
    expect(fs.existsSync(genDir)).toBe(false);
  });

  it("generates with --legacy — files in features/", async () => {
    const yamlPath = path.join(tempDir, "widgets.yaml");
    fs.writeFileSync(
      yamlPath,
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await generateAction(
      undefined,
      { fromYaml: yamlPath, legacy: true },
      tempDir,
    );
    expect(result.success).toBe(true);

    const legacyDir = path.join(tempDir, "src", "features", "widgets");
    expect(fs.existsSync(legacyDir)).toBe(true);
  });

  it("fails on invalid YAML — no files created", async () => {
    const yamlPath = path.join(tempDir, "bad.yaml");
    fs.writeFileSync(yamlPath, `fields:\n  bad:\n    type: invalid\n`);

    const result = await generateAction(undefined, { fromYaml: yamlPath }, tempDir);
    expect(result.success).toBe(false);
    expect(result.message).toContain("failed");
  });

  it("generates by name — creates minimal YAML if none exists", async () => {
    const result = await generateAction("newfeature", {}, tempDir);
    expect(result.success).toBe(true);

    const yamlPath = path.join(
      tempDir,
      "src",
      "features",
      "newfeature",
      "feather.yaml",
    );
    expect(fs.existsSync(yamlPath)).toBe(true);
  });

  it("dry-run produces >= 20 files from Handlebars rendering (not 5 stubs)", async () => {
    const yamlPath = path.join(tempDir, "todos.yaml");
    fs.writeFileSync(
      yamlPath,
      `name: todos\nlabel: Todo\nlabelPlural: Todos\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await generateAction(
      undefined,
      { fromYaml: yamlPath, dryRun: true },
      tempDir,
    );

    expect(result.success).toBe(true);
    // Count "Would create" lines — each file produces one line
    const wouldCreateCount = (result.message.match(/Would create/g) || []).length;
    expect(wouldCreateCount).toBeGreaterThanOrEqual(20);

    // Verify no files were written to disk
    const genDir = path.join(tempDir, "src", "generated", "todos");
    expect(fs.existsSync(genDir)).toBe(false);
  });
});
