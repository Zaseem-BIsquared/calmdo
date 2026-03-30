#!/usr/bin/env npx tsx
/**
 * Create a new Feather project — the main entry point.
 *
 * Usage:
 *   npx tsx scripts/create/index.ts my-project
 *   npm run create -- my-project
 *
 * Flow: wizard -> clone -> brand -> auth -> scaffold -> install -> convex init -> squash -> success
 */
import * as path from "node:path";
import { execSync } from "node:child_process";
import { runWizard, toTitleCase } from "./prompts";
import { cloneBaseProject } from "./clone";
import { applyBranding } from "./branding";
import { applyAuthConfig } from "./auth-config";
import { scaffoldExamples } from "./scaffold";

const REPO_URL =
  "https://github.com/siraj-samsudeen/feather-starter-convex.git";

async function main(): Promise<void> {
  const projectName = process.argv[2];

  console.log("");
  console.log("  Feather — Create New Project");
  console.log("  ─────────────────────────────");
  console.log("");

  // Step 1: Run wizard
  const answers = await runWizard({ defaultName: projectName });

  // Step 2: Clone base branch
  console.log(`\n  Cloning Feather base into ${answers.projectName}...`);
  await cloneBaseProject({
    repoUrl: REPO_URL,
    branch: "base",
    targetDir: answers.projectName,
    projectName: answers.projectName,
  });

  const projectRoot = path.resolve(answers.projectName);

  // Step 3: Apply branding
  console.log("  Applying branding...");
  const appDisplayName = toTitleCase(answers.projectName);
  const filesUpdated = applyBranding({
    projectRoot,
    projectName: answers.projectName,
    appDisplayName,
  });
  console.log(`    Updated ${filesUpdated} files`);

  // Step 4: Configure auth
  console.log("  Configuring authentication...");
  const authResult = await applyAuthConfig(projectRoot, {
    providers: answers.authProviders,
    githubClientId: answers.githubClientId,
    githubClientSecret: answers.githubClientSecret,
  });
  console.log(`    Template: ${authResult.templateName}`);

  // Step 5: Scaffold example apps
  if (answers.exampleApps.length > 0) {
    console.log(
      `  Installing example apps: ${answers.exampleApps.join(", ")}...`,
    );
    const scaffoldResult = await scaffoldExamples({
      projectRoot,
      exampleApps: answers.exampleApps,
    });
    console.log(
      `    Installed ${scaffoldResult.installed.length} apps`,
    );
    if (scaffoldResult.errors.length > 0) {
      for (const err of scaffoldResult.errors) {
        console.log(`    Warning: ${err}`);
      }
    }
  }

  // Step 6: Install dependencies
  console.log("  Installing dependencies...");
  execSync("npm install", { cwd: projectRoot, stdio: "inherit" });

  // Step 7: Initialize Convex
  console.log("  Initializing Convex...");
  try {
    execSync("npx convex dev --once", {
      cwd: projectRoot,
      stdio: "inherit",
    });
  } catch {
    console.log(
      "    Convex init completed (errors above may be expected on first run).",
    );
  }

  // Step 8: Restore convex/tsconfig.json (Convex CLI may overwrite it)
  try {
    execSync("git restore convex/tsconfig.json", {
      cwd: projectRoot,
      stdio: "pipe",
    });
  } catch {
    // Not critical — file may not exist in git yet
  }

  // Step 9: Squash to clean history
  execSync("git add -A", { cwd: projectRoot, stdio: "pipe" });
  execSync(
    `git commit -m "Initial commit — ${appDisplayName}"`,
    { cwd: projectRoot, stdio: "pipe" },
  );

  // Step 10: Success message
  console.log("");
  console.log("  ────────────────────────────────────────");
  console.log(`  ${appDisplayName} is ready!`);
  console.log("  ────────────────────────────────────────");
  console.log("");
  console.log(`  cd ${answers.projectName}`);
  console.log("  npm run dev");
  console.log("");

  if (authResult.envHints.length > 0) {
    console.log("  Auth notes:");
    for (const hint of authResult.envHints) {
      console.log(`    ${hint}`);
    }
    console.log("");
  }

  console.log("  Add more features later: npx feather add <feature>");
  console.log("");
}

main().catch((err) => {
  console.error("\n  Create failed:", err.message);
  process.exit(1);
});
