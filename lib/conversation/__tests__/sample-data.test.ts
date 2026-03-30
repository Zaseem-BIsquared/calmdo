import { describe, it, expect } from "vitest";
import {
  generateSampleRows,
  generateSampleDataForAll,
  formatSampleTable,
} from "../sample-data";
import type { EntityDraft } from "../conversation-state";

// ── Fixtures ───────────────────────────────────────────────────────────────

const taskEntity: EntityDraft = {
  name: "tasks",
  label: "Task",
  labelPlural: "Tasks",
  description: "A task",
  fields: {
    title: { type: "string", required: true },
    priority: { type: "boolean", default: false },
    status: { type: "enum", values: ["todo", "in_progress", "done"] },
  },
  relationships: [],
};

const allTypesEntity: EntityDraft = {
  name: "mixed",
  label: "Mixed",
  labelPlural: "Mixed Items",
  description: "Entity with all field types",
  fields: {
    name: { type: "string" },
    body: { type: "text" },
    count: { type: "number", min: 10, max: 50 },
    active: { type: "boolean" },
    level: { type: "enum", values: ["low", "medium", "high"] },
    startDate: { type: "date" },
    parentRef: { type: "reference" },
    contactEmail: { type: "email" },
    link: { type: "url" },
    price: { type: "currency" },
    progress: { type: "percentage" },
  },
  relationships: [],
};

// ── generateSampleRows ─────────────────────────────────────────────────────

describe("generateSampleRows", () => {
  it("should generate 3 rows by default", () => {
    const rows = generateSampleRows(taskEntity);
    expect(rows).toHaveLength(3);
  });

  it("should generate the requested number of rows", () => {
    const rows = generateSampleRows(taskEntity, 5);
    expect(rows).toHaveLength(5);
  });

  it("should produce string fields containing entity label", () => {
    const rows = generateSampleRows(taskEntity);
    for (const row of rows) {
      expect(typeof row.title).toBe("string");
      expect(row.title as string).toContain("Task");
    }
  });

  it("should produce boolean fields as booleans", () => {
    const rows = generateSampleRows(taskEntity);
    for (const row of rows) {
      expect(typeof row.priority).toBe("boolean");
    }
  });

  it("should cycle enum values from the values array", () => {
    const rows = generateSampleRows(taskEntity);
    const validValues = new Set(["todo", "in_progress", "done"]);
    for (const row of rows) {
      expect(validValues.has(row.status as string)).toBe(true);
    }
  });

  it("should cycle through enum values in order", () => {
    const entity: EntityDraft = {
      name: "e",
      label: "E",
      labelPlural: "Es",
      description: "d",
      fields: {
        level: { type: "enum", values: ["a", "b", "c"] },
      },
      relationships: [],
    };
    const rows = generateSampleRows(entity, 6);
    expect(rows[0].level).toBe("a");
    expect(rows[1].level).toBe("b");
    expect(rows[2].level).toBe("c");
    expect(rows[3].level).toBe("a"); // cycles
  });

  it("should respect number min/max bounds", () => {
    const rows = generateSampleRows(allTypesEntity);
    for (const row of rows) {
      const count = row.count as number;
      expect(count).toBeGreaterThanOrEqual(10);
      expect(count).toBeLessThanOrEqual(50);
    }
  });

  it("should produce correct types for all field types", () => {
    const rows = generateSampleRows(allTypesEntity);
    const row = rows[0];

    // string
    expect(typeof row.name).toBe("string");
    // text
    expect(typeof row.body).toBe("string");
    expect((row.body as string).length).toBeGreaterThan(20);
    // number
    expect(typeof row.count).toBe("number");
    // boolean
    expect(typeof row.active).toBe("boolean");
    // enum
    expect(["low", "medium", "high"]).toContain(row.level);
    // date — ISO date format YYYY-MM-DD
    expect(row.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // reference
    expect(row.parentRef).toMatch(/^ref_\d{3}$/);
    // email
    expect(row.contactEmail).toMatch(/@example\.com$/);
    // url
    expect(row.link).toMatch(/^https:\/\/example\.com\//);
    // currency
    expect(typeof row.price).toBe("number");
    expect(row.price as number).toBeGreaterThanOrEqual(10);
    // percentage
    expect(typeof row.progress).toBe("number");
    expect(row.progress as number).toBeGreaterThanOrEqual(0);
    expect(row.progress as number).toBeLessThanOrEqual(100);
  });

  it("should produce deterministic output for same input", () => {
    const rows1 = generateSampleRows(allTypesEntity, 3);
    const rows2 = generateSampleRows(allTypesEntity, 3);
    expect(rows1).toEqual(rows2);
  });
});

// ── generateSampleDataForAll ───────────────────────────────────────────────

describe("generateSampleDataForAll", () => {
  it("should produce sample data for each entity", () => {
    const result = generateSampleDataForAll([taskEntity, allTypesEntity]);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["tasks"]).toHaveLength(3);
    expect(result["mixed"]).toHaveLength(3);
  });
});

// ── formatSampleTable ──────────────────────────────────────────────────────

describe("formatSampleTable", () => {
  it("should produce valid markdown table with pipe delimiters", () => {
    const rows = generateSampleRows(taskEntity);
    const table = formatSampleTable("tasks", rows);
    expect(table).toContain("| title |");
    expect(table).toContain("| --- |");
    expect(table.split("\n").filter((line) => line.startsWith("|")).length).toBeGreaterThanOrEqual(4); // header + separator + 3 rows
  });

  it("should truncate values longer than 30 characters", () => {
    const rows = [
      { name: "A".repeat(50) },
    ];
    const table = formatSampleTable("test", rows);
    expect(table).toContain("...");
    expect(table).not.toContain("A".repeat(50));
  });

  it("should handle empty rows", () => {
    const table = formatSampleTable("empty", []);
    expect(table).toContain("No sample data");
  });

  it("should include entity name as heading", () => {
    const rows = generateSampleRows(taskEntity);
    const table = formatSampleTable("tasks", rows);
    expect(table).toContain("### tasks");
  });
});
