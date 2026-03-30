import { describe, it, expect } from "vitest";
import { generateErDiagram, generateEntitySummary } from "../mermaid-generator";
import type { EntityDraft } from "../conversation-state";

// ── Fixtures ───────────────────────────────────────────────────────────────

const singleEntity: EntityDraft = {
  name: "tasks",
  label: "Task",
  labelPlural: "Tasks",
  description: "A task",
  fields: {
    title: { type: "string", required: true },
    status: { type: "enum", values: ["todo", "done"] },
    priority: { type: "boolean" },
  },
  relationships: [],
};

const parentChild: EntityDraft[] = [
  {
    name: "projects",
    label: "Project",
    labelPlural: "Projects",
    description: "A project",
    fields: {
      name: { type: "string", required: true },
      status: { type: "enum", values: ["active", "archived"] },
    },
    relationships: [],
  },
  {
    name: "tasks",
    label: "Task",
    labelPlural: "Tasks",
    description: "A task",
    fields: {
      title: { type: "string" },
      description: { type: "text" },
    },
    relationships: [
      { type: "belongs_to", target: "projects", required: false, column: "projectId" },
    ],
  },
  {
    name: "subtasks",
    label: "Subtask",
    labelPlural: "Subtasks",
    description: "A subtask",
    fields: {
      title: { type: "string" },
      done: { type: "boolean" },
    },
    relationships: [
      { type: "belongs_to", target: "tasks", required: true, column: "taskId" },
    ],
  },
];

const calmDoEntities: EntityDraft[] = [
  ...parentChild,
  {
    name: "work-logs",
    label: "Work Log",
    labelPlural: "Work Logs",
    description: "Time entry",
    fields: {
      body: { type: "text" },
      minutes: { type: "number" },
    },
    relationships: [
      { type: "belongs_to", target: "tasks", required: true, column: "taskId" },
    ],
  },
  {
    name: "activity-logs",
    label: "Activity Log",
    labelPlural: "Activity Logs",
    description: "Audit trail",
    fields: {
      entityType: { type: "string" },
      action: { type: "enum", values: ["created", "updated", "deleted"] },
    },
    relationships: [],
  },
];

// ── generateErDiagram ──────────────────────────────────────────────────────

describe("generateErDiagram", () => {
  it("should produce valid erDiagram with the keyword at the start", () => {
    const result = generateErDiagram([singleEntity]);
    expect(result).toMatch(/^erDiagram/);
  });

  it("should produce empty diagram for empty entities", () => {
    const result = generateErDiagram([]);
    expect(result).toBe("erDiagram");
  });

  it("should include entity with fields in UPPER_CASE", () => {
    const result = generateErDiagram([singleEntity]);
    expect(result).toContain("TASKS {");
    expect(result).toContain("string title");
    expect(result).toContain("enum status");
    expect(result).toContain("bool priority");
  });

  it("should render belongs_to as parent -> child relationship", () => {
    const result = generateErDiagram(parentChild);
    expect(result).toContain("PROJECTS ||--o{ TASKS : has");
  });

  it("should use ||--|| for required relationships", () => {
    const result = generateErDiagram(parentChild);
    // subtasks -> tasks is required
    expect(result).toContain("TASKS ||--|| SUBTASKS : has");
  });

  it("should handle multiple entities with CalmDo-like graph", () => {
    const result = generateErDiagram(calmDoEntities);
    expect(result).toContain("PROJECTS");
    expect(result).toContain("TASKS");
    expect(result).toContain("SUBTASKS");
    expect(result).toContain("WORK_LOGS");
    expect(result).toContain("ACTIVITY_LOGS");
  });

  it("should convert kebab-case names to UPPER_SNAKE_CASE", () => {
    const result = generateErDiagram(calmDoEntities);
    expect(result).toContain("WORK_LOGS");
    expect(result).toContain("ACTIVITY_LOGS");
  });

  it("should map all field types correctly", () => {
    const entity: EntityDraft = {
      name: "types-test",
      label: "Test",
      labelPlural: "Tests",
      description: "d",
      fields: {
        a: { type: "string" },
        b: { type: "text" },
        c: { type: "number" },
        d: { type: "boolean" },
        e: { type: "enum", values: ["x"] },
        f: { type: "date" },
        g: { type: "reference" },
        h: { type: "email" },
        i: { type: "url" },
        j: { type: "currency" },
        k: { type: "percentage" },
      },
      relationships: [],
    };
    const result = generateErDiagram([entity]);
    expect(result).toContain("string a");
    expect(result).toContain("text b");
    expect(result).toContain("int c");
    expect(result).toContain("bool d");
    expect(result).toContain("enum e");
    expect(result).toContain("date f");
    expect(result).toContain("ref g");
    expect(result).toContain("string h"); // email -> string
    expect(result).toContain("string i"); // url -> string
    expect(result).toContain("decimal j"); // currency -> decimal
    expect(result).toContain("int k"); // percentage -> int
  });
});

// ── generateEntitySummary ──────────────────────────────────────────────────

describe("generateEntitySummary", () => {
  it("should return correct counts for single entity", () => {
    const result = generateEntitySummary([singleEntity]);
    expect(result).toBe("1 entity, 3 fields, 0 relationships");
  });

  it("should handle plural forms", () => {
    const result = generateEntitySummary(parentChild);
    expect(result).toContain("3 entities");
    expect(result).toContain("relationships");
  });

  it("should count CalmDo entities correctly", () => {
    const result = generateEntitySummary(calmDoEntities);
    expect(result).toContain("5 entities");
  });

  it("should handle empty entities", () => {
    const result = generateEntitySummary([]);
    expect(result).toBe("0 entities, 0 fields, 0 relationships");
  });
});
