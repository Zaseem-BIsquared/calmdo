/**
 * Auth provider template selection and configuration.
 *
 * Picks the correct auth.ts template based on wizard selections and
 * handles file operations (template copy, unused provider cleanup, env hints).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type AuthProvider = "password" | "otp" | "github";

export interface AuthSelection {
  providers: AuthProvider[];
  githubClientId?: string;
  githubClientSecret?: string;
}

export interface AuthConfigResult {
  templateName: string;
  actions: string[];
  envHints: string[];
}

/**
 * Determine which auth template to use based on selected providers.
 *
 * GitHub always implies OTP — selecting GitHub upgrades to the full template.
 * Password is always included (the minimum viable auth).
 */
export function getAuthTemplate(selection: AuthSelection): string {
  const hasOtp = selection.providers.includes("otp");
  const hasGithub = selection.providers.includes("github");

  if (hasGithub) return "password-otp-github";
  if (hasOtp) return "password-otp";
  return "password-only";
}

/**
 * Apply auth configuration to a project directory.
 *
 * - Copies the correct auth.ts template to convex/auth.ts
 * - Removes OTP/password-reset files if not needed (password-only mode)
 * - Writes environment variable hints to .env.local
 */
export async function applyAuthConfig(
  projectRoot: string,
  selection: AuthSelection,
): Promise<AuthConfigResult> {
  const templateName = getAuthTemplate(selection);
  const actions: string[] = [];

  // 1. Copy auth.ts template
  const templateSrc = path.join(
    __dirname,
    "auth-templates",
    `${templateName}.ts`,
  );
  const templateDest = path.join(projectRoot, "convex/auth.ts");

  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, templateDest);
    actions.push(`Copied auth template: ${templateName}`);
  } else {
    actions.push(`Template not found: ${templateSrc} (skipped)`);
  }

  // 2. Remove unused provider files for password-only mode
  if (templateName === "password-only") {
    const otpDir = path.join(projectRoot, "convex/otp");
    if (fs.existsSync(otpDir)) {
      fs.rmSync(otpDir, { recursive: true, force: true });
      actions.push("Removed OTP provider files (not selected)");
    }

    const passwordResetFile = path.join(
      projectRoot,
      "convex/password/ResendOTPPasswordReset.ts",
    );
    if (fs.existsSync(passwordResetFile)) {
      fs.rmSync(passwordResetFile);
      actions.push("Removed password reset file (requires OTP for email)");
    }
  }

  // 3. Build environment variable hints
  const envHints: string[] = [];

  if (selection.providers.includes("otp")) {
    envHints.push(
      "# Add to Convex dashboard for production email:",
    );
    envHints.push("# RESEND_API_KEY=re_...");
    envHints.push(
      "# In development, emails are captured by the dev mailbox at /dev/mailbox",
    );
  }

  if (selection.providers.includes("github")) {
    if (selection.githubClientId && selection.githubClientSecret) {
      envHints.push(`AUTH_GITHUB_ID=${selection.githubClientId}`);
      envHints.push(
        `AUTH_GITHUB_SECRET=${selection.githubClientSecret}`,
      );
    } else {
      envHints.push("# GitHub OAuth (add to Convex dashboard):");
      envHints.push("# AUTH_GITHUB_ID=your_client_id");
      envHints.push("# AUTH_GITHUB_SECRET=your_client_secret");
    }
  }

  // 4. Write .env.local with hints if any env vars needed
  if (envHints.length > 0) {
    const envPath = path.join(projectRoot, ".env.local");
    fs.writeFileSync(envPath, envHints.join("\n") + "\n", "utf-8");
    actions.push("Created .env.local with auth provider configuration hints");
  }

  return { templateName, actions, envHints };
}
