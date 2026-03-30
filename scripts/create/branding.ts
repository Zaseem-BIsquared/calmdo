/**
 * Apply branding (project name, display name) to project files.
 *
 * Replaces "Feather Starter" / "feather-starter-convex" with project-specific values
 * in package.json, site.config.ts, convex/config.ts, and test files.
 */
import * as fs from "node:fs";
import * as path from "node:path";

export interface BrandingOptions {
  projectRoot: string;
  projectName: string;
  appDisplayName: string;
}

function replaceInFile(
  filePath: string,
  replacements: [string, string][],
): boolean {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.replaceAll(search, replace);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(filePath, content, "utf-8");
  return changed;
}

/**
 * Apply branding replacements across project files.
 * Returns the count of files modified.
 */
export function applyBranding(options: BrandingOptions): number {
  const { projectRoot, projectName, appDisplayName } = options;
  const description = `${appDisplayName} — Built with Feather`;
  let count = 0;

  const targets: { filePath: string; replacements: [string, string][] }[] = [
    {
      filePath: path.join(projectRoot, "package.json"),
      replacements: [['"feather-starter-convex"', `"${projectName}"`]],
    },
    {
      filePath: path.join(projectRoot, "site.config.ts"),
      replacements: [
        ['"Feather Starter"', `"${appDisplayName}"`],
        [
          '"A lightweight, production-ready starter template powered by Convex and React."',
          `"${description}"`,
        ],
      ],
    },
    {
      filePath: path.join(projectRoot, "convex/config.ts"),
      replacements: [['"Feather Starter"', `"${appDisplayName}"`]],
    },
    {
      filePath: path.join(projectRoot, "site.config.test.ts"),
      replacements: [
        ['toBe("Feather Starter")', `toBe("${appDisplayName}")`],
      ],
    },
  ];

  for (const target of targets) {
    if (replaceInFile(target.filePath, target.replacements)) count++;
  }

  return count;
}
