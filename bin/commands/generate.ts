import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";
import { generateFeature } from "../../templates/pipeline/generate";

// ── Generate action ──────────────────────────────────────────────────────────

export interface GenerateActionOptions {
  fromYaml?: string;
  legacy?: boolean;
  dryRun?: boolean;
  skipWire?: boolean;
}

export async function generateAction(
  name: string | undefined,
  options: GenerateActionOptions,
  projectRoot: string,
): Promise<{ success: boolean; message: string }> {
  let yamlPath: string;

  if (options.fromYaml) {
    yamlPath = path.resolve(options.fromYaml);
  } else if (name) {
    // Look for existing YAML or create a minimal one
    const possiblePaths = [
      path.join(projectRoot, "src", "features", name, "feather.yaml"),
      path.join(projectRoot, "src", "generated", name, "feather.yaml"),
    ];

    const existing = possiblePaths.find((p) => fs.existsSync(p));
    if (existing) {
      yamlPath = existing;
    } else {
      // Create minimal YAML
      const featureDir = path.join(
        projectRoot,
        "src",
        "features",
        name,
      );
      fs.mkdirSync(featureDir, { recursive: true });
      yamlPath = path.join(featureDir, "feather.yaml");

      const pascalLabel =
        name.charAt(0).toUpperCase() +
        name.slice(1).replace(/[-_](\w)/g, (_, c: string) => ` ${c.toUpperCase()}`);

      fs.writeFileSync(
        yamlPath,
        `name: ${name}
label: ${pascalLabel}
fields:
  title:
    type: string
    required: true
`,
        "utf-8",
      );
    }
  } else {
    return {
      success: false,
      message: "Provide a feature name or --from-yaml <path>",
    };
  }

  const outputMode = options.legacy ? "legacy" : "generated";

  const result = await generateFeature({
    yamlPath,
    projectRoot,
    outputMode,
    dryRun: options.dryRun,
  });

  if (!result.success) {
    return {
      success: false,
      message: `Generation failed:\n${result.errors.join("\n")}`,
    };
  }

  const lines: string[] = [`Generating feature: ${result.featureName}\n`];

  if (options.dryRun) {
    lines.push("Phase 1: Scaffold (dry run)");
  } else {
    lines.push("Phase 1: Scaffold");
  }

  for (const file of result.scaffolded.files) {
    const rel = path.relative(projectRoot, file);
    lines.push(`  ${options.dryRun ? "Would create" : "Created"} ${rel}`);
  }

  if (result.wired && !options.dryRun) {
    lines.push("\nPhase 2: Wire");
    for (const [key, step] of Object.entries(result.wired)) {
      lines.push(`  ${key}: ${step.message}`);
    }
  }

  lines.push(
    `\nDone. ${result.scaffolded.files.length} files ${options.dryRun ? "would be " : ""}created.`,
  );

  return { success: true, message: lines.join("\n") };
}

// ── CLI command ──────────────────────────────────────────────────────────────

export const generateCommand = new Command("generate")
  .description("Generate a feature from YAML specification")
  .argument("[name]", "Feature name")
  .option("--from-yaml <path>", "Generate from existing YAML file")
  .option("--legacy", "Output to features/ directory instead of generated/")
  .option("--dry-run", "Preview files without writing")
  .option("--skip-wire", "Skip AST wiring step")
  .action(async (name: string | undefined, options: GenerateActionOptions) => {
    const result = await generateAction(name, options, process.cwd());
    console.log(result.message);
    if (!result.success) process.exit(1);
  });
