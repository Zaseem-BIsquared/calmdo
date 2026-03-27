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
  test("creates work log with body only", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);

    await client.mutation(api["work-logs"].mutations.create, {
      body: "Did some work",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(records).toHaveLength(1);
    expect(records[0].body).toBe("Did some work");
    expect(records[0].timeMinutes).toBeUndefined();
    expect(records[0].creatorId).toBe(userId);
    expect(records[0].taskId).toBe(taskId);
  });

  test("creates work log with body and timeMinutes", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);

    await client.mutation(api["work-logs"].mutations.create, {
      body: "Timed work",
      timeMinutes: 90,
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(records).toHaveLength(1);
    expect(records[0].body).toBe("Timed work");
    expect(records[0].timeMinutes).toBe(90);
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);

    await testClient.mutation(api["work-logs"].mutations.create, {
      body: "Should not be created",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(records).toHaveLength(0);
  });
});

describe("update", () => {
  test("updates body when authenticated and is owner", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api["work-logs"].mutations.create, {
      body: "Original",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );

    await client.mutation(api["work-logs"].mutations.update, {
      workLogId: records[0]._id,
      body: "Updated body",
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.body).toBe("Updated body");
  });

  test("updates timeMinutes when authenticated and is owner", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api["work-logs"].mutations.create, {
      body: "Timed",
      timeMinutes: 30,
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );

    await client.mutation(api["work-logs"].mutations.update, {
      workLogId: records[0]._id,
      timeMinutes: 60,
    });

    const updated = await testClient.run(async (ctx: any) =>
      ctx.db.get(records[0]._id),
    );
    expect(updated.timeMinutes).toBe(60);
  });

  test("rejects update when authenticated but NOT owner", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);

    // Create work log owned by a different user
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );
    const workLogId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("workLogs", {
        body: "Other's work",
        taskId,
        creatorId: otherUserId,
      }),
    );

    await expect(
      client.mutation(api["work-logs"].mutations.update, {
        workLogId,
        body: "Stolen",
      }),
    ).rejects.toThrow("You can only edit your own work logs");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const workLogId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("workLogs", {
        body: "Seed",
        taskId,
        creatorId: uid,
      });
    });

    await testClient.mutation(api["work-logs"].mutations.update, {
      workLogId,
      body: "Should not change",
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(workLogId),
    );
    expect(record.body).toBe("Seed");
  });

  test("throws NOT_FOUND for nonexistent ID", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api["work-logs"].mutations.create, {
      body: "Temp",
      taskId,
    });
    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    const workLogId = records[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(workLogId));

    await expect(
      client.mutation(api["work-logs"].mutations.update, {
        workLogId,
        body: "Nope",
      }),
    ).rejects.toThrow("Work log not found");
  });
});

describe("remove", () => {
  test("deletes work log when authenticated and is owner", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api["work-logs"].mutations.create, {
      body: "To delete",
      taskId,
    });

    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(records).toHaveLength(1);

    await client.mutation(api["work-logs"].mutations.remove, {
      workLogId: records[0]._id,
    });

    const remaining = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    expect(remaining).toHaveLength(0);
  });

  test("rejects delete when authenticated but NOT owner", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );
    const workLogId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("workLogs", {
        body: "Other's work",
        taskId,
        creatorId: otherUserId,
      }),
    );

    await expect(
      client.mutation(api["work-logs"].mutations.remove, { workLogId }),
    ).rejects.toThrow("You can only edit your own work logs");
  });

  test("does nothing when unauthenticated", async ({ testClient }) => {
    const taskId = await seedTask(testClient);
    const workLogId = await testClient.run(async (ctx: any) => {
      const uid = (await ctx.db.query("users").collect())[0]._id;
      return ctx.db.insert("workLogs", {
        body: "Seed",
        taskId,
        creatorId: uid,
      });
    });

    await testClient.mutation(api["work-logs"].mutations.remove, {
      workLogId,
    });

    const record = await testClient.run(async (ctx: any) =>
      ctx.db.get(workLogId),
    );
    expect(record).not.toBeNull();
  });

  test("throws NOT_FOUND for nonexistent ID", async ({
    client,
    userId,
    testClient,
  }) => {
    const taskId = await seedTask(testClient, userId);
    await client.mutation(api["work-logs"].mutations.create, {
      body: "Temp",
      taskId,
    });
    const records = await testClient.run(async (ctx: any) =>
      ctx.db.query("workLogs").collect(),
    );
    const workLogId = records[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(workLogId));

    await expect(
      client.mutation(api["work-logs"].mutations.remove, { workLogId }),
    ).rejects.toThrow("Work log not found");
  });
});
