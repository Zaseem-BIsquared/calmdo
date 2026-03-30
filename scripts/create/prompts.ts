/**
 * Interactive 3-question wizard for creating a new Feather project.
 *
 * Questions:
 * 1. Project name (required, from CLI arg or prompt)
 * 2. Auth providers (numbered choice — Password always included)
 * 3. Example apps (numbered choice — all by default)
 */
import * as readline from "node:readline";

export type AuthProvider = "password" | "otp" | "github";

export interface WizardAnswers {
  projectName: string;
  authProviders: AuthProvider[];
  exampleApps: string[];
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface PromptOptions {
  /** Pre-filled project name from CLI arg. */
  defaultName?: string;
  /** Skip all prompts and use defaults (for testing). */
  nonInteractive?: boolean;
}

/** Available example apps shown in the wizard. */
export const EXAMPLE_APPS = [
  { name: "todos", label: "Todos", complexity: "Simple CRUD" },
  { name: "tickets", label: "Tickets", complexity: "Status transitions + priority" },
  { name: "contacts", label: "Contacts", complexity: "Multi-field entity" },
] as const;

/** Available auth providers shown in the wizard. */
export const AUTH_PROVIDERS = [
  { id: "password" as const, label: "Password", note: "Zero-config, always enabled", default: true },
  { id: "otp" as const, label: "OTP (Email codes)", note: "Auto-works in dev via dev mailbox", default: false },
  { id: "github" as const, label: "GitHub OAuth", note: "Needs OAuth app credentials", default: false },
] as const;

/** Convert kebab-case to Title Case ("my-project" -> "My Project"). */
export function toTitleCase(kebab: string): string {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Convert display name to kebab-case ("My Project" -> "my-project"). */
export function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ask(
  rl: readline.Interface,
  question: string,
  defaultValue?: string,
): Promise<string> {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
    rl.once("close", () => resolve(defaultValue || ""));
  });
}

/**
 * Run the 3-question creation wizard.
 *
 * Smart defaults (Tableau Standard):
 * - Auth: Password only (zero friction)
 * - Examples: All installed
 */
export async function runWizard(
  options: PromptOptions = {},
): Promise<WizardAnswers> {
  // Non-interactive mode for testing — return all defaults
  if (options.nonInteractive) {
    const projectName = options.defaultName ?? "my-project";
    return {
      projectName,
      authProviders: ["password"],
      exampleApps: EXAMPLE_APPS.map((app) => app.name),
    };
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Question 1: Project name
    let projectName = options.defaultName ?? "";
    if (!projectName) {
      projectName = await ask(rl, "Project name");
      if (!projectName) {
        throw new Error("Project name is required");
      }
    } else {
      console.log(`  Project: ${projectName}`);
    }

    // Question 2: Auth providers
    console.log("");
    console.log("  Auth providers (Password is always included):");
    console.log("    1. Password only");
    console.log("    2. Password + OTP (email codes — auto-works in dev)");
    console.log("    3. Password + OTP + GitHub OAuth");
    const authChoice = await ask(rl, "Enter choice (1-3)", "1");
    const authNum = parseInt(authChoice, 10);

    let authProviders: AuthProvider[] = ["password"];
    let githubClientId: string | undefined;
    let githubClientSecret: string | undefined;

    if (authNum === 2) {
      authProviders = ["password", "otp"];
    } else if (authNum === 3) {
      authProviders = ["password", "otp", "github"];
      console.log("");
      githubClientId =
        (await ask(rl, "GitHub OAuth Client ID (or Enter to skip)")) ||
        undefined;
      githubClientSecret =
        (await ask(rl, "GitHub OAuth Client Secret (or Enter to skip)")) ||
        undefined;
    }

    // Question 3: Example apps
    console.log("");
    console.log("  Example apps to install (all included by default):");
    console.log(
      `    1. All examples (${EXAMPLE_APPS.map((a) => a.name).join(", ")})`,
    );
    console.log("    2. None — start with blank project");
    console.log("    3. Custom — choose which to include");
    const exampleChoice = await ask(rl, "Enter choice (1-3)", "1");
    const exampleNum = parseInt(exampleChoice, 10);

    let exampleApps: string[];
    if (exampleNum === 2) {
      exampleApps = [];
    } else if (exampleNum === 3) {
      exampleApps = [];
      console.log("");
      for (const app of EXAMPLE_APPS) {
        const include = await ask(
          rl,
          `Include ${app.label} (${app.complexity})? (Y/n)`,
          "Y",
        );
        if (include.toLowerCase() !== "n") {
          exampleApps.push(app.name);
        }
      }
    } else {
      exampleApps = EXAMPLE_APPS.map((a) => a.name);
    }

    rl.close();

    return {
      projectName,
      authProviders,
      exampleApps,
      githubClientId,
      githubClientSecret,
    };
  } catch (err) {
    rl.close();
    throw err;
  }
}
