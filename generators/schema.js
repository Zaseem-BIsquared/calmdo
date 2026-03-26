/**
 * Standalone gen:schema generator (D-02).
 * Generates only the Zod schema file + updates convex/schema.ts.
 *
 * @typedef {import('./utils/types.ts').FeatureConfig} FeatureConfig
 */

import path from "node:path";
import {
  loadFeatureYaml,
  resolveDefaults,
  writeResolvedYaml,
} from "./utils/yaml-resolver.js";

/**
 * Pascal case helper.
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
 * Schema generator definition for Plop.
 * @param {import('plop').NodePlopAPI} plop
 * @returns {import('plop').PlopGeneratorConfig}
 */
export default function schemaGenerator(plop) {
  return {
    description: "Generate a Zod schema and update convex/schema.ts",
    prompts: [
      {
        type: "input",
        name: "yamlPath",
        message: "Path to feature YAML (leave empty for interactive):",
        default: "",
      },
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case, e.g. projects):",
        when: (answers) => !answers.yamlPath,
        validate: (v) =>
          /^[a-z][a-z0-9-]*$/.test(v) || "Use kebab-case",
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
        message: "Define fields (e.g. name:string, status:enum(active,on_hold)):",
        when: (answers) => !answers.yamlPath,
      },
    ],
    actions: (data) => {
      let featureConfig;

      if (data.yamlPath) {
        const yamlFullPath = path.resolve(process.cwd(), data.yamlPath);
        featureConfig = loadFeatureYaml(yamlFullPath);
      } else {
        featureConfig = {
          name: data.name,
          label: data.label,
          labelPlural: data.labelPlural,
          fields: parseFieldsRaw(data.fieldsRaw),
        };
      }

      const resolved = resolveDefaults(featureConfig);
      Object.assign(data, resolved);

      return [
        {
          type: "smartAdd",
          path: "src/shared/schemas/{{name}}.ts",
          templateFile: "templates/feature/schema.ts.hbs",
        },
        { type: "appendToSchema" },
      ];
    },
  };
}

/**
 * Parse Rails-style field definitions.
 * @param {string} raw
 * @returns {Record<string, Record<string, unknown>>}
 */
function parseFieldsRaw(raw) {
  if (!raw || !raw.trim()) return {};
  const fields = {};

  for (const def of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    let [fieldName, typePart] = def.split(":").map((s) => s.trim());
    if (!typePart) typePart = "string";

    const isOptional = typePart.endsWith("?");
    if (isOptional) typePart = typePart.slice(0, -1);

    const fieldConfig = {};
    const enumMatch = typePart.match(/^enum\(([^)]+)\)$/);
    if (enumMatch) {
      fieldConfig.type = "enum";
      fieldConfig.values = enumMatch[1].split(",").map((v) => v.trim());
    } else {
      fieldConfig.type = typePart;
    }

    if (isOptional) fieldConfig.required = false;
    fields[fieldName] = fieldConfig;
  }

  return fields;
}
