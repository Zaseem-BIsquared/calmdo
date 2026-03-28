import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { migrateFeature } from "../migrate-feature";

describe("migrateFeature", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "migrate-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("warns when no YAML file exists", async () => {
    const featureDir = path.join(tempDir, "src", "features", "tasks");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "page.tsx"),
      "export function TasksPage() {}",
    );

    const result = await migrateFeature({
      featureName: "tasks",
      projectRoot: tempDir,
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("No feather.yaml");
  });

  it("classifies files as generated when they have @generated marker", async () => {
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );
    fs.writeFileSync(
      path.join(featureDir, "page.tsx"),
      "// @generated — DO NOT EDIT\nexport function WidgetsPage() {}",
    );

    const result = await migrateFeature({
      featureName: "widgets",
      projectRoot: tempDir,
    });

    expect(result.generatedFiles).toContain("page.tsx");
  });

  it("classifies files as custom when they lack @generated marker", async () => {
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );
    fs.writeFileSync(
      path.join(featureDir, "custom-page.tsx"),
      "// Custom implementation\nexport function WidgetsPage() { return <div>Custom</div>; }",
    );

    const result = await migrateFeature({
      featureName: "widgets",
      projectRoot: tempDir,
    });

    expect(result.customFiles).toContain("custom-page.tsx");
  });

  it("dry run returns classification without moving files", async () => {
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );
    fs.writeFileSync(
      path.join(featureDir, "page.tsx"),
      "// @generated — DO NOT EDIT\nexport function WidgetsPage() {}",
    );

    const result = await migrateFeature({
      featureName: "widgets",
      projectRoot: tempDir,
      dryRun: true,
    });

    expect(result.generatedFiles.length).toBeGreaterThan(0);

    // Verify no generated/ directory was created
    const genDir = path.join(tempDir, "src", "generated", "widgets");
    expect(fs.existsSync(genDir)).toBe(false);
  });

  it("classifies config files as unchanged", async () => {
    const featureDir = path.join(tempDir, "src", "features", "widgets");
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(
      path.join(featureDir, "feather.yaml"),
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const result = await migrateFeature({
      featureName: "widgets",
      projectRoot: tempDir,
    });

    expect(result.unchangedFiles).toContain("feather.yaml");
  });
});
