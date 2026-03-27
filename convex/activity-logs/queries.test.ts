import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

/** Helper: seed a user and return userId */
async function seedUser(testClient: any): Promise<string> {
  return testClient.run(async (ctx: any) =>
    ctx.db.insert("users", { name: "Seed" }),
  );
}

/** Helper: insert an activity log directly */
async function insertActivityLog(
  testClient: any,
  overrides: {
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    metadata?: string;
  },
) {
  return testClient.run(async (ctx: any) =>
    ctx.db.insert("activityLogs", {
      entityType: overrides.entityType,
      entityId: overrides.entityId,
      action: overrides.action,
      actor: overrides.actor,
      metadata: overrides.metadata,
    }),
  );
}

describe("listByEntity", () => {
  test("returns empty array for entity with no activity logs", async ({
    client,
  }) => {
    const result = await client.query(
      api["activity-logs"].queries.listByEntity,
      { entityType: "task", entityId: "nonexistent" },
    );
    expect(result).toEqual([]);
  });

  test("returns activity logs filtered by entityType and entityId", async ({
    client,
    testClient,
  }) => {
    // Create a task to get a valid ID
    await client.mutation(api.tasks.mutations.create, { title: "Test task" });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // The create mutation already logged an activity; query for it
    const result = await client.query(
      api["activity-logs"].queries.listByEntity,
      { entityType: "task", entityId: taskId },
    );
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].entityType).toBe("task");
    expect(result[0].entityId).toBe(taskId);
    expect(result[0].action).toBe("created");
  });

  test("does not return logs for different entity", async ({
    client,
  }) => {
    // Create task (logs activity for that task)
    await client.mutation(api.tasks.mutations.create, { title: "Task A" });

    // Query for project logs — should return empty
    const result = await client.query(
      api["activity-logs"].queries.listByEntity,
      { entityType: "project", entityId: "nonexistent" },
    );
    expect(result).toEqual([]);
  });

  test("returns empty when unauthenticated", async ({ testClient }) => {
    const userId = await seedUser(testClient);
    await insertActivityLog(testClient, {
      entityType: "task",
      entityId: "some-id",
      action: "created",
      actor: userId,
    });

    const result = await testClient.query(
      api["activity-logs"].queries.listByEntity,
      { entityType: "task", entityId: "some-id" },
    );
    expect(result).toEqual([]);
  });
});

describe("taskTimeline", () => {
  test("returns empty array for task with no activity or work logs", async ({
    client,
    userId,
    testClient,
  }) => {
    // Seed task directly (no activity log)
    const taskId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Empty task",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      }),
    );

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );
    expect(timeline).toEqual([]);
  });

  test("returns activity log entries with type 'activity'", async ({
    client,
    testClient,
  }) => {
    // Create task via mutation (which logs "created")
    await client.mutation(api.tasks.mutations.create, {
      title: "Timeline task",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );
    expect(timeline.length).toBeGreaterThanOrEqual(1);
    expect(timeline[0].type).toBe("activity");
    expect(timeline[0].action).toBe("created");
    expect(timeline[0].entityType).toBe("task");
  });

  test("returns work log entries with type 'workLog'", async ({
    client,
    userId,
    testClient,
  }) => {
    // Create task
    await client.mutation(api.tasks.mutations.create, {
      title: "Work log task",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Insert a work log directly
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("workLogs", {
        body: "Did some work",
        timeMinutes: 30,
        taskId,
        creatorId: userId,
      }),
    );

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );
    const workLogEntries = timeline.filter(
      (e: any) => e.type === "workLog",
    );
    expect(workLogEntries).toHaveLength(1);
    expect(workLogEntries[0].body).toBe("Did some work");
    expect(workLogEntries[0].timeMinutes).toBe(30);
  });

  test("merges activity logs and work logs sorted newest first", async ({
    client,
    testClient,
  }) => {
    // Create task
    await client.mutation(api.tasks.mutations.create, {
      title: "Merged timeline",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Add work log
    await client.mutation(api["work-logs"].mutations.create, {
      body: "Work entry",
      taskId,
    });

    // Update task status
    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId,
      status: "in_progress",
    });

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );

    // Should have: created activity, work log, status_changed activity
    expect(timeline.length).toBeGreaterThanOrEqual(3);

    // Verify sorted newest first
    for (let i = 0; i < timeline.length - 1; i++) {
      expect(timeline[i]._creationTime).toBeGreaterThanOrEqual(
        timeline[i + 1]._creationTime,
      );
    }

    // Verify both types present
    const types = timeline.map((e: any) => e.type);
    expect(types).toContain("activity");
    expect(types).toContain("workLog");
  });

  test("includes subtask activity entries in the timeline", async ({
    client,
    testClient,
  }) => {
    // Create task
    await client.mutation(api.tasks.mutations.create, {
      title: "Task with subtask",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    // Create subtask (logs "created" for subtask entity)
    await client.mutation(api.subtasks.mutations.create, {
      title: "Child subtask",
      taskId,
    });

    const subtasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("subtasks").collect(),
    );

    // Promote subtask (logs "promoted" with metadata { newTaskId })
    await client.mutation(api.subtasks.mutations.promote, {
      subtaskId: subtasks[0]._id,
    });

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );

    // Should include subtask's "created" and "promoted" activities
    const subtaskActivities = timeline.filter(
      (e: any) => e.type === "activity" && e.entityType === "subtask",
    );
    expect(subtaskActivities.length).toBeGreaterThanOrEqual(2);

    const createdActivity = subtaskActivities.find((e: any) => e.action === "created");
    expect(createdActivity).toBeDefined();

    // Promoted has metadata — verifies JSON.parse path for subtask activities
    const promotedActivity = subtaskActivities.find((e: any) => e.action === "promoted");
    expect(promotedActivity).toBeDefined();
    expect(promotedActivity.metadata).toBeDefined();
    expect(promotedActivity.metadata.newTaskId).toBeDefined();
  });

  test("returns empty when unauthenticated", async ({
    testClient,
  }) => {
    const taskId = await testClient.run(async (ctx: any) => {
      const userId = await ctx.db.insert("users", { name: "Seed" });
      return ctx.db.insert("tasks", {
        title: "Auth test task",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
    });

    const timeline = await testClient.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );
    expect(timeline).toEqual([]);
  });

  test("parses metadata JSON string back to object", async ({
    client,
    testClient,
  }) => {
    // Create task then update status (which logs metadata with from/to)
    await client.mutation(api.tasks.mutations.create, {
      title: "Metadata task",
    });
    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );
    const taskId = tasks[0]._id;

    await client.mutation(api.tasks.mutations.updateStatus, {
      taskId,
      status: "in_progress",
    });

    const timeline = await client.query(
      api["activity-logs"].queries.taskTimeline,
      { taskId },
    );

    const statusChange = timeline.find(
      (e: any) => e.action === "status_changed",
    );
    expect(statusChange).toBeDefined();
    expect(statusChange.metadata).toEqual({
      from: "todo",
      to: "in_progress",
    });
  });
});
