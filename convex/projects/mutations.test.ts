import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("create", () => {
  test("creates project with name, defaults status to active", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "My Project",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("My Project");
    expect(projects[0].status).toBe("active");
    expect(projects[0].creatorId).toBe(userId);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    await testClient.mutation(api.projects.mutations.create, {
      name: "Should not be created",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    expect(projects).toHaveLength(0);
  });
});

describe("update", () => {
  test("updates name only when specified", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Original",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    await client.mutation(api.projects.mutations.update, {
      projectId,
      name: "Updated",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(projectId),
    );
    expect(updated.name).toBe("Updated");
    expect(updated.status).toBe("active"); // unchanged
  });

  test("updates status only when specified", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Status Project",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    await client.mutation(api.projects.mutations.update, {
      projectId,
      status: "on_hold",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(projectId),
    );
    expect(updated.status).toBe("on_hold");
    expect(updated.name).toBe("Status Project"); // unchanged
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const projectId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("projects", {
        name: "Seed Project",
        status: "active",
        creatorId: userId,
      });
    });

    await testClient.mutation(api.projects.mutations.update, {
      projectId,
      name: "Should not change",
    });

    const project = await testClient.run(async (ctx: any) =>
      ctx.db.get(projectId),
    );
    expect(project.name).toBe("Seed Project");
  });

  test("throws 'Project not found.' for nonexistent project", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Temporary",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(projectId));

    await expect(
      client.mutation(api.projects.mutations.update, {
        projectId,
        name: "Nope",
      }),
    ).rejects.toThrow("Project not found");
  });
});

describe("remove", () => {
  test("deletes project and all its tasks (cascade)", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "To Delete",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    // Add tasks to the project
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Task 1",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 1,
      });
      await ctx.db.insert("tasks", {
        title: "Task 2",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 2,
      });
    });

    await client.mutation(api.projects.mutations.remove, { projectId });

    const remainingProjects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    expect(remainingProjects).toHaveLength(0);

    const remainingTasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(remainingTasks).toHaveLength(0);
  });

  test("deleting project with no tasks works without error", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Empty Project",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    await client.mutation(api.projects.mutations.remove, { projectId });

    const remaining = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    expect(remaining).toHaveLength(0);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const projectId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("projects", {
        name: "Seed Project",
        status: "active",
        creatorId: userId,
      });
    });

    await testClient.mutation(api.projects.mutations.remove, { projectId });

    const project = await testClient.run(async (ctx: any) =>
      ctx.db.get(projectId),
    );
    expect(project).not.toBeNull();
  });

  test("remove cascades through tasks to subtasks and work logs", async ({
    client,
    userId,
    testClient,
  }) => {
    // Create project
    await client.mutation(api.projects.mutations.create, {
      name: "Cascade Project",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    // Create task in project
    await testClient.run(async (ctx: any) => {
      const taskId = await ctx.db.insert("tasks", {
        title: "Project Task",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 1,
      });

      // Create subtask on that task
      await ctx.db.insert("subtasks", {
        title: "Child subtask",
        status: "todo",
        taskId,
        position: 1,
        creatorId: userId,
      });

      // Create work log on that task
      await ctx.db.insert("workLogs", {
        body: "Logged work",
        timeMinutes: 30,
        taskId,
        creatorId: userId,
      });
    });

    // Verify everything exists
    const tasksBefore = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const subtasksBefore = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    const logsBefore = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(tasksBefore).toHaveLength(1);
    expect(subtasksBefore).toHaveLength(1);
    expect(logsBefore).toHaveLength(1);

    // Delete project — should cascade through everything
    await client.mutation(api.projects.mutations.remove, { projectId });

    const tasksAfter = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const subtasksAfter = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    const logsAfter = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(tasksAfter).toHaveLength(0);
    expect(subtasksAfter).toHaveLength(0);
    expect(logsAfter).toHaveLength(0);
  });
});
