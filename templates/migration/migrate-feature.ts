import * as fs from "node:fs";
import * as path from "node:path";
import { validateFeatureYaml } from "../schema/yaml-validator";

// ── Migration types ──────────────────────────────────────────────────────────

export interface MigrationOptions {
  featureName: string;
  projectRoot: string;
  dryRun?: boolean;
}

export interface MigrationResult {
  generatedFiles: string[];
  customFiles: string[];
  unchangedFiles: string[];
  warnings: string[];
}

// ── File classification ──────────────────────────────────────────────────────

interface FeatureFileInfo {
  relativePath: string;
  absolutePath: string;
  category: "frontend" | "backend" | "test" | "config";
}

function discoverFeatureFiles(
  featureName: string,
  projectRoot: string,
): FeatureFileInfo[] {
  const files: FeatureFileInfo[] = [];

  // Frontend files
  const frontendDir = path.join(
    projectRoot,
    "src",
    "features",
    featureName,
  );
  if (fs.existsSync(frontendDir)) {
    walkDir(frontendDir, (filePath) => {
      const relativePath = path.relative(frontendDir, filePath);
      const category = relativePath.includes(".test.")
        ? "test"
        : relativePath.endsWith(".yaml") || relativePath.endsWith(".gen.yaml")
          ? "config"
          : "frontend";
      files.push({ relativePath, absolutePath: filePath, category });
    });
  }

  // Backend files
  const backendDir = path.join(projectRoot, "convex", featureName);
  if (fs.existsSync(backendDir)) {
    walkDir(backendDir, (filePath) => {
      const relativePath = path.relative(backendDir, filePath);
      const category = relativePath.includes(".test.") ? "test" : "backend";
      files.push({
        relativePath: `convex/${relativePath}`,
        absolutePath: filePath,
        category,
      });
    });
  }

  return files;
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile()) {
      callback(fullPath);
    }
  }
}

// ── Content comparison ───────────────────────────────────────────────────────

function isLikelyGenerated(content: string): boolean {
  // Files with @generated header are definitely generated
  if (content.includes("@generated")) return true;

  // Files with no customization markers are likely generated
  // (This is a heuristic — real migration would compare against pipeline output)
  return false;
}

// ── Migration function ───────────────────────────────────────────────────────

export async function migrateFeature(
  options: MigrationOptions,
): Promise<MigrationResult> {
  const { featureName, projectRoot, dryRun = false } = options;

  const generatedFiles: string[] = [];
  const customFiles: string[] = [];
  const unchangedFiles: string[] = [];
  const warnings: string[] = [];

  // Check for feather.yaml
  const yamlPaths = [
    path.join(projectRoot, "src", "features", featureName, "feather.yaml"),
    path.join(projectRoot, "src", "features", featureName, `${featureName}.gen.yaml`),
  ];

  const yamlPath = yamlPaths.find((p) => fs.existsSync(p));
  if (!yamlPath) {
    warnings.push(
      `No feather.yaml or .gen.yaml found for ${featureName}. Create one before migrating.`,
    );
    return { generatedFiles, customFiles, unchangedFiles, warnings };
  }

  // Validate YAML
  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const validation = validateFeatureYaml(yamlContent);
  if (!validation.success) {
    warnings.push(
      `YAML validation failed for ${featureName}: ${validation.errors.map((e) => e.message).join(", ")}`,
    );
    return { generatedFiles, customFiles, unchangedFiles, warnings };
  }

  // Discover existing files
  const files = discoverFeatureFiles(featureName, projectRoot);

  // Classify files
  for (const file of files) {
    const content = fs.readFileSync(file.absolutePath, "utf-8");

    if (file.category === "config") {
      unchangedFiles.push(file.relativePath);
      continue;
    }

    if (isLikelyGenerated(content)) {
      generatedFiles.push(file.relativePath);
    } else {
      // Assume customized — keep in custom/
      customFiles.push(file.relativePath);
    }
  }

  if (!dryRun) {
    // Create generated/ directories
    const genFrontend = path.join(
      projectRoot,
      "src",
      "generated",
      featureName,
    );
    const genBackend = path.join(
      projectRoot,
      "convex",
      "generated",
      featureName,
    );
    fs.mkdirSync(genFrontend, { recursive: true });
    fs.mkdirSync(genBackend, { recursive: true });

    // Create custom/ directories if needed
    if (customFiles.length > 0) {
      const customFrontend = path.join(
        projectRoot,
        "src",
        "custom",
        featureName,
      );
      fs.mkdirSync(customFrontend, { recursive: true });
    }

    // Move files to appropriate directories
    for (const file of files) {
      if (file.category === "config") continue;

      const content = fs.readFileSync(file.absolutePath, "utf-8");

      if (isLikelyGenerated(content)) {
        // Copy to generated/
        const destDir =
          file.category === "backend" ? genBackend : genFrontend;
        const destPath = path.join(
          destDir,
          path.basename(file.absolutePath),
        );
        fs.copyFileSync(file.absolutePath, destPath);
      }
    }
  }

  return { generatedFiles, customFiles, unchangedFiles, warnings };
}
