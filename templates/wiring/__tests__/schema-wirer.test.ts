import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { wireSchema, unwireSchema } from "../schema-wirer";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

describe("schema-wirer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "schema-wirer-"));
    // Copy real schema.ts to temp dir
    const convexDir = path.join(tempDir, "convex");
    fs.mkdirSync(convexDir, { recursive: true });
    // Create a minimal schema.ts for testing
    fs.writeFileSync(
      path.join(convexDir, "schema.ts"),
      `import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
  }),
});

export default schema;
`,
    );
    // Create a minimal tsconfig for ts-morph
    fs.writeFileSync(
      path.join(convexDir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          skipLibCheck: true,
        },
        include: ["./**/*.ts"],
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("wires a new feature into schema.ts", () => {
    wireSchema(
      {
        featureName: "widgets",
        tableName: "widgets",
        importPath: "./generated/widgets/schema.fragment",
        importName: "widgetsTable",
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    expect(content).toContain("widgetsTable");
    expect(content).toContain("./generated/widgets/schema.fragment");
    expect(content).toContain("widgets: widgetsTable");
  });

  it("is idempotent — wiring twice produces no duplicates", () => {
    const config = {
      featureName: "widgets",
      tableName: "widgets",
      importPath: "./generated/widgets/schema.fragment",
      importName: "widgetsTable",
    };

    wireSchema(config, tempDir);
    wireSchema(config, tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    const importCount = (
      content.match(/widgetsTable/g) || []
    ).length;
    // One in import, one in defineSchema — exactly 2
    expect(importCount).toBe(2);
  });

  it("unwires a feature from schema.ts", () => {
    wireSchema(
      {
        featureName: "widgets",
        tableName: "widgets",
        importPath: "./generated/widgets/schema.fragment",
        importName: "widgetsTable",
      },
      tempDir,
    );

    unwireSchema("widgets", tempDir);

    const content = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    expect(content).not.toContain("widgetsTable");
    expect(content).not.toContain("widgets:");
  });

  it("adds property after authTables spread", () => {
    wireSchema(
      {
        featureName: "orders",
        tableName: "orders",
        importPath: "./generated/orders/schema.fragment",
        importName: "ordersTable",
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    const authIdx = content.indexOf("...authTables");
    const ordersIdx = content.indexOf("orders: ordersTable");
    expect(authIdx).toBeLessThan(ordersIdx);
  });

  it("wires multiple features correctly", () => {
    wireSchema(
      {
        featureName: "orders",
        tableName: "orders",
        importPath: "./orders",
        importName: "ordersTable",
      },
      tempDir,
    );
    wireSchema(
      {
        featureName: "products",
        tableName: "products",
        importPath: "./products",
        importName: "productsTable",
      },
      tempDir,
    );

    const content = fs.readFileSync(
      path.join(tempDir, "convex", "schema.ts"),
      "utf-8",
    );
    expect(content).toContain("orders: ordersTable");
    expect(content).toContain("products: productsTable");
  });
});
