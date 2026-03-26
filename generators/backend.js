/**
 * Standalone gen:backend generator (D-02).
 * Generates Convex mutations, queries, and test files.
 * Requires an existing YAML definition (reads from gen.yaml or resolved.yaml).
 *
 * @typedef {import('./utils/types.ts').FeatureConfig} FeatureConfig
 */

import path from "node:path";
import {
  loadFeatureYaml,
  resolveDefaults,
} from "./utils/yaml-resolver.js";

/**
 * Backend generator definition for Plop.
 * @param {import('plop').NodePlopAPI} plop
 * @returns {import('plop').PlopGeneratorConfig}
 */
export default function backendGenerator(plop) {
  return {
    description: "Generate Convex mutations, queries, and tests from YAML",
    prompts: [
      {
        type: "input",
        name: "yamlPath",
        message:
          "Path to feature YAML (e.g. src/features/projects/projects.gen.yaml):",
        validate: (v) =>
          v && v.trim().length > 0
            ? true
            : "YAML path required for backend generator",
      },
    ],
    actions: (data) => {
      const yamlFullPath = path.resolve(process.cwd(), data.yamlPath);
      const featureConfig = loadFeatureYaml(yamlFullPath);
      const resolved = resolveDefaults(featureConfig);
      Object.assign(data, resolved);

      return [
        {
          type: "smartAdd",
          path: "convex/{{name}}/mutations.ts",
          templateFile: "templates/feature/mutations.ts.hbs",
        },
        {
          type: "smartAdd",
          path: "convex/{{name}}/queries.ts",
          templateFile: "templates/feature/queries.ts.hbs",
        },
        {
          type: "smartAdd",
          path: "convex/{{name}}/mutations.test.ts",
          templateFile: "templates/feature/mutations.test.ts.hbs",
        },
        {
          type: "smartAdd",
          path: "convex/{{name}}/queries.test.ts",
          templateFile: "templates/feature/queries.test.ts.hbs",
        },
      ];
    },
  };
}
