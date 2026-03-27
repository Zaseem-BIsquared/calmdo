import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("create", () => {
  test("creates a task with default values", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "My task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("My task");
    expect(tasks[0].status).toBe("todo");
    expect(tasks[0].visibility).toBe("private");
    expect(tasks[0].priority).toBe(false);
    expect(tasks[0].creatorId).toBe(userId);
    expect(tasks[0].assigneeId).toBe(userId);
    expect(tasks[0].position).toBeTypeOf("number");

    // Verify activity log was created
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].entityType).toBe("task");
    expect(logs[0].entityId).toBe(tasks[0]._id);
    expect(logs[0].action).toBe("created");
    expect(logs[0].actor).toBe(userId);
  });

  test("creates a task with all fields specified", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Full task",
      description: "A detailed description",
      priority: true,
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Full task");
    expect(tasks[0].description).toBe("A detailed description");
    expect(tasks[0].priority).toBe(true);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    await testClient.mutation(api.tasks.mutations.create, {
      title: "Should not be created",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(0);
  });
});

describe("update", () => {
  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    await testClient.mutation(api.tasks.mutations.update, {
      taskId,
      title: "Should not change",
    });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task.title).toBe("Seed");
  });

  test("updates only specified fields", async ({
    client,
    testClient,
  }) => {
    // Create a task first
    await client.mutation(api.tasks.mutations.create, {
      title: "Original title",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    await client.mutation(api.tasks.mutations.update, {
      taskId,
      title: "Updated title",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(taskId),
    );
    expect(updated.title).toBe("Updated title");
    expect(updated.priority).toBe(false); // unchanged

    // Verify activity log for edit
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    const editLog = logs.find((l: any) => l.action === "edited");
    expect(editLog).toBeDefined();
    expect(editLog.entityType).toBe("task");
    expect(editLog.entityId).toBe(taskId);
    const metadata = JSON.parse(editLog.metadata);
    expect(metadata.fields).toContain("title");
  });

  test("updates description and priority", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Original",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    await client.mutation(api.tasks.mutations.update, {
      taskId: tasks[0]._id,
      description: "New description",
      priority: true,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.description).toBe("New description");
    expect(updated.priority).toBe(true);
    expect(updated.title).toBe("Original"); // unchanged
  });

  test("does not log activity when no fields are changed", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "No-op update",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    // Clear existing activity logs (from create)
    await testClient.run(async (ctx: any) => {
      const logs = await ctx.db.query("activityLogs").collect();
      for (const log of logs) await ctx.db.delete(log._id);
    });

    // Call update with no changed fields
    await client.mutation(api.tasks.mutations.update, {
      taskId: tasks[0]._id,
    });

    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    expect(logs).toHaveLength(0);
  });

  test("throws when task not found", async ({ client, testClient }) => {
    // Create and delete a task to get a valid-format but non-existent ID
    await client.mutation(api.tasks.mutations.create, {
      title: "Temporary",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(taskId));

    await expect(
      client.mutation(api.tasks.mutations.update, {
        taskId,
        title: "Nope",
      }),
    ).rejects.toThrow("Task not found");
  });
});

describe("remove", () => {
  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    await testClient.mutation(api.tasks.mutations.remove, { taskId });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task).not.toBeNull();
  });

  test("deletes a task", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "To delete",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(1);

    await client.mutation(api.tasks.mutations.remove, {
      taskId: tasks[0]._id,
    });

    const remaining = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(remaining).toHaveLength(0);

    // Verify activity log for delete
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    const deleteLog = logs.find((l: any) => l.action === "deleted");
    expect(deleteLog).toBeDefined();
    expect(deleteLog.entityType).toBe("task");
  });

  test("remove deletes associated subtasks", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Task with subtasks",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Create subtask via direct insert
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("subtasks", {
        title: "Child subtask",
        status: "todo",
        taskId,
        position: 1,
        creatorId: userId,
      }),
    );

    const subtasksBefore = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(subtasksBefore).toHaveLength(1);

    await client.mutation(api.tasks.mutations.remove, { taskId });

    const subtasksAfter = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(subtasksAfter).toHaveLength(0);
  });

  test("remove deletes associated work logs", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Task with work logs",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Create work log via direct insert
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("workLogs", {
        body: "Logged work",
        timeMinutes: 30,
        taskId,
        creatorId: userId,
      }),
    );

    const logsBefore = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(logsBefore).toHaveLength(1);

    await client.mutation(api.tasks.mutations.remove, { taskId });

    const logsAfter = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(logsAfter).toHaveLength(0);
  });
});

describe("updateStatus", () => {
  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    await testClient.mutation(api.tasks.mutations.updateStatus, {
      taskId,
      status: "in_progress",
    });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task.status).toBe("todo");
  });

  test("throws when task not found", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Temp" });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(taskId));

    await expect(
      client.mutation(api.tasks.mutations.updateStatus, {
        taskId,
        status: "in_progress",
      }),
    ).rejects.toThrow("Task not found");
  });

  test("advances todo to in_progress", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Status task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId: tasks[0]._id,
      status: "in_progress",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.status).toBe("in_progress");

    // Verify activity log for status change
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    const statusLog = logs.find((l: any) => l.action === "status_changed");
    expect(statusLog).toBeDefined();
    expect(statusLog.entityType).toBe("task");
    const metadata = JSON.parse(statusLog.metadata);
    expect(metadata.from).toBe("todo");
    expect(metadata.to).toBe("in_progress");
  });

  test("advances in_progress to done", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Status task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    // First advance to in_progress
    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId: tasks[0]._id,
      status: "in_progress",
    });

    // Then advance to done
    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId: tasks[0]._id,
      status: "done",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.status).toBe("done");
  });

  test("rejects skipping states (todo -> done)", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Status task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    await expect(
      client.mutation(api.tasks.mutations.updateStatus, {
        taskId: tasks[0]._id,
        status: "done",
      }),
    ).rejects.toThrow("Invalid status transition");
  });

  test("rejects going backwards (done -> todo)", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Status task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    // Advance to done
    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId: tasks[0]._id,
      status: "in_progress",
    });
    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId: tasks[0]._id,
      status: "done",
    });

    await expect(
      client.mutation(api.tasks.mutations.updateStatus, {
        taskId: tasks[0]._id,
        status: "todo",
      }),
    ).rejects.toThrow("Invalid status transition");
  });
});

describe("assign", () => {
  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );

    await testClient.mutation(api.tasks.mutations.assign, {
      taskId,
      assigneeId: otherUserId,
    });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task.visibility).toBe("private");
  });

  test("throws when task not found", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Temp" });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(taskId));

    await expect(
      client.mutation(api.tasks.mutations.assign, {
        taskId,
        assigneeId: undefined,
      }),
    ).rejects.toThrow("Task not found");
  });

  test("auto-flips visibility to shared when assigning to another user", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Assign task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks[0].visibility).toBe("private");

    // Create another user
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other User" }),
    );

    await client.mutation(api.tasks.mutations.assign, {
      taskId: tasks[0]._id,
      assigneeId: otherUserId,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.assigneeId).toBe(otherUserId);
    expect(updated.visibility).toBe("shared");

    // Verify activity log for assign
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    const assignLog = logs.find((l: any) => l.action === "assigned");
    expect(assignLog).toBeDefined();
    expect(assignLog.entityType).toBe("task");
    const metadata = JSON.parse(assignLog.metadata);
    expect(metadata.assigneeId).toBe(otherUserId);
  });

  test("does not flip visibility when assigning to creator", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Self-assign task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    await client.mutation(api.tasks.mutations.assign, {
      taskId: tasks[0]._id,
      assigneeId: userId,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.assigneeId).toBe(userId);
    expect(updated.visibility).toBe("private");
  });

  test("unassigning a private task flips visibility to shared", async ({
    client,
    testClient,
  }) => {
    // Create task (starts private, assigned to creator)
    await client.mutation(api.tasks.mutations.create, {
      title: "Private task",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks[0].visibility).toBe("private");

    // Unassign (should flip to shared)
    await client.mutation(api.tasks.mutations.assign, {
      taskId: tasks[0]._id,
      assigneeId: undefined,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.assigneeId).toBeUndefined();
    expect(updated.visibility).toBe("shared");

    // Verify activity log for unassign
    const logs = await testClient.run(async (ctx: any) =>
      ctx.db.query("activityLogs").collect(),
    );
    const unassignLog = logs.find((l: any) => l.action === "unassigned");
    expect(unassignLog).toBeDefined();
    expect(unassignLog.entityType).toBe("task");
  });

  test("unassigning keeps visibility as shared", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Unassign task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    // Assign to another user (flips to shared)
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other User" }),
    );
    await client.mutation(api.tasks.mutations.assign, {
      taskId: tasks[0]._id,
      assigneeId: otherUserId,
    });

    // Unassign (should keep shared)
    await client.mutation(api.tasks.mutations.assign, {
      taskId: tasks[0]._id,
      assigneeId: undefined,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.assigneeId).toBeUndefined();
    expect(updated.visibility).toBe("shared");
  });
});

describe("createInProject", () => {
  test("creates task in project with shared visibility", async ({
    client,
    userId,
    testClient,
  }) => {
    // Create a project first
    await client.mutation(api.projects.mutations.create, {
      name: "Test Project",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    await client.mutation(api.tasks.mutations.createInProject, {
      title: "Project Task",
      projectId,
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Project Task");
    expect(tasks[0].visibility).toBe("shared");
    expect(tasks[0].projectId).toBe(projectId);
    expect(tasks[0].creatorId).toBe(userId);
    expect(tasks[0].assigneeId).toBe(userId);
    expect(tasks[0].status).toBe("todo");
    expect(tasks[0].priority).toBe(false);
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

    await testClient.mutation(api.tasks.mutations.createInProject, {
      title: "Should not be created",
      projectId,
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks).toHaveLength(0);
  });
});

describe("assignToProject", () => {
  test("assigns task to project and flips visibility to shared", async ({
    client,
    testClient,
  }) => {
    // Create project and task
    await client.mutation(api.projects.mutations.create, {
      name: "Target Project",
    });
    await client.mutation(api.tasks.mutations.create, {
      title: "Loose Task",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks[0].visibility).toBe("private");

    await client.mutation(api.tasks.mutations.assignToProject, {
      taskId: tasks[0]._id,
      projectId: projects[0]._id,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.projectId).toBe(projects[0]._id);
    expect(updated.visibility).toBe("shared");
  });

  test("removes task from project and restores private when creator=assignee", async ({
    client,
    userId,
    testClient,
  }) => {
    // Create project and task in project
    await client.mutation(api.projects.mutations.create, {
      name: "Source Project",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );

    await client.mutation(api.tasks.mutations.createInProject, {
      title: "Project Task",
      projectId: projects[0]._id,
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    expect(tasks[0].visibility).toBe("shared");
    expect(tasks[0].creatorId).toBe(userId);
    expect(tasks[0].assigneeId).toBe(userId);

    // Remove from project (projectId = undefined)
    await client.mutation(api.tasks.mutations.assignToProject, {
      taskId: tasks[0]._id,
      projectId: undefined,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.projectId).toBeUndefined();
    expect(updated.visibility).toBe("private");
  });

  test("removes task from project and keeps shared when assignee differs from creator", async ({
    client,
    testClient,
  }) => {
    // Create project and task in project
    await client.mutation(api.projects.mutations.create, {
      name: "Source Project",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );

    await client.mutation(api.tasks.mutations.createInProject, {
      title: "Shared Task",
      projectId: projects[0]._id,
    });

    // Assign to another user
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    await testClient.run(async (ctx: any) =>
      ctx.db.patch(tasks[0]._id, { assigneeId: otherUserId }),
    );

    // Remove from project -- visibility should stay shared
    await client.mutation(api.tasks.mutations.assignToProject, {
      taskId: tasks[0]._id,
      projectId: undefined,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.projectId).toBeUndefined();
    expect(updated.visibility).toBe("shared");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    await testClient.mutation(api.tasks.mutations.assignToProject, {
      taskId,
      projectId: undefined,
    });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task.visibility).toBe("private");
  });

  test("throws when task not found", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Temp" });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(taskId));

    await expect(
      client.mutation(api.tasks.mutations.assignToProject, {
        taskId,
        projectId: undefined,
      }),
    ).rejects.toThrow("Task not found");
  });
});

describe("reorder", () => {
  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Seed",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    await testClient.mutation(api.tasks.mutations.reorder, {
      taskId,
      newPosition: 999,
    });

    const task = await testClient.run(async (ctx: any) => ctx.db.get(taskId));
    expect(task.position).toBe(1);
  });

  test("updates position field", async ({ client, testClient }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Reorder task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    await client.mutation(api.tasks.mutations.reorder, {
      taskId: tasks[0]._id,
      newPosition: 42,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(tasks[0]._id),
    );
    expect(updated.position).toBe(42);
  });
});
