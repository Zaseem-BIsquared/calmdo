import { Command } from "commander";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Init action ──────────────────────────────────────────────────────────────

export interface InitActionOptions {
  name?: string;
}

export function initAction(
  options: InitActionOptions,
  projectRoot: string,
): { success: boolean; message: string } {
  const created: string[] = [];
  const projectName = options.name || path.basename(projectRoot);

  // Create root feather.yaml if it doesn't exist
  const rootYaml = path.join(projectRoot, "feather.yaml");
  if (!fs.existsSync(rootYaml)) {
    fs.writeFileSync(
      rootYaml,
      `name: ${projectName}
version: 1.0.0
branding:
  appName: ${projectName}
features: []
settings:
  i18n:
    languages: [en, es]
  auth:
    providers: [password]
`,
      "utf-8",
    );
    created.push("feather.yaml");
  }

  // Create directory structure
  const dirs = [
    path.join(projectRoot, "src", "generated"),
    path.join(projectRoot, "src", "custom"),
    path.join(projectRoot, "convex", "generated"),
    path.join(projectRoot, "convex", "custom"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      // Add .gitkeep to keep empty dirs in git
      fs.writeFileSync(path.join(dir, ".gitkeep"), "", "utf-8");
      created.push(path.relative(projectRoot, dir) + "/");
    }
  }

  if (created.length === 0) {
    return {
      success: true,
      message: "Feather project already initialized. Nothing to create.",
    };
  }

  const lines = ["Feather project initialized:\n"];
  for (const item of created) {
    lines.push(`  Created ${item}`);
  }
  lines.push(`\nProject name: ${projectName}`);

  return { success: true, message: lines.join("\n") };
}

// ── CLI command ──────────────────────────────────────────────────────────────

export const initCommand = new Command("init")
  .description("Initialize Feather project structure")
  .option("--name <name>", "Project name")
  .action((options: InitActionOptions) => {
    const result = initAction(options, process.cwd());
    console.log(result.message);
  });
