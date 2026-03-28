import * as fs from "node:fs";
import * as path from "node:path";
import type { FeatureYaml } from "../schema/feather-yaml.schema";

// ── Scaffold types ───────────────────────────────────────────────────────────

export interface ScaffoldOptions {
  projectRoot: string;
  outputMode: "generated" | "legacy";
  dryRun: boolean;
}

export interface ScaffoldResult {
  files: string[];
  outputDir: string;
}

// ── Output path resolution ───────────────────────────────────────────────────

function resolveFrontendDir(
  name: string,
  projectRoot: string,
  outputMode: "generated" | "legacy",
): string {
  if (outputMode === "generated") {
    return path.join(projectRoot, "src", "generated", name);
  }
  return path.join(projectRoot, "src", "features", name);
}

function resolveBackendDir(
  name: string,
  projectRoot: string,
  outputMode: "generated" | "legacy",
): string {
  if (outputMode === "generated") {
    return path.join(projectRoot, "convex", "generated", name);
  }
  return path.join(projectRoot, "convex", name);
}

// ── Generated file header ────────────────────────────────────────────────────

const GENERATED_HEADER =
  "// @generated — DO NOT EDIT. Customize in src/custom/";

function generatedHeader(featureName: string): string {
  return `${GENERATED_HEADER}${featureName}/\n\n`;
}

// ── File templates (minimal stubs for pipeline verification) ─────────────────
// These will be replaced by Plop Handlebars templates in production.
// For now, they demonstrate the scaffold → wire pipeline structure.

function generateSchemaStub(config: FeatureYaml): string {
  const fieldEntries = Object.entries(config.fields)
    .map(([name, field]) => {
      const fieldType = field.type;
      switch (fieldType) {
        case "string":
        case "text":
        case "email":
        case "url":
          return `  ${name}: v.${field.required ? "" : "optional(v."}string()${field.required ? "" : ")"},`;
        case "number":
        case "currency":
        case "percentage":
          return `  ${name}: v.${field.required ? "" : "optional(v."}number()${field.required ? "" : ")"},`;
        case "boolean":
          return `  ${name}: v.${field.required ? "" : "optional(v."}boolean()${field.required ? "" : ")"},`;
        case "date":
          return `  ${name}: v.${field.required ? "" : "optional(v."}number()${field.required ? "" : ")"},`;
        case "enum":
          return `  ${name}: v.string(),`;
        case "reference":
          return `  ${name}: v.${field.required ? "" : "optional(v."}id("${field.target || "unknown"}")${field.required ? "" : ")"},`;
        default:
          return `  ${name}: v.string(),`;
      }
    })
    .join("\n");

  return `${generatedHeader(config.name)}import { defineTable } from "convex/server";
import { v } from "convex/values";

export const ${config.name}Table = defineTable({
${fieldEntries}
  creatorId: v.id("users"),
});
`;
}

function generateComponentStub(config: FeatureYaml): string {
  const pascalName =
    config.name.charAt(0).toUpperCase() + config.name.slice(1);
  return `${generatedHeader(config.name)}export function ${pascalName}Page() {
  return <div>${config.label} Page</div>;
}
`;
}

function generateBarrelStub(config: FeatureYaml): string {
  const pascalName =
    config.name.charAt(0).toUpperCase() + config.name.slice(1);
  return `${generatedHeader(config.name)}export { ${pascalName}Page } from "./components/${pascalName}Page";
`;
}

function generateMutationsStub(config: FeatureYaml): string {
  return `${generatedHeader(config.name)}// Mutations for ${config.label}
`;
}

function generateQueriesStub(config: FeatureYaml): string {
  return `${generatedHeader(config.name)}// Queries for ${config.label}
`;
}

// ── Main scaffold function ───────────────────────────────────────────────────

export async function scaffoldFeature(
  config: FeatureYaml,
  options: ScaffoldOptions,
): Promise<ScaffoldResult> {
  const frontendDir = resolveFrontendDir(
    config.name,
    options.projectRoot,
    options.outputMode,
  );
  const backendDir = resolveBackendDir(
    config.name,
    options.projectRoot,
    options.outputMode,
  );

  const files: Array<{ path: string; content: string }> = [
    // Backend
    {
      path: path.join(backendDir, "schema.fragment.ts"),
      content: generateSchemaStub(config),
    },
    {
      path: path.join(backendDir, "mutations.ts"),
      content: generateMutationsStub(config),
    },
    {
      path: path.join(backendDir, "queries.ts"),
      content: generateQueriesStub(config),
    },
    // Frontend
    {
      path: path.join(
        frontendDir,
        "components",
        `${config.name.charAt(0).toUpperCase() + config.name.slice(1)}Page.tsx`,
      ),
      content: generateComponentStub(config),
    },
    {
      path: path.join(frontendDir, "index.ts"),
      content: generateBarrelStub(config),
    },
  ];

  if (options.dryRun) {
    return {
      files: files.map((f) => f.path),
      outputDir: frontendDir,
    };
  }

  // Write files
  for (const file of files) {
    const dir = path.dirname(file.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file.path, file.content, "utf-8");
  }

  return {
    files: files.map((f) => f.path),
    outputDir: frontendDir,
  };
}
