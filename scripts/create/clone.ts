/**
 * Clone the Feather base branch into a new project directory.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface CloneOptions {
  repoUrl: string;
  branch: string;
  targetDir: string;
  projectName: string;
}

/**
 * Clone the base branch and set up a fresh git repo.
 *
 * 1. git clone --branch base --single-branch --depth 1
 * 2. Remove .git directory (detach from upstream)
 * 3. git init (fresh history)
 */
export async function cloneBaseProject(options: CloneOptions): Promise<void> {
  const { repoUrl, branch, targetDir } = options;
  const absTarget = path.resolve(targetDir);

  if (fs.existsSync(absTarget)) {
    throw new Error(`Directory already exists: ${absTarget}`);
  }

  // Clone base branch (shallow — only latest commit)
  execSync(
    `git clone --branch ${branch} --single-branch --depth 1 ${repoUrl} ${absTarget}`,
    { stdio: "pipe" },
  );

  // Remove upstream .git directory
  fs.rmSync(path.join(absTarget, ".git"), { recursive: true, force: true });

  // Initialize fresh git repo
  execSync("git init", { cwd: absTarget, stdio: "pipe" });
}
