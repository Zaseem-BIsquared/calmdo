import * as fs from "node:fs";
import * as path from "node:path";
import { validateFeatureYaml } from "../schema/yaml-validator";
import { mergeWithDefaults } from "../schema/defaults-merger";
import { scaffoldFeature, type ScaffoldResult } from "./scaffold";
import { wirePipeline, type WireResult } from "./wire";
import type { FeatureYaml } from "../schema/feather-yaml.schema";

// ── Public API ───────────────────────────────────────────────────────────────

export interface GenerateOptions {
  yamlPath: string;
  projectRoot: string;
  outputMode: "generated" | "legacy";
  dryRun?: boolean;
}

export interface GenerateResult {
  success: boolean;
  featureName: string;
  scaffolded: ScaffoldResult;
  wired: WireResult | null;
  errors: string[];
}

export async function generateFeature(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const errors: string[] = [];

  // 1. Read YAML
  let yamlContent: string;
  try {
    yamlContent = fs.readFileSync(options.yamlPath, "utf-8");
  } catch (error) {
    return {
      success: false,
      featureName: "",
      scaffolded: { files: [], outputDir: "" },
      wired: null,
      errors: [`Could not read YAML file: ${options.yamlPath}`],
    };
  }

  // 2. Validate
  const validation = validateFeatureYaml(yamlContent);
  if (!validation.success) {
    return {
      success: false,
      featureName: "",
      scaffolded: { files: [], outputDir: "" },
      wired: null,
      errors: validation.errors.map(
        (e) =>
          `${e.line ? `Line ${e.line}: ` : ""}${e.path ? `${e.path}: ` : ""}${e.message}`,
      ),
    };
  }

  // 3. Merge with defaults
  let config: FeatureYaml;
  try {
    const rawYaml = (await import("yaml")).default;
    const parsed = rawYaml.parse(yamlContent) as Record<string, unknown>;
    config = mergeWithDefaults(parsed, options.projectRoot);
  } catch (error) {
    return {
      success: false,
      featureName: validation.data.name,
      scaffolded: { files: [], outputDir: "" },
      wired: null,
      errors: [
        `Defaults merging failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }

  // 4. Scaffold (create files)
  const scaffolded = await scaffoldFeature(config, {
    projectRoot: options.projectRoot,
    outputMode: options.outputMode,
    dryRun: options.dryRun ?? false,
  });

  // 5. Wire (modify shared files) — skip in dry run
  let wired: WireResult | null = null;
  if (!options.dryRun) {
    wired = wirePipeline(config, options.projectRoot);
  }

  return {
    success: true,
    featureName: config.name,
    scaffolded,
    wired,
    errors,
  };
}
