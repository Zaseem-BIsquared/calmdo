/**
 * Standalone gen:frontend generator (D-02).
 * Generates all frontend components, route, i18n, nav wiring.
 * Requires an existing YAML definition.
 *
 * @typedef {import('./utils/types.ts').FeatureConfig} FeatureConfig
 */

import path from "node:path";
import {
  loadFeatureYaml,
  resolveDefaults,
} from "./utils/yaml-resolver.js";

/**
 * Frontend generator definition for Plop.
 * @param {import('plop').NodePlopAPI} plop
 * @returns {import('plop').PlopGeneratorConfig}
 */
export default function frontendGenerator(plop) {
  return {
    description:
      "Generate frontend components, route, and wiring from YAML",
    prompts: [
      {
        type: "input",
        name: "yamlPath",
        message:
          "Path to feature YAML (e.g. src/features/projects/projects.gen.yaml):",
        validate: (v) =>
          v && v.trim().length > 0
            ? true
            : "YAML path required for frontend generator",
      },
    ],
    actions: (data) => {
      const yamlFullPath = path.resolve(process.cwd(), data.yamlPath);
      const featureConfig = loadFeatureYaml(yamlFullPath);
      const resolved = resolveDefaults(featureConfig);
      Object.assign(data, resolved);

      const actions = [];
      const enabledViews = resolved.views?.default?.enabledViews || ["list"];

      // Page and core components
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

      // ListView always
      actions.push({
        type: "smartAdd",
        path: "src/features/{{name}}/components/{{pascalCase name}}ListView.tsx",
        templateFile: "templates/feature/list-view.tsx.hbs",
      });

      // Conditional views
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

      // StatusBadge (if any enum)
      const hasEnum = Object.values(resolved.fields || {}).some(
        (f) => f.type === "enum",
      );
      if (hasEnum) {
        actions.push({
          type: "smartAdd",
          path: "src/features/{{name}}/components/{{pascalCase name}}StatusBadge.tsx",
          templateFile: "templates/feature/status-badge.tsx.hbs",
        });
      }

      // ViewSwitcher (multiple views)
      if (enabledViews.length > 1) {
        actions.push({
          type: "smartAdd",
          path: "src/features/{{name}}/components/{{pascalCase name}}ViewSwitcher.tsx",
          templateFile: "templates/feature/view-switcher.tsx.hbs",
        });
      }

      // FilterBar
      const hasFilterable = Object.values(resolved.fields || {}).some(
        (f) => f.filterable || f.type === "enum",
      );
      const hasFilteredViews =
        resolved.views?.filteredViews && resolved.views.filteredViews.length > 0;
      if (hasFilterable || hasFilteredViews) {
        actions.push({
          type: "smartAdd",
          path: "src/features/{{name}}/components/{{pascalCase name}}FilterBar.tsx",
          templateFile: "templates/feature/filter-bar.tsx.hbs",
        });
      }

      // EmptyState and LoadingSkeleton
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

      // Auto-wiring
      actions.push({ type: "appendToNav" });
      actions.push({ type: "appendToErrors" });
      actions.push({ type: "appendToI18n" });
      actions.push({ type: "createLocales" });

      return actions;
    },
  };
}
