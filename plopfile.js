/**
 * Plop.js generators for the Feather Starter Kit.
 *
 * Generators:
 *   npm run gen:feature         -- Generate a full CRUD feature from YAML definition
 *   npm run gen:schema          -- Generate Zod schema + update convex/schema.ts
 *   npm run gen:backend         -- Generate Convex mutations, queries, and tests
 *   npm run gen:frontend        -- Generate frontend components, route, and wiring
 *   npm run gen:route           -- Create a route file (with optional auth guard)
 *   npm run gen:convex-function -- Generate a Convex query/mutation/action
 *
 * gen:form removed (merged into gen:feature per D-03).
 */

import { registerHelpers } from "./generators/utils/handlebars-helpers.js";
import { registerSmartAdd } from "./generators/utils/smart-add.js";
import { registerWiringActions } from "./generators/utils/wiring.js";
import featureGenerator from "./generators/feature.js";
import schemaGenerator from "./generators/schema.js";
import backendGenerator from "./generators/backend.js";
import frontendGenerator from "./generators/frontend.js";

export default function (plop) {
  // ─── Shared infrastructure ─────────────────────────────────────────
  registerHelpers(plop);
  registerSmartAdd(plop);
  registerWiringActions(plop);

  // ─── New modular generators ────────────────────────────────────────
  plop.setGenerator("feature", featureGenerator(plop));
  plop.setGenerator("schema", schemaGenerator(plop));
  plop.setGenerator("backend", backendGenerator(plop));
  plop.setGenerator("frontend", frontendGenerator(plop));

  // ─── Existing generators (unchanged per D-02) ─────────────────────

  plop.setGenerator("route", {
    description: "Create a TanStack Router route file",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Route name (kebab-case, e.g. analytics):",
        validate: (v) =>
          /^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case",
      },
      {
        type: "confirm",
        name: "authRequired",
        message: "Require authentication?",
        default: true,
      },
    ],
    actions: (data) => {
      if (data.authRequired) {
        return [
          {
            type: "add",
            path: "src/routes/_app/_auth/{{name}}.tsx",
            templateFile: "templates/route/route-auth.tsx.hbs",
          },
        ];
      }
      return [
        {
          type: "add",
          path: "src/routes/_app/{{name}}.tsx",
          templateFile: "templates/route/route-public.tsx.hbs",
        },
      ];
    },
  });

  plop.setGenerator("convex-function", {
    description: "Generate a typed Convex query, mutation, or action",
    prompts: [
      {
        type: "input",
        name: "domain",
        message: "Domain folder (e.g. billing, users):",
        validate: (v) =>
          /^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case",
      },
      {
        type: "list",
        name: "type",
        message: "Function type:",
        choices: ["query", "mutation", "action"],
      },
      {
        type: "input",
        name: "name",
        message: "Function name (camelCase, e.g. getByUser):",
        validate: (v) =>
          /^[a-z][a-zA-Z0-9]*$/.test(v) ? true : "Use camelCase",
      },
    ],
    actions: (data) => {
      const typeToFile = {
        query: "queries",
        mutation: "mutations",
        action: "actions",
      };
      return [
        {
          type: "add",
          path: `convex/{{domain}}/${typeToFile[data.type]}.ts`,
          templateFile: `templates/convex-function/{{type}}.ts.hbs`,
          skipIfExists: true,
        },
      ];
    },
  });

  // gen:form REMOVED per D-03 (merged into gen:feature)
}
