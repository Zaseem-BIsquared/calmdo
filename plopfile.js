/**
 * Plop.js generators for the Feather Starter Kit.
 *
 * Generators:
 *   npm run gen:feature        -- Scaffold a full feature (frontend + backend)
 *   npm run gen:route          -- Create a route file (with optional auth guard)
 *   npm run gen:convex-function -- Generate a Convex query/mutation/action
 *   npm run gen:form           -- Generate a Zod schema + TanStack Form component
 */
export default function (plop) {
  // ─── Feature Generator ───────────────────────────────────────────────
  plop.setGenerator("feature", {
    description: "Scaffold a full feature folder (frontend + Convex backend)",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Feature name (kebab-case, e.g. task-list):",
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case (e.g. task-list)"),
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/features/{{name}}/components/{{pascalCase name}}Page.tsx",
        templateFile: "templates/feature/component.tsx.hbs",
      },
      {
        type: "add",
        path: "src/features/{{name}}/hooks/use{{pascalCase name}}.ts",
        templateFile: "templates/feature/hook.ts.hbs",
      },
      {
        type: "add",
        path: "src/features/{{name}}/index.ts",
        templateFile: "templates/feature/index.ts.hbs",
      },
      {
        type: "add",
        path: "src/features/{{name}}/{{name}}.test.tsx",
        templateFile: "templates/feature/test.tsx.hbs",
      },
      {
        type: "add",
        path: "src/features/{{name}}/README.md",
        templateFile: "templates/feature/readme.md.hbs",
      },
      {
        type: "add",
        path: "convex/{{name}}/queries.ts",
        templateFile: "templates/feature/queries.ts.hbs",
      },
      {
        type: "add",
        path: "convex/{{name}}/mutations.ts",
        templateFile: "templates/feature/mutations.ts.hbs",
      },
    ],
  });

  // ─── Route Generator ─────────────────────────────────────────────────
  plop.setGenerator("route", {
    description: "Create a TanStack Router route file",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Route name (kebab-case, e.g. analytics):",
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case"),
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

  // ─── Convex Function Generator ────────────────────────────────────────
  plop.setGenerator("convex-function", {
    description: "Generate a typed Convex query, mutation, or action",
    prompts: [
      {
        type: "input",
        name: "domain",
        message: "Domain folder (e.g. billing, users):",
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case"),
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
        validate: (v) => (/^[a-z][a-zA-Z0-9]*$/.test(v) ? true : "Use camelCase"),
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

  // ─── Form Generator ──────────────────────────────────────────────────
  plop.setGenerator("form", {
    description: "Generate a Zod schema + TanStack Form component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Form name (kebab-case, e.g. create-task):",
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case"),
      },
      {
        type: "input",
        name: "feature",
        message: "Feature folder to place the form component (e.g. dashboard):",
        validate: (v) => (/^[a-z][a-z0-9-]*$/.test(v) ? true : "Use kebab-case"),
      },
    ],
    actions: [
      {
        type: "add",
        path: "src/shared/schemas/{{name}}.ts",
        templateFile: "templates/form/schema.ts.hbs",
      },
      {
        type: "add",
        path: "src/features/{{feature}}/components/{{pascalCase name}}Form.tsx",
        templateFile: "templates/form/form.tsx.hbs",
      },
    ],
  });
}
