import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { generateFeature } from "../generate";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

describe("pipeline — generateFeature", () => {
  let tempDir: string;

  function setupTempProject(): void {
    // Create directory structure
    const convexDir = path.join(tempDir, "convex");
    const srcSharedDir = path.join(tempDir, "src", "shared");
    const srcDir = path.join(tempDir, "src");
    const templatesDir = path.join(tempDir, "templates");
    fs.mkdirSync(convexDir, { recursive: true });
    fs.mkdirSync(srcSharedDir, { recursive: true });

    // Copy defaults.yaml
    fs.cpSync(
      path.join(PROJECT_ROOT, "templates", "defaults.yaml"),
      path.join(templatesDir, "defaults.yaml"),
    );

    // Create minimal schema.ts
    fs.writeFileSync(
      path.join(convexDir, "schema.ts"),
      `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  users: defineTable({ name: v.optional(v.string()) }),
});

export default schema;
`,
    );
    fs.writeFileSync(
      path.join(convexDir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
        include: ["./**/*.ts"],
      }),
    );

    // Create minimal nav.ts
    fs.writeFileSync(
      path.join(srcSharedDir, "nav.ts"),
      `export interface NavItem { label: string; i18nKey: string; to: string; }
export const navItems: NavItem[] = [
  { label: "Dashboard", i18nKey: "dashboard.nav.dashboard", to: "/dashboard" },
  { label: "Settings", i18nKey: "dashboard.nav.settings", to: "/dashboard/settings" },
];
`,
    );

    // Create minimal i18n.ts
    fs.writeFileSync(
      path.join(srcDir, "i18n.ts"),
      `const ns = ["common", "auth", "dashboard"];\nexport default ns;\n`,
    );

    // Create minimal errors.ts
    fs.writeFileSync(
      path.join(srcSharedDir, "errors.ts"),
      `export const ERRORS = {\n  common: { UNKNOWN: "Unknown error." },\n} as const;\n`,
    );
  }

  function writeYaml(filename: string, content: string): string {
    const yamlPath = path.join(tempDir, filename);
    fs.mkdirSync(path.dirname(yamlPath), { recursive: true });
    fs.writeFileSync(yamlPath, content, "utf-8");
    return yamlPath;
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pipeline-test-"));
    setupTempProject();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("generates a minimal feature end-to-end (generated/ output)", async () => {
    const yamlPath = writeYaml(
      "widgets.yaml",
      `
name: widgets
label: Widget
fields:
  title:
    type: string
    required: true
`,
    );

    const result = await generateFeature({
      yamlPath,
      projectRoot: tempDir,
      outputMode: "generated",
    });

    expect(result.success).toBe(true);
    expect(result.featureName).toBe("widgets");
    expect(result.scaffolded.files.length).toBeGreaterThan(0);

    // Verify generated/ directories created
    const generatedFrontend = path.join(
      tempDir,
      "src",
      "generated",
      "widgets",
    );
    const generatedBackend = path.join(
      tempDir,
      "convex",
      "generated",
      "widgets",
    );
    expect(fs.existsSync(generatedFrontend)).toBe(true);
    expect(fs.existsSync(generatedBackend)).toBe(true);

    // Verify @generated header in output files
    const schemaContent = fs.readFileSync(
      path.join(generatedBackend, "schema.fragment.ts"),
      "utf-8",
    );
    expect(schemaContent).toContain("@generated");

    // Verify wiring happened
    const schemaTs = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    expect(schemaTs).toContain("widgets");
  });

  it("generates with legacy output mode (features/ directory)", async () => {
    const yamlPath = writeYaml(
      "widgets.yaml",
      `
name: widgets
label: Widget
fields:
  title:
    type: string
    required: true
`,
    );

    const result = await generateFeature({
      yamlPath,
      projectRoot: tempDir,
      outputMode: "legacy",
    });

    expect(result.success).toBe(true);

    const legacyFrontend = path.join(
      tempDir,
      "src",
      "features",
      "widgets",
    );
    const legacyBackend = path.join(tempDir, "convex", "widgets");
    expect(fs.existsSync(legacyFrontend)).toBe(true);
    expect(fs.existsSync(legacyBackend)).toBe(true);
  });

  it("dry run returns file list without writing", async () => {
    const yamlPath = writeYaml(
      "widgets.yaml",
      `
name: widgets
label: Widget
fields:
  title:
    type: string
    required: true
`,
    );

    const result = await generateFeature({
      yamlPath,
      projectRoot: tempDir,
      outputMode: "generated",
      dryRun: true,
    });

    expect(result.success).toBe(true);
    expect(result.scaffolded.files.length).toBeGreaterThan(0);
    expect(result.wired).toBeNull();

    // Verify no files created on disk
    const generatedDir = path.join(
      tempDir,
      "src",
      "generated",
      "widgets",
    );
    expect(fs.existsSync(generatedDir)).toBe(false);
  });

  it("YAML validation failure stops pipeline", async () => {
    const yamlPath = writeYaml(
      "invalid.yaml",
      `
fields:
  title:
    type: string
`,
    );

    const result = await generateFeature({
      yamlPath,
      projectRoot: tempDir,
      outputMode: "generated",
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // Verify no files created
    const generatedDir = path.join(
      tempDir,
      "src",
      "generated",
    );
    expect(fs.existsSync(generatedDir)).toBe(false);
  });

  it("handles missing YAML file gracefully", async () => {
    const result = await generateFeature({
      yamlPath: path.join(tempDir, "nonexistent.yaml"),
      projectRoot: tempDir,
      outputMode: "generated",
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Could not read");
  });
});
