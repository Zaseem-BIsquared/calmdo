import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  validateFeatureYaml,
  validateProjectYaml,
} from "../../templates/schema/yaml-validator";

// ── Find YAML files in a directory ───────────────────────────────────────────

function findYamlFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        (entry.name === "feather.yaml" || entry.name.endsWith(".gen.yaml"))
      ) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// ── Validate action ──────────────────────────────────────────────────────────

export interface ValidateResult {
  file: string;
  valid: boolean;
  errors: string[];
}

export function validateFiles(targetPath: string): ValidateResult[] {
  const results: ValidateResult[] = [];
  const resolvedPath = path.resolve(targetPath);

  let files: string[];

  if (fs.statSync(resolvedPath).isFile()) {
    files = [resolvedPath];
  } else {
    files = findYamlFiles(resolvedPath);
  }

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const fileName = path.basename(file);

    // Use project schema for root feather.yaml, feature schema for others
    const isProjectYaml =
      fileName === "feather.yaml" &&
      path.dirname(file) === path.resolve(targetPath);

    const result = isProjectYaml
      ? validateProjectYaml(content)
      : validateFeatureYaml(content);

    if (result.success) {
      results.push({ file, valid: true, errors: [] });
    } else {
      results.push({
        file,
        valid: false,
        errors: result.errors.map(
          (e) =>
            `${e.line ? `Line ${e.line}: ` : ""}${e.path ? `${e.path}: ` : ""}${e.message}`,
        ),
      });
    }
  }

  return results;
}

// ── CLI command ──────────────────────────────────────────────────────────────

export const validateCommand = new Command("validate")
  .description("Validate feature YAML files")
  .argument("[path]", "Path to YAML file or directory", ".")
  .action((targetPath: string) => {
    console.log("Validating YAML files...\n");

    const results = validateFiles(targetPath);

    if (results.length === 0) {
      console.log("No YAML files found.");
      process.exit(0);
    }

    let validCount = 0;
    let invalidCount = 0;

    for (const result of results) {
      const relativePath = path.relative(process.cwd(), result.file);
      if (result.valid) {
        console.log(`  ${relativePath} ... VALID`);
        validCount++;
      } else {
        console.log(`  ${relativePath} ... INVALID`);
        for (const error of result.errors) {
          console.log(`    ${error}`);
        }
        invalidCount++;
      }
    }

    console.log(
      `\n${validCount}/${results.length} files valid${invalidCount > 0 ? `, ${invalidCount} invalid` : ""}`,
    );

    if (invalidCount > 0) {
      process.exit(1);
    }
  });
