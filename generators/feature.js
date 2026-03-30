/**
 * Unified gen:feature generator (D-01).
 * Generates a full CRUD feature from YAML definition or interactive wizard.
 * Produces: Zod schema, Convex backend (mutations + queries + tests),
 * frontend components (page, views, form, item, etc.), route, locales,
 * and auto-wires all shared files.
 *
 * When FEATHER_USE_PIPELINE !== "false", the pipeline (templates/pipeline/generate.ts)
 * handles rendering + wiring. The old Plop actions are kept as fallback.
 *
 * @typedef {import('./utils/types.ts').FeatureConfig} FeatureConfig
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  loadFeatureYaml,
  resolveDefaults,
  writeResolvedYaml,
} from "./utils/yaml-resolver.js";

/**
 * Whether to use the pipeline for code generation.
 * Set FEATHER_USE_PIPELINE=false to fall back to old Plop actions.
 */
const usePipeline = process.env.FEATHER_USE_PIPELINE !== "false";

/**
 * Parse Rails-style field definitions (D-08).
 * Format: "name:string, status:enum(active,on_hold), description:text?"
 * @param {string} raw - Raw field string from interactive wizard
 * @returns {Record<string, Record<string, unknown>>} Parsed fields object
 */
function parseFieldsRaw(raw) {
  if (!raw || !raw.trim()) return {};

  /** @type {Record<string, Record<string, unknown>>} */
  const fields = {};

  const fieldDefs = raw.split(",").map((s) => s.trim()).filter(Boolean);

  for (const def of fieldDefs) {
    let [fieldName, typePart] = def.split(":").map((s) => s.trim());
    if (!typePart) typePart = "string";

    const isOptional = typePart.endsWith("?");
    if (isOptional) typePart = typePart.slice(0, -1);

    /** @type {Record<string, unknown>} */
    const fieldConfig = {};

    // Parse enum values: enum(val1,val2,val3)
    const enumMatch = typePart.match(/^enum\(([^)]+)\)$/);
    if (enumMatch) {
      fieldConfig.type = "enum";
      fieldConfig.values = enumMatch[1].split(",").map((v) => v.trim());
    } else {
      fieldConfig.type = typePart;
    }

    if (isOptional) {
      fieldConfig.required = false;
    }

    fields[fieldName] = fieldConfig;
  }

  return fields;
}

/**
 * Pascal case helper (simple version for interactive mode).
 * @param {string} str
 * @returns {string}
 */
function pascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

/**
 * Build the list of smartAdd actions for all feature files (legacy fallback).
 * @param {FeatureConfig} config - Resolved feature config
 * @returns {Array<Record<string, unknown>>}
 */
function buildActions(config) {
  const actions = [];
  const name = config.name;

  // ─── Schema ──────────────────────────────────────────────────────
  actions.push({
    type: "smartAdd",
    path: "src/shared/schemas/{{name}}.ts",
    templateFile: "templates/feature/schema.ts.hbs",
  });

  // ─── Backend ─────────────────────────────────────────────────────
  actions.push({
    type: "smartAdd",
    path: "convex/{{name}}/mutations.ts",
    templateFile: "templates/feature/mutations.ts.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "convex/{{name}}/queries.ts",
    templateFile: "templates/feature/queries.ts.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "convex/{{name}}/mutations.test.ts",
    templateFile: "templates/feature/mutations.test.ts.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "convex/{{name}}/queries.test.ts",
    templateFile: "templates/feature/queries.test.ts.hbs",
  });

  // ─── Frontend components ─────────────────────────────────────────
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}Page.tsx",
    templateFile: "templates/feature/page.tsx.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}TitleBar.tsx",
    templateFile: "templates/feature/title-bar.tsx.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}Item.tsx",
    templateFile: "templates/feature/item.tsx.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}Form.tsx",
    templateFile: "templates/feature/form.tsx.hbs",
  });

  // ListView always generated
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}ListView.tsx",
    templateFile: "templates/feature/list-view.tsx.hbs",
  });

  // Conditional views based on enabledViews
  const enabledViews = config.views?.default?.enabledViews || ["list"];

  if (enabledViews.includes("card")) {
    actions.push({
      type: "smartAdd",
      path: "src/features/{{name}}/components/{{pascalCase name}}CardView.tsx",
      templateFile: "templates/feature/card-view.tsx.hbs",
    });
  }

  if (enabledViews.includes("table")) {
    actions.push({
      type: "smartAdd",
      path: "src/features/{{name}}/components/{{pascalCase name}}TableView.tsx",
      templateFile: "templates/feature/table-view.tsx.hbs",
    });
  }

  // Detail page
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}DetailPage.tsx",
    templateFile: "templates/feature/detail-page.tsx.hbs",
  });

  // StatusBadge (if any enum field exists)
  const hasEnum = Object.values(config.fields || {}).some(
    (f) => f.type === "enum",
  );
  if (hasEnum) {
    actions.push({
      type: "smartAdd",
      path: "src/features/{{name}}/components/{{pascalCase name}}StatusBadge.tsx",
      templateFile: "templates/feature/status-badge.tsx.hbs",
    });
  }

  // ViewSwitcher (if multiple views enabled)
  if (enabledViews.length > 1) {
    actions.push({
      type: "smartAdd",
      path: "src/features/{{name}}/components/{{pascalCase name}}ViewSwitcher.tsx",
      templateFile: "templates/feature/view-switcher.tsx.hbs",
    });
  }

  // FilterBar (if any filterable field or filtered views)
  const hasFilterable = Object.values(config.fields || {}).some(
    (f) => f.filterable || f.type === "enum",
  );
  const hasFilteredViews =
    config.views?.filteredViews && config.views.filteredViews.length > 0;
  if (hasFilterable || hasFilteredViews) {
    actions.push({
      type: "smartAdd",
      path: "src/features/{{name}}/components/{{pascalCase name}}FilterBar.tsx",
      templateFile: "templates/feature/filter-bar.tsx.hbs",
    });
  }

  // EmptyState and LoadingSkeleton always
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}EmptyState.tsx",
    templateFile: "templates/feature/empty-state.tsx.hbs",
  });
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/components/{{pascalCase name}}LoadingSkeleton.tsx",
    templateFile: "templates/feature/loading-skeleton.tsx.hbs",
  });

  // Barrel export
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/index.ts",
    templateFile: "templates/feature/index.ts.hbs",
  });

  // Frontend test
  actions.push({
    type: "smartAdd",
    path: "src/features/{{name}}/{{name}}.test.tsx",
    templateFile: "templates/feature/test.tsx.hbs",
  });

  // Route
  actions.push({
    type: "smartAdd",
    path: "src/routes/_app/_auth/dashboard/_layout.{{name}}.tsx",
    templateFile: "templates/feature/route.tsx.hbs",
  });

  // ─── Auto-wiring (Step 5) ───────────────────────────────────────
  actions.push({ type: "appendToSchema" });
  actions.push({ type: "appendToNav" });
  actions.push({ type: "appendToErrors" });
  actions.push({ type: "appendToI18n" });
  actions.push({ type: "createLocales" });

  return actions;
}

/**
 * Build a pipeline-based action list.
 * Writes feather.yaml to the feature directory, then calls generateFeature()
 * from the pipeline. This is the unified path for both interactive and YAML modes.
 *
 * @param {FeatureConfig} config - Resolved feature config
 * @param {string} yamlPath - Path to the feather.yaml file
 * @returns {Array<Record<string, unknown>>}
 */
function buildPipelineActions(config, yamlPath) {
  return [
    {
      type: "pipelineGenerate",
      yamlPath,
      featureName: config.name,
    },
  ];
}

/**
 * Feature generator definition for Plop.
 * @param {import('plop').NodePlopAPI} plop
 * @returns {import('plop').PlopGeneratorConfig}
 */
export default function featureGenerator(plop) {
  // Register the pipeline action type
  plop.setActionType("pipelineGenerate", async (answers, config) => {
    const { generateFeature } = await import(
      "../templates/pipeline/generate.ts"
    );
    const projectRoot = process.cwd();
    const result = await generateFeature({
      yamlPath: config.yamlPath,
      projectRoot,
      outputMode: "legacy",
    });

    if (!result.success) {
      throw new Error(`Pipeline generation failed: ${result.errors.join("; ")}`);
    }

    return `Pipeline generated ${result.scaffolded.files.length} files for ${result.featureName}`;
  });

  return {
    description: "Generate a full CRUD feature from YAML definition",
    prompts: [
      {
        type: "input",
        name: "yamlPath",
        message: "Path to feature YAML (leave empty for interactive wizard):",
        default: "",
      },
      // Interactive wizard prompts (only when no YAML path provided)
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case, e.g. projects):",
        when: (answers) => !answers.yamlPath,
        validate: (v) =>
          /^[a-z][a-z0-9-]*$/.test(v) || "Use kebab-case (e.g. projects)",
      },
      {
        type: "input",
        name: "label",
        message: "Singular label (e.g. Project):",
        when: (answers) => !answers.yamlPath,
        default: (answers) => pascalCase(answers.name),
      },
      {
        type: "input",
        name: "labelPlural",
        message: "Plural label (e.g. Projects):",
        when: (answers) => !answers.yamlPath,
        default: (answers) => answers.label + "s",
      },
      {
        type: "editor",
        name: "fieldsRaw",
        message:
          "Define fields (Rails-style: name:string, status:enum(active,on_hold), description:text?):",
        when: (answers) => !answers.yamlPath,
      },
    ],
    actions: (data) => {
      /** @type {Record<string, unknown>} */
      let featureConfig;
      let yamlFullPath;

      if (data.yamlPath) {
        // Load from YAML file
        yamlFullPath = path.resolve(process.cwd(), data.yamlPath);
        featureConfig = loadFeatureYaml(yamlFullPath);
      } else {
        // Build from interactive wizard answers
        featureConfig = {
          name: data.name,
          label: data.label,
          labelPlural: data.labelPlural,
          fields: parseFieldsRaw(data.fieldsRaw),
        };

        // Write the feather.yaml for future re-runs and pipeline consumption
        const yamlDir = path.resolve(
          process.cwd(),
          `src/features/${data.name}`,
        );
        fs.mkdirSync(yamlDir, { recursive: true });
        yamlFullPath = path.join(yamlDir, "feather.yaml");
        writeResolvedYaml(featureConfig, yamlFullPath);

        // Also write the gen.yaml for backward compatibility
        writeResolvedYaml(
          featureConfig,
          path.join(yamlDir, `${data.name}.gen.yaml`),
        );
      }

      // Resolve defaults
      const resolved = resolveDefaults(featureConfig);

      // Write resolved YAML for transparency (D-06)
      const resolvedPath = path.resolve(
        process.cwd(),
        `src/features/${resolved.name}/${resolved.name}.resolved.yaml`,
      );
      writeResolvedYaml(resolved, resolvedPath);

      // Spread resolved config into data so templates can access all fields
      Object.assign(data, resolved);

      if (usePipeline) {
        // Pipeline path: single generateFeature() call handles rendering + wiring
        return buildPipelineActions(resolved, yamlFullPath);
      }

      // Legacy fallback: individual Plop actions
      return buildActions(resolved);
    },
  };
}
