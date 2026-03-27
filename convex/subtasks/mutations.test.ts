import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

/** Helper: seed a task and return its ID */
async function seedTask(testClient: any, userId?: string) {
  return testClient.run(async (ctx: any) => {
    const uid =
      userId ?? (await ctx.db.insert("users", { name: "Seed" }));
    return ctx.db.insert("tasks", {
      title: "Parent Task",
      priority: false,
      status: "todo",
      visibility: "private",
      creatorId: uid,
      assigneeId: uid,
      position: 1,
    });
  });
}

describe("create", () => {
  test("creates a subtask with default values", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);

    await client.mutation(api.subtasks.mutations.create, {
      title: "My subtask",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(records).toHaveLength(1);
    expect(records[0].title).toBe("My subtask");
    expect(records[0].status).toBe("todo");
    expect(records[0].taskId).toBe(taskId);
    expect(records[0].creatorId).toBe(userId);
    expect(records[0].position).toBeTypeOf("number");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);

    await testClient.mutation(api.subtasks.mutations.create, {
      title: "Should not be created",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(records).toHaveLength(0);
  });
});

describe("update", () => {
  test("updates title when authenticated", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Original",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.update, {
      subtaskId: records[0]._id,
      title: "Updated",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.title).toBe("Updated");
  });

  test("update without title does not change title", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Keep me",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.update, {
      subtaskId: records[0]._id,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.title).toBe("Keep me");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const subtaskId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("subtasks", {
        title: "Seed",
        status: "todo",
        taskId,
        position: 1,
        creatorId: uid,
      });
    });

    await testClient.mutation(api.subtasks.mutations.update, {
      subtaskId,
      title: "Should not change",
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtaskId),
    );
    expect(record.title).toBe("Seed");
  });

  test("throws NOT_FOUND for nonexistent ID", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Temp",
      taskId,
    });
    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    const subtaskId = records[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(subtaskId));

    await expect(
      client.mutation(api.subtasks.mutations.update, {
        subtaskId,
        title: "Nope",
      }),
    ).rejects.toThrow("Subtask not found");
  });
});

describe("remove", () => {
  test("deletes a subtask", async ({ client, userId, testClient }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "To delete",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(records).toHaveLength(1);

    await client.mutation(api.subtasks.mutations.remove, {
      subtaskId: records[0]._id,
    });

    const remaining = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(remaining).toHaveLength(0);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const subtaskId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("subtasks", {
        title: "Seed",
        status: "todo",
        taskId,
        position: 1,
        creatorId: uid,
      });
    });

    await testClient.mutation(api.subtasks.mutations.remove, {
      subtaskId,
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtaskId),
    );
    expect(record).not.toBeNull();
  });
});

describe("toggleDone", () => {
  test("toggles todo to done", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Toggle me",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    expect(records[0].status).toBe("todo");

    await client.mutation(api.subtasks.mutations.toggleDone, {
      subtaskId: records[0]._id,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.status).toBe("done");
  });

  test("toggles done back to todo", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Toggle me",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    // Toggle to done
    await client.mutation(api.subtasks.mutations.toggleDone, {
      subtaskId: records[0]._id,
    });

    // Toggle back to todo
    await client.mutation(api.subtasks.mutations.toggleDone, {
      subtaskId: records[0]._id,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.status).toBe("todo");
  });

  test("rejects toggling a promoted subtask", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Promote then toggle",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    // Promote the subtask
    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: records[0]._id,
    });

    // Attempt to toggle — should throw
    await expect(
      client.mutation(api.subtasks.mutations.toggleDone, {
        subtaskId: records[0]._id,
      }),
    ).rejects.toThrow("Subtask has already been promoted");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const subtaskId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("subtasks", {
        title: "Seed",
        status: "todo",
        taskId,
        position: 1,
        creatorId: uid,
      });
    });

    await testClient.mutation(api.subtasks.mutations.toggleDone, {
      subtaskId,
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtaskId),
    );
    expect(record.status).toBe("todo");
  });

  test("throws NOT_FOUND for nonexistent subtask", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Temp",
      taskId,
    });
    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    const subtaskId = subtasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(subtaskId));

    await expect(
      client.mutation(api.subtasks.mutations.toggleDone, { subtaskId }),
    ).rejects.toThrow("Subtask not found");
  });
});

describe("reorder", () => {
  test("updates position field", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Reorder test",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.reorder, {
      subtaskId: records[0]._id,
      newPosition: 42,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.position).toBe(42);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const subtaskId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("subtasks", {
        title: "Seed",
        status: "todo",
        taskId,
        position: 1,
        creatorId: uid,
      });
    });

    await testClient.mutation(api.subtasks.mutations.reorder, {
      subtaskId,
      newPosition: 999,
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtaskId),
    );
    expect(record.position).toBe(1);
  });
});

describe("promote", () => {
  test("creates new task from subtask title", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Promote me",
      taskId,
    });

    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: subtasks[0]._id,
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    // Original seed task + new promoted task
    expect(tasks).toHaveLength(2);
    const newTask = tasks.find((t: any) => t.title === "Promote me");
    expect(newTask).toBeDefined();
    expect(newTask.status).toBe("todo");
    expect(newTask.visibility).toBe("shared");
    expect(newTask.priority).toBe(false);
  });

  test("new task inherits parent projectId", async ({
    client,
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

    // Create a task in that project
    await client.mutation(api.tasks.mutations.createInProject, {
      title: "Project Task",
      projectId,
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Create and promote subtask
    await client.mutation(api.subtasks.mutations.create, {
      title: "Promote to project",
      taskId,
    });
    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: subtasks[0]._id,
    });

    // Verify new task inherited projectId
    const allTasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const newTask = allTasks.find(
      (t: any) => t.title === "Promote to project",
    );
    expect(newTask.projectId).toBe(projectId);
  });

  test("subtask status becomes promoted with promotedToTaskId", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Check promoted state",
      taskId,
    });

    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: subtasks[0]._id,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtasks[0]._id),
    );
    expect(updated.status).toBe("promoted");
    expect(updated.promotedToTaskId).toBeDefined();
  });

  test("rejects promoting already-promoted subtask", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Double promote",
      taskId,
    });

    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: subtasks[0]._id,
    });

    await expect(
      client.mutation(api.subtasks.mutations.promote, {
        subtaskId: subtasks[0]._id,
      }),
    ).rejects.toThrow("Subtask has already been promoted");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const subtaskId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("subtasks", {
        title: "Seed",
        status: "todo",
        taskId,
        position: 1,
        creatorId: uid,
      });
    });

    await testClient.mutation(api.subtasks.mutations.promote, {
      subtaskId,
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(subtaskId),
    );
    expect(record.status).toBe("todo");
  });

  test("throws NOT_FOUND for nonexistent subtask", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api.subtasks.mutations.create, {
      title: "Temp",
      taskId,
    });
    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );
    const subtaskId = subtasks[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(subtaskId));

    await expect(
      client.mutation(api.subtasks.mutations.promote, { subtaskId }),
    ).rejects.toThrow("Subtask not found");
  });
});
