import { describe, test, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  stripToBase,
  stripFeatureDirectories,
  stripSchemaFile,
  stripNavFile,
  stripErrorsFile,
  stripI18nFile,
} from "./strip-to-base";
import { defaultStripConfig } from "./strip-config";

// ── Test fixtures ───────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "strip-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Create a minimal project structure that mirrors real project layout. */
function createMinimalProject(root: string): void {
  // Feature frontend directories
  for (const feature of [
    "tasks",
    "projects",
    "subtasks",
    "work-logs",
    "activity-logs",
    "todos",
    "tickets",
    "contacts",
  ]) {
    fs.mkdirSync(path.join(root, "src/features", feature, "components"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, "src/features", feature, "index.ts"),
      `export const ${feature} = true;\n`,
    );
  }

  // Infrastructure frontend directories (should be kept)
  for (const infra of [
    "auth",
    "dashboard",
    "onboarding",
    "settings",
    "uploads",
  ]) {
    fs.mkdirSync(path.join(root, "src/features", infra, "components"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(root, "src/features", infra, "index.ts"),
      `export const ${infra} = true;\n`,
    );
  }

  // Feature backend directories
  const backendNames = [
    "tasks",
    "projects",
    "subtasks",
    "workLogs",
    "activityLogs",
    "todos",
    "tickets",
    "contacts",
  ];
  for (const backend of backendNames) {
    fs.mkdirSync(path.join(root, "convex", backend), { recursive: true });
    fs.writeFileSync(
      path.join(root, "convex", backend, "mutations.ts"),
      `export const ${backend} = true;\n`,
    );
  }

  // Infrastructure backend directories (should be kept)
  for (const infra of ["auth", "users", "devEmails", "otp", "password"]) {
    fs.mkdirSync(path.join(root, "convex", infra), { recursive: true });
    fs.writeFileSync(
      path.join(root, "convex", infra, "index.ts"),
      `export const ${infra} = true;\n`,
    );
  }

  // Schema files
  fs.mkdirSync(path.join(root, "src/shared/schemas"), { recursive: true });
  for (const schema of [
    "tasks",
    "projects",
    "subtasks",
    "work-logs",
    "activity-logs",
    "todos",
    "tickets",
    "contacts",
  ]) {
    fs.writeFileSync(
      path.join(root, "src/shared/schemas", `${schema}.ts`),
      `export const ${schema} = true;\n`,
    );
  }
  // username.ts should be kept
  fs.writeFileSync(
    path.join(root, "src/shared/schemas", "username.ts"),
    `export const username = true;\n`,
  );

  // Route files
  fs.mkdirSync(
    path.join(root, "src/routes/_app/_auth/dashboard"),
    { recursive: true },
  );
  const routeFiles = [
    "_layout.tsx",
    "_layout.index.tsx",
    "_layout.tasks.tsx",
    "_layout.team-pool.tsx",
    "_layout.projects.index.tsx",
    "_layout.projects.$projectId.tsx",
    "_layout.todos.tsx",
    "_layout.tickets.tsx",
    "_layout.contacts.tsx",
    "_layout.settings.tsx",
  ];
  for (const route of routeFiles) {
    fs.writeFileSync(
      path.join(root, "src/routes/_app/_auth/dashboard", route),
      `export default function() { return null; }\n`,
    );
  }

  // Locale files
  for (const lang of ["en", "es"]) {
    fs.mkdirSync(path.join(root, "public/locales", lang), { recursive: true });
    for (const ns of [
      "common",
      "auth",
      "dashboard",
      "tasks",
      "projects",
      "subtasks",
      "work-logs",
      "activity-logs",
      "todos",
      "tickets",
      "contacts",
    ]) {
      fs.writeFileSync(
        path.join(root, "public/locales", lang, `${ns}.json`),
        `{ "nav": { "${ns}": "${ns}" } }\n`,
      );
    }
  }

  // Schema.ts (wiring file)
  fs.writeFileSync(
    path.join(root, "convex/schema.ts"),
    `import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { zodToConvex } from "convex-helpers/server/zod4";
import { taskStatus, taskVisibility } from "../src/shared/schemas/tasks";
import { projectStatus } from "../src/shared/schemas/projects";
import { subtaskStatus } from "../src/shared/schemas/subtasks";
import { activityLogEntityType, activityLogAction } from "../src/shared/schemas/activity-logs";
import { status as tickets_status, priority as tickets_priority } from "../src/shared/schemas/tickets";
import { status as contacts_status } from "../src/shared/schemas/contacts";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("email", ["email"]),
  tasks: defineTable({
    title: v.string(),
    status: zodToConvex(taskStatus),
    visibility: zodToConvex(taskVisibility),
    creatorId: v.id("users"),
  })
    .index("by_creator", ["creatorId"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["status"],
    }),
  projects: defineTable({
    name: v.string(),
    status: zodToConvex(projectStatus),
    creatorId: v.id("users"),
  })
    .index("by_creator", ["creatorId"]),
  devEmails: defineTable({
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
    sentAt: v.number(),
  }).index("sentAt", ["sentAt"]),
  subtasks: defineTable({
    title: v.string(),
    status: zodToConvex(subtaskStatus),
    taskId: v.id("tasks"),
    creatorId: v.id("users"),
  })
    .index("by_task", ["taskId"]),
  workLogs: defineTable({
    body: v.string(),
    taskId: v.id("tasks"),
    creatorId: v.id("users"),
  })
    .index("by_task", ["taskId"]),
  activityLogs: defineTable({
    entityType: zodToConvex(activityLogEntityType),
    entityId: v.string(),
    action: zodToConvex(activityLogAction),
    actor: v.id("users"),
  })
    .index("by_entity", ["entityType", "entityId"]),
  todos: defineTable({
    title: v.string(),
    completed: v.optional(v.boolean()),
    userId: v.id("users"),
  })
    .index("by_userId", ["userId"]),
  tickets: defineTable({
    title: v.string(),
    status: zodToConvex(tickets_status),
    priority: zodToConvex(tickets_priority),
    userId: v.id("users"),
  })
    .index("by_userId", ["userId"]),
  contacts: defineTable({
    name: v.string(),
    status: zodToConvex(contacts_status),
    userId: v.id("users"),
  })
    .index("by_userId", ["userId"]),
});

export default schema;
`,
  );

  // Nav.ts (wiring file)
  fs.writeFileSync(
    path.join(root, "src/shared/nav.ts"),
    `export interface NavItem {
  label: string;
  i18nKey: string;
  to: string;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    i18nKey: "dashboard.nav.dashboard",
    to: "/dashboard",
  },
  {
    label: "My Tasks",
    i18nKey: "tasks.nav.myTasks",
    to: "/dashboard/tasks",
  },
  {
    label: "Team Pool",
    i18nKey: "tasks.nav.teamPool",
    to: "/dashboard/team-pool",
  },
  {
    label: "Projects",
    i18nKey: "projects.nav.projects",
    to: "/dashboard/projects",
  },
  {
    label: "Todos",
    i18nKey: "todos.nav.todos",
    to: "/dashboard/todos",
  },
  {
    label: "Tickets",
    i18nKey: "tickets.nav.tickets",
    to: "/dashboard/tickets",
  },
  {
    label: "Contacts",
    i18nKey: "contacts.nav.contacts",
    to: "/dashboard/contacts",
  },
  {
    label: "Settings",
    i18nKey: "dashboard.nav.settings",
    to: "/dashboard/settings",
  },
];
`,
  );

  // Errors.ts (wiring file)
  fs.writeFileSync(
    path.join(root, "src/shared/errors.ts"),
    `export const ERRORS = {
  auth: {
    EMAIL_NOT_SENT: "Unable to send email.",
  },
  common: {
    UNKNOWN: "Unknown error.",
  },
  tasks: {
    NOT_FOUND: "Task not found.",
  },
  projects: {
    NOT_FOUND: "Project not found.",
  },
  subtasks: {
    NOT_FOUND: "Subtask not found.",
  },
  workLogs: {
    NOT_FOUND: "Work log not found.",
  },
  activityLogs: {
    NOT_FOUND: "Activity log not found.",
  },
  todos: {
    NOT_FOUND: "Todo not found.",
  },
  tickets: {
    NOT_FOUND: "Ticket not found.",
  },
  contacts: {
    NOT_FOUND: "Contact not found.",
  },
} as const;
`,
  );

  // i18n.ts (wiring file)
  fs.writeFileSync(
    path.join(root, "src/i18n.ts"),
    `const ns = ["common", "auth", "dashboard", "settings", "onboarding", "tasks", "projects", "subtasks", "work-logs", "activity-logs", "todos", "tickets", "contacts"];
export default ns;
`,
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("stripFeatureDirectories", () => {
  test("should delete all feature frontend directories", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    for (const feature of defaultStripConfig.features) {
      expect(
        fs.existsSync(path.join(tmpDir, "src/features", feature)),
      ).toBe(false);
    }
  });

  test("should keep infrastructure frontend directories", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    for (const infra of defaultStripConfig.infraFeatures) {
      expect(
        fs.existsSync(path.join(tmpDir, "src/features", infra)),
      ).toBe(true);
    }
  });

  test("should delete all feature backend directories", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    for (const feature of defaultStripConfig.features) {
      const backendName =
        defaultStripConfig.backendDirMap[feature] ?? feature;
      expect(
        fs.existsSync(path.join(tmpDir, "convex", backendName)),
      ).toBe(false);
    }
  });

  test("should keep infrastructure backend directories", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    for (const infra of ["auth", "users", "devEmails", "otp", "password"]) {
      expect(
        fs.existsSync(path.join(tmpDir, "convex", infra)),
      ).toBe(true);
    }
  });

  test("should remove feature route files", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    const routeDir = path.join(tmpDir, "src/routes/_app/_auth/dashboard");
    // Feature routes should be gone
    expect(fs.existsSync(path.join(routeDir, "_layout.tasks.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(routeDir, "_layout.todos.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(routeDir, "_layout.tickets.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(routeDir, "_layout.contacts.tsx"))).toBe(false);
    // Infrastructure routes should remain
    expect(fs.existsSync(path.join(routeDir, "_layout.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(routeDir, "_layout.settings.tsx"))).toBe(true);
  });

  test("should remove feature schema files from src/shared/schemas/", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    const schemasDir = path.join(tmpDir, "src/shared/schemas");
    for (const feature of defaultStripConfig.features) {
      expect(fs.existsSync(path.join(schemasDir, `${feature}.ts`))).toBe(false);
    }
    // username.ts should remain
    expect(fs.existsSync(path.join(schemasDir, "username.ts"))).toBe(true);
  });

  test("should remove feature locale files", () => {
    createMinimalProject(tmpDir);
    stripFeatureDirectories(tmpDir, defaultStripConfig);

    for (const lang of ["en", "es"]) {
      // Feature locales gone
      expect(
        fs.existsSync(path.join(tmpDir, `public/locales/${lang}/tasks.json`)),
      ).toBe(false);
      expect(
        fs.existsSync(path.join(tmpDir, `public/locales/${lang}/todos.json`)),
      ).toBe(false);
      // Infrastructure locales remain
      expect(
        fs.existsSync(path.join(tmpDir, `public/locales/${lang}/common.json`)),
      ).toBe(true);
      expect(
        fs.existsSync(path.join(tmpDir, `public/locales/${lang}/auth.json`)),
      ).toBe(true);
    }
  });
});

describe("stripSchemaFile", () => {
  test("should remove feature tables from schema.ts", () => {
    createMinimalProject(tmpDir);
    const schemaPath = path.join(tmpDir, "convex/schema.ts");
    stripSchemaFile(schemaPath, defaultStripConfig);

    const result = fs.readFileSync(schemaPath, "utf-8");
    // Feature tables should be gone
    expect(result).not.toMatch(/^\s+tasks:/m);
    expect(result).not.toMatch(/^\s+projects:/m);
    expect(result).not.toMatch(/^\s+subtasks:/m);
    expect(result).not.toMatch(/^\s+workLogs:/m);
    expect(result).not.toMatch(/^\s+activityLogs:/m);
    expect(result).not.toMatch(/^\s+todos:/m);
    expect(result).not.toMatch(/^\s+tickets:/m);
    expect(result).not.toMatch(/^\s+contacts:/m);

    // Infrastructure should remain
    expect(result).toContain("authTables");
    expect(result).toMatch(/^\s+users:/m);
    expect(result).toMatch(/^\s+devEmails:/m);
  });

  test("should remove dangling imports for stripped feature schemas", () => {
    createMinimalProject(tmpDir);
    const schemaPath = path.join(tmpDir, "convex/schema.ts");
    stripSchemaFile(schemaPath, defaultStripConfig);

    const result = fs.readFileSync(schemaPath, "utf-8");
    expect(result).not.toContain("schemas/tasks");
    expect(result).not.toContain("schemas/projects");
    expect(result).not.toContain("schemas/subtasks");
    expect(result).not.toContain("schemas/activity-logs");
    expect(result).not.toContain("schemas/tickets");
    expect(result).not.toContain("schemas/contacts");
  });
});

describe("stripNavFile", () => {
  test("should remove feature nav entries from nav.ts", () => {
    createMinimalProject(tmpDir);
    const navPath = path.join(tmpDir, "src/shared/nav.ts");
    stripNavFile(navPath, defaultStripConfig);

    const result = fs.readFileSync(navPath, "utf-8");
    // Feature nav entries should be gone
    expect(result).not.toContain("/dashboard/tasks");
    expect(result).not.toContain("/dashboard/team-pool");
    expect(result).not.toContain("/dashboard/projects");
    expect(result).not.toContain("/dashboard/todos");
    expect(result).not.toContain("/dashboard/tickets");
    expect(result).not.toContain("/dashboard/contacts");

    // Infrastructure nav entries should remain
    expect(result).toContain('"/dashboard"');
    expect(result).toContain("/dashboard/settings");
  });
});

describe("stripErrorsFile", () => {
  test("should remove feature error groups from errors.ts", () => {
    createMinimalProject(tmpDir);
    const errorsPath = path.join(tmpDir, "src/shared/errors.ts");
    stripErrorsFile(errorsPath, defaultStripConfig);

    const result = fs.readFileSync(errorsPath, "utf-8");
    // Feature error groups should be gone
    expect(result).not.toMatch(/^\s+tasks:/m);
    expect(result).not.toMatch(/^\s+projects:/m);
    expect(result).not.toMatch(/^\s+subtasks:/m);
    expect(result).not.toMatch(/^\s+workLogs:/m);
    expect(result).not.toMatch(/^\s+activityLogs:/m);
    expect(result).not.toMatch(/^\s+todos:/m);
    expect(result).not.toMatch(/^\s+tickets:/m);
    expect(result).not.toMatch(/^\s+contacts:/m);

    // Infrastructure error groups should remain
    expect(result).toMatch(/^\s+auth:/m);
    expect(result).toMatch(/^\s+common:/m);
  });
});

describe("stripI18nFile", () => {
  test("should remove feature namespaces from i18n.ts", () => {
    createMinimalProject(tmpDir);
    const i18nPath = path.join(tmpDir, "src/i18n.ts");
    stripI18nFile(i18nPath, defaultStripConfig);

    const result = fs.readFileSync(i18nPath, "utf-8");
    // Feature namespaces should be gone
    expect(result).not.toContain('"tasks"');
    expect(result).not.toContain('"projects"');
    expect(result).not.toContain('"subtasks"');
    expect(result).not.toContain('"work-logs"');
    expect(result).not.toContain('"activity-logs"');
    expect(result).not.toContain('"todos"');
    expect(result).not.toContain('"tickets"');
    expect(result).not.toContain('"contacts"');

    // Infrastructure namespaces should remain
    expect(result).toContain('"common"');
    expect(result).toContain('"auth"');
    expect(result).toContain('"dashboard"');
    expect(result).toContain('"settings"');
    expect(result).toContain('"onboarding"');
  });
});

describe("stripToBase (full orchestrator)", () => {
  test("should be idempotent — running twice produces same result", async () => {
    createMinimalProject(tmpDir);

    // First strip
    await stripToBase(tmpDir);

    // Capture state after first strip
    const schemaAfterFirst = fs.readFileSync(
      path.join(tmpDir, "convex/schema.ts"),
      "utf-8",
    );
    const navAfterFirst = fs.readFileSync(
      path.join(tmpDir, "src/shared/nav.ts"),
      "utf-8",
    );
    const errorsAfterFirst = fs.readFileSync(
      path.join(tmpDir, "src/shared/errors.ts"),
      "utf-8",
    );

    // Second strip
    await stripToBase(tmpDir);

    // Compare
    expect(fs.readFileSync(path.join(tmpDir, "convex/schema.ts"), "utf-8")).toBe(
      schemaAfterFirst,
    );
    expect(fs.readFileSync(path.join(tmpDir, "src/shared/nav.ts"), "utf-8")).toBe(
      navAfterFirst,
    );
    expect(
      fs.readFileSync(path.join(tmpDir, "src/shared/errors.ts"), "utf-8"),
    ).toBe(errorsAfterFirst);
  });

  test("should handle missing directories gracefully", async () => {
    // Create only wiring files, no feature directories
    fs.mkdirSync(path.join(tmpDir, "convex"), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, "src/shared"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, "convex/schema.ts"),
      `import { defineSchema } from "convex/server";
const schema = defineSchema({});
export default schema;
`,
    );
    fs.writeFileSync(
      path.join(tmpDir, "src/shared/nav.ts"),
      `export const navItems = [];
`,
    );
    fs.writeFileSync(
      path.join(tmpDir, "src/shared/errors.ts"),
      `export const ERRORS = {} as const;
`,
    );

    const result = await stripToBase(tmpDir);
    expect(result.errors).toHaveLength(0);
  });

  test("should return accurate summary", async () => {
    createMinimalProject(tmpDir);
    const result = await stripToBase(tmpDir);

    // Should have deleted feature directories and files
    expect(result.deleted.length).toBeGreaterThan(0);
    // Should have modified wiring files
    expect(result.modified).toContain("convex/schema.ts");
    expect(result.modified).toContain("src/shared/nav.ts");
    expect(result.modified).toContain("src/shared/errors.ts");
    expect(result.modified).toContain("src/i18n.ts");
    // No errors
    expect(result.errors).toHaveLength(0);
  });
});
