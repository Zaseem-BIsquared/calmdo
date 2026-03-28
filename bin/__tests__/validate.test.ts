import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { validateFiles } from "../commands/validate";

describe("feather validate", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("validates a valid YAML file", () => {
    const yamlPath = path.join(tempDir, "feather.yaml");
    fs.writeFileSync(
      yamlPath,
      `name: widgets\nlabel: Widget\nfields:\n  title:\n    type: string\n    required: true\n`,
    );

    const results = validateFiles(yamlPath);
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(true);
  });

  it("reports errors for invalid YAML file", () => {
    const yamlPath = path.join(tempDir, "feather.yaml");
    fs.writeFileSync(
      yamlPath,
      `fields:\n  bad:\n    type: invalid\n`,
    );

    const results = validateFiles(yamlPath);
    expect(results).toHaveLength(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors.length).toBeGreaterThan(0);
  });

  it("validates a directory — finds all YAML files", () => {
    const subDir = path.join(tempDir, "src", "features", "tasks");
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(
      path.join(subDir, "feather.yaml"),
      `name: tasks\nlabel: Task\nfields:\n  title:\n    type: string\n`,
    );

    const results = validateFiles(tempDir);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.valid)).toBe(true);
  });

  it("returns empty array for directory with no YAML files", () => {
    const results = validateFiles(tempDir);
    expect(results).toHaveLength(0);
  });
});
