import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import YAML from "yaml";
import {
  generateFeatherYaml,
  generateAllYaml,
  writeYamlFiles,
} from "../yaml-generator";
import type {
  EntityDraft,
  BehaviorOverlay,
  ConversationState,
} from "../conversation-state";
import { createConversation } from "../conversation-state";

// ── Fixtures ───────────────────────────────────────────────────────────────

const minimalEntity: EntityDraft = {
  name: "notes",
  label: "Note",
  labelPlural: "Notes",
  description: "A simple note",
  fields: {
    title: { type: "string", required: true },
  },
  relationships: [],
};

const entityWithRelationship: EntityDraft = {
  name: "subtasks",
  label: "Subtask",
  labelPlural: "Subtasks",
  description: "A subtask",
  fields: {
    title: { type: "string", required: true, max: 200 },
    done: { type: "boolean", default: false },
  },
  relationships: [
    { type: "belongs_to", target: "tasks", required: true, column: "taskId" },
  ],
};

const fullEntity: EntityDraft = {
  name: "tasks",
  label: "Task",
  labelPlural: "Tasks",
  description: "A task to track",
  fields: {
    title: { type: "string", required: true, max: 200 },
    description: { type: "text", max: 5000 },
    status: {
      type: "enum",
      values: ["todo", "in_progress", "done"],
      default: "todo",
    },
    priority: { type: "boolean", default: false },
  },
  relationships: [
    { type: "belongs_to", target: "projects", required: false, column: "projectId" },
  ],
};

const fullOverlay: BehaviorOverlay = {
  access: {
    scope: "custom",
    permissions: { create: "authenticated", read: "custom", update: "owner", delete: "owner" },
  },
  hooks: { afterSave: "custom/tasks/hooks/afterSave" },
  derivedData: {
    subtaskCount: { type: "count", source: "subtasks" },
  },
  views: {
    defaultView: "list",
    enabledViews: ["list"],
  },
  behaviors: { assignable: true, orderable: true },
  identity: { type: "auto-increment" },
};

// ── Temp directory for writeYamlFiles ──────────────────────────────────────

let tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "yaml-gen-test-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

// ── generateFeatherYaml (minimal) ──────────────────────────────────────────

describe("generateFeatherYaml", () => {
  it("should produce valid YAML for a minimal entity", () => {
    const yamlStr = generateFeatherYaml(minimalEntity);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.name).toBe("notes");
    expect(parsed.label).toBe("Note");
    expect(parsed.labelPlural).toBe("Notes");
    expect(parsed.fields.title.type).toBe("string");
    expect(parsed.fields.title.required).toBe(true);
  });

  it("should produce valid YAML for entity with relationship", () => {
    const yamlStr = generateFeatherYaml(entityWithRelationship);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.relationships).toBeDefined();
    expect(parsed.relationships.tasks.type).toBe("belongs_to");
    expect(parsed.relationships.tasks.target).toBe("tasks");
    expect(parsed.relationships.tasks.required).toBe(true);
    expect(parsed.relationships.tasks.column).toBe("taskId");
  });

  it("should include overlay sections when provided", () => {
    const yamlStr = generateFeatherYaml(fullEntity, fullOverlay);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.access).toBeDefined();
    expect(parsed.access.scope).toBe("custom");
    expect(parsed.hooks).toBeDefined();
    expect(parsed.hooks.afterSave).toBe("custom/tasks/hooks/afterSave");
    expect(parsed.derivedData).toBeDefined();
    expect(parsed.derivedData.subtaskCount.type).toBe("count");
    expect(parsed.views).toBeDefined();
    expect(parsed.behaviors).toBeDefined();
    expect(parsed.behaviors.assignable).toBe(true);
  });

  it("should set default identity to auto-increment when no overlay", () => {
    const yamlStr = generateFeatherYaml(minimalEntity);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.identity).toEqual({ type: "auto-increment" });
  });

  it("should use overlay identity when provided", () => {
    const overlay: BehaviorOverlay = {
      identity: { type: "expression", format: "TSK-{seq}" },
    };
    const yamlStr = generateFeatherYaml(minimalEntity, overlay);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.identity.type).toBe("expression");
    expect(parsed.identity.format).toBe("TSK-{seq}");
  });

  it("should include enum values in field definitions", () => {
    const yamlStr = generateFeatherYaml(fullEntity);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.fields.status.values).toEqual(["todo", "in_progress", "done"]);
    expect(parsed.fields.status.default).toBe("todo");
  });

  it("should not include empty relationships section when no relationships", () => {
    const yamlStr = generateFeatherYaml(minimalEntity);
    const parsed = YAML.parse(yamlStr);
    expect(parsed.relationships).toBeUndefined();
  });

  it("should handle entity with multiple field types", () => {
    const entity: EntityDraft = {
      name: "mixed",
      label: "Mixed",
      labelPlural: "Mixed Items",
      description: "Mixed field types",
      fields: {
        name: { type: "string", required: true },
        body: { type: "text" },
        count: { type: "number", min: 0, max: 100 },
        active: { type: "boolean" },
        level: { type: "enum", values: ["low", "high"] },
      },
      relationships: [],
    };
    const yamlStr = generateFeatherYaml(entity);
    const parsed = YAML.parse(yamlStr);
    expect(Object.keys(parsed.fields)).toHaveLength(5);
    expect(parsed.fields.count.min).toBe(0);
    expect(parsed.fields.count.max).toBe(100);
  });
});

// ── generateAllYaml ────────────────────────────────────────────────────────

describe("generateAllYaml", () => {
  it("should produce YAML for all entities in conversation state", () => {
    const state = createConversation("test") as ConversationState;
    state.entities = [minimalEntity, entityWithRelationship];
    state.behaviors = {
      subtasks: { behaviors: { orderable: true } },
    };

    const result = generateAllYaml(state);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["notes"]).toBeDefined();
    expect(result["subtasks"]).toBeDefined();

    // Verify subtasks got the behavior overlay
    const subtasksParsed = YAML.parse(result["subtasks"]);
    expect(subtasksParsed.behaviors.orderable).toBe(true);
  });
});

// ── writeYamlFiles ─────────────────────────────────────────────────────────

describe("writeYamlFiles", () => {
  it("should write files to correct paths", () => {
    const temp = createTempDir();
    const yamlMap = {
      tasks: generateFeatherYaml(fullEntity),
      notes: generateFeatherYaml(minimalEntity),
    };
    const paths = writeYamlFiles(temp, yamlMap);

    expect(paths).toHaveLength(2);
    expect(existsSync(join(temp, "src", "features", "tasks", "feather.yaml"))).toBe(true);
    expect(existsSync(join(temp, "src", "features", "notes", "feather.yaml"))).toBe(true);

    // Verify content is valid YAML
    const content = readFileSync(
      join(temp, "src", "features", "tasks", "feather.yaml"),
      "utf-8",
    );
    const parsed = YAML.parse(content);
    expect(parsed.name).toBe("tasks");
  });

  it("should create directories if they don't exist", () => {
    const temp = createTempDir();
    const yamlMap = { "new-entity": generateFeatherYaml(minimalEntity) };
    writeYamlFiles(temp, yamlMap);
    expect(existsSync(join(temp, "src", "features", "new-entity"))).toBe(true);
  });
});
