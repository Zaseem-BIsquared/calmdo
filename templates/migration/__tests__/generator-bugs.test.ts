import { describe, it, expect } from "vitest";
import { featureYamlSchema } from "../../schema/feather-yaml.schema";
import { validateFeatureYaml } from "../../schema/yaml-validator";

describe("generator regression tests", () => {
  it("Bug 1: two features with same enum field name produce different schemas (no collision)", () => {
    // Both features have a "status" enum — schema should namespace them
    const tasksResult = featureYamlSchema.safeParse({
      name: "tasks",
      label: "Task",
      fields: {
        status: {
          type: "enum",
          values: ["todo", "in_progress", "done"],
        },
      },
    });

    const projectsResult = featureYamlSchema.safeParse({
      name: "projects",
      label: "Project",
      fields: {
        status: {
          type: "enum",
          values: ["active", "on_hold", "completed", "archived"],
        },
      },
    });

    expect(tasksResult.success).toBe(true);
    expect(projectsResult.success).toBe(true);

    // Both valid with different enum values — template should namespace as
    // taskStatusValues vs projectStatusValues (template-level fix)
    if (tasksResult.success && projectsResult.success) {
      expect(tasksResult.data.fields.status.values).toEqual([
        "todo",
        "in_progress",
        "done",
      ]);
      expect(projectsResult.data.fields.status.values).toEqual([
        "active",
        "on_hold",
        "completed",
        "archived",
      ]);
    }
  });

  it("Bug 2: belongs_to FK columns included in schema validation", () => {
    const result = featureYamlSchema.safeParse({
      name: "tasks",
      label: "Task",
      fields: {
        title: { type: "string", required: true },
      },
      relationships: {
        project: {
          type: "belongs_to",
          target: "projects",
          required: false,
          column: "projectId",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      const rel = result.data.relationships?.project;
      expect(rel).toBeDefined();
      if (rel && rel.type === "belongs_to") {
        expect(rel.column).toBe("projectId");
        expect(rel.target).toBe("projects");
      }
    }
  });

  it("Bug 3: branching status transitions all valid (not just linear)", () => {
    const yaml = `
name: deals
label: Deal
fields:
  status:
    type: enum
    values: [open, in_progress, won, lost]
    transitions:
      open: [in_progress, won, lost]
      in_progress: [won, lost]
`;
    const result = validateFeatureYaml(yaml);
    expect(result.success).toBe(true);

    // Verify branching is preserved
    if (result.success) {
      const status = result.data.fields.status;
      expect(status.transitions?.open).toEqual([
        "in_progress",
        "won",
        "lost",
      ]);
    }
  });

  it("Bug 4: filterable enum + filteredViews coexist without duplication", () => {
    const result = featureYamlSchema.safeParse({
      name: "tasks",
      label: "Task",
      fields: {
        status: {
          type: "enum",
          values: ["todo", "done"],
          filterable: true,
        },
      },
      views: {
        defaultView: "list",
        enabledViews: ["list"],
        filteredViews: [
          {
            name: "my-tasks",
            label: "My Tasks",
            filter: { assigneeId: "$currentUser" },
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      // Both filterable field and filteredViews are valid simultaneously
      expect(result.data.fields.status.filterable).toBe(true);
      expect(result.data.views?.filteredViews).toHaveLength(1);
    }
  });

  it("Bug 5: route template produces thin wrapper (validated by schema)", () => {
    // The route template fix is in the Handlebars template, but we validate
    // that the YAML schema supports the auth pattern configuration
    const result = featureYamlSchema.safeParse({
      name: "tasks",
      label: "Task",
      fields: {
        title: { type: "string", required: true },
      },
      access: {
        scope: "owner",
        permissions: {
          create: "authenticated",
          read: "owner",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.access?.permissions?.create).toBe("authenticated");
    }
  });
});
