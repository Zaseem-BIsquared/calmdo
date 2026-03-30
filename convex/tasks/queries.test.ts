// Test Matrix: tasks queries
// | # | Query        | State                        | What to verify                                   |
// |---|--------------|------------------------------|--------------------------------------------------|
// | 1 | myTasks      | with assigned tasks          | returns only current user's tasks                |
// | 2 | myTasks      | position ordering            | sorted by position ascending                     |
// | 3 | myTasks      | unauthenticated              | returns empty array                              |
// | 4 | teamPool     | mixed visibility/assignment  | returns only unassigned shared tasks             |
// | 5 | teamPool     | position ordering            | sorted by position ascending                     |
// | 6 | teamPool     | unauthenticated              | returns empty array                              |
// | 7 | getById      | valid task                   | returns full task object                         |
// | 8 | getById      | unauthenticated              | returns null                                     |
// | 9 | search       | unauthenticated              | returns empty array                              |
// |10 | search       | empty search term            | returns empty array                              |
// |11 | search       | whitespace-only term         | returns empty array                              |
// |12 | search       | matching title               | returns matching tasks                           |
// |13 | search       | with limit                   | respects limit parameter                         |
// |14 | listFiltered | unauthenticated              | returns empty array                              |
// |15 | listFiltered | no filters                   | returns all tasks                                |
// |16 | listFiltered | status filter                | returns only matching status                     |
// |17 | listFiltered | priority filter              | returns only matching priority                   |
// |18 | listFiltered | assignee 'me'                | returns current user's tasks                     |
// |19 | listFiltered | assignee 'unassigned'        | returns unassigned tasks                         |
// |20 | listFiltered | projectId filter             | returns tasks in project                         |
// |21 | listFiltered | combined filters             | intersects multiple filters                      |
// |22 | listFiltered | position ordering            | sorted by position ascending                     |
// |23 | listUsers    | multiple users               | returns all users with expected fields           |
// |24 | listUsers    | unauthenticated              | returns empty array                              |

import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("myTasks", () => {
  test("returns only tasks assigned to current user", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Task 1" });
    await client.mutation(api.tasks.mutations.create, { title: "Task 2" });

    // Other user's task (raw insert — can't call mutation as another user)
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Other's task",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: otherUserId,
        assigneeId: otherUserId,
        position: 3,
      }),
    );

    const tasks = await client.query(api.tasks.queries.myTasks, {});
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t: any) => t.title)).toContain("Task 1");
    expect(tasks.map((t: any) => t.title)).toContain("Task 2");
  });

  test("sorts by position ascending", async ({
    client,
    userId,
    testClient,
  }) => {
    // Raw insert with specific positions (mutation uses Date.now())
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Second",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 200,
      });
      await ctx.db.insert("tasks", {
        title: "First",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 100,
      });
    });

    const tasks = await client.query(api.tasks.queries.myTasks, {});
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe("First");
    expect(tasks[1].title).toBe("Second");
  });

  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const tasks = await testClient.query(api.tasks.queries.myTasks, {});
    expect(tasks).toEqual([]);
  });
});

describe("teamPool", () => {
  test("returns only unassigned shared tasks", async ({
    client,
    userId,
    testClient,
  }) => {
    // Shared + unassigned (raw insert — create always assigns to creator)
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Pool task",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        position: 1,
      }),
    );

    // Private task (excluded)
    await client.mutation(api.tasks.mutations.create, {
      title: "Private task",
    });

    // Shared + assigned (excluded)
    const otherUserId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", { name: "Other" }),
    );
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Assigned shared task",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: otherUserId,
        position: 2,
      }),
    );

    const pool = await client.query(api.tasks.queries.teamPool, {});
    expect(pool).toHaveLength(1);
    expect(pool[0].title).toBe("Pool task");
  });

  test("sorts by position ascending", async ({
    client,
    userId,
    testClient,
  }) => {
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Second",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        position: 200,
      });
      await ctx.db.insert("tasks", {
        title: "First",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        position: 100,
      });
    });

    const pool = await client.query(api.tasks.queries.teamPool, {});
    expect(pool).toHaveLength(2);
    expect(pool[0].title).toBe("First");
    expect(pool[1].title).toBe("Second");
  });

  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const pool = await testClient.query(api.tasks.queries.teamPool, {});
    expect(pool).toEqual([]);
  });
});

describe("getById", () => {
  test("returns task by ID when authenticated", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Get by ID task",
    });

    const tasks = await testClient.run(async (ctx: any) =>
      ctx.db.query("tasks").collect(),
    );

    const task = await client.query(api.tasks.queries.getById, {
      taskId: tasks[0]._id,
    });
    expect(task).not.toBeNull();
    expect(task!.title).toBe("Get by ID task");
    expect(task!.creatorId).toBe(userId);
  });

  test("returns null when unauthenticated", async ({ testClient }) => {
    const taskId = await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Auth test",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: await ctx.db.insert("users", { name: "Owner" }),
        position: 1,
      }),
    );

    const task = await testClient.query(api.tasks.queries.getById, {
      taskId,
    });
    expect(task).toBeNull();
  });
});

describe("search", () => {
  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const results = await testClient.query(api.tasks.queries.search, {
      searchTerm: "test",
    });
    expect(results).toEqual([]);
  });

  test("returns empty array for empty search term", async ({ client }) => {
    const results = await client.query(api.tasks.queries.search, {
      searchTerm: "",
    });
    expect(results).toEqual([]);
  });

  test("returns empty array for whitespace-only search term", async ({
    client,
  }) => {
    const results = await client.query(api.tasks.queries.search, {
      searchTerm: "   ",
    });
    expect(results).toEqual([]);
  });

  test("returns matching tasks by title", async ({ client }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "Build search feature",
    });
    await client.mutation(api.tasks.mutations.create, {
      title: "Fix login bug",
    });
    const results = await client.query(api.tasks.queries.search, {
      searchTerm: "search",
    });
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Build search feature");
  });

  test("respects limit parameter", async ({ client }) => {
    for (let i = 0; i < 5; i++) {
      await client.mutation(api.tasks.mutations.create, {
        title: `Search task ${i}`,
      });
    }
    const results = await client.query(api.tasks.queries.search, {
      searchTerm: "Search",
      limit: 2,
    });
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

describe("listFiltered", () => {
  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const results = await testClient.query(api.tasks.queries.listFiltered, {});
    expect(results).toEqual([]);
  });

  test("returns all tasks when no filters applied", async ({ client }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Task 1" });
    await client.mutation(api.tasks.mutations.create, { title: "Task 2" });
    const results = await client.query(api.tasks.queries.listFiltered, {});
    expect(results.length).toBe(2);
  });

  test("filters by status", async ({ client, testClient, userId }) => {
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Todo task",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 1,
      });
      await ctx.db.insert("tasks", {
        title: "In progress task",
        priority: false,
        status: "in_progress",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 2,
      });
    });

    const todo = await client.query(api.tasks.queries.listFiltered, {
      status: "todo",
    });
    expect(todo.length).toBe(1);
    expect(todo[0].title).toBe("Todo task");

    const inProgress = await client.query(api.tasks.queries.listFiltered, {
      status: "in_progress",
    });
    expect(inProgress.length).toBe(1);
    expect(inProgress[0].title).toBe("In progress task");
  });

  test("filters by priority", async ({ client }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Normal" });
    await client.mutation(api.tasks.mutations.create, {
      title: "High",
      priority: true,
    });
    const high = await client.query(api.tasks.queries.listFiltered, {
      priority: true,
    });
    expect(high.length).toBe(1);
    expect(high[0].title).toBe("High");
  });

  test("filters by assignee 'me'", async ({
    client,
    userId,
    testClient,
  }) => {
    // create mutation assigns to current user by default
    await client.mutation(api.tasks.mutations.create, { title: "My task" });

    // Insert unassigned task
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Unassigned",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        position: 2,
      }),
    );

    const mine = await client.query(api.tasks.queries.listFiltered, {
      assigneeId: "me",
    });
    expect(mine.length).toBe(1);
    expect(mine[0].title).toBe("My task");
  });

  test("filters by assignee 'unassigned'", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.tasks.mutations.create, { title: "Assigned" });

    await testClient.run(async (ctx: any) =>
      ctx.db.insert("tasks", {
        title: "Unassigned",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        position: 2,
      }),
    );

    const unassigned = await client.query(api.tasks.queries.listFiltered, {
      assigneeId: "unassigned",
    });
    expect(unassigned.length).toBe(1);
    expect(unassigned[0].title).toBe("Unassigned");
  });

  test("filters by projectId", async ({ client }) => {
    const projectId = await client.mutation(api.projects.mutations.create, {
      name: "Project A",
    });
    await client.mutation(api.tasks.mutations.createInProject, {
      title: "In project",
      projectId: projectId!,
    });
    await client.mutation(api.tasks.mutations.create, { title: "No project" });

    const filtered = await client.query(api.tasks.queries.listFiltered, {
      projectId: projectId!,
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("In project");
  });

  test("combines multiple filters", async ({ client }) => {
    await client.mutation(api.tasks.mutations.create, {
      title: "High todo",
      priority: true,
    });
    await client.mutation(api.tasks.mutations.create, {
      title: "Normal todo",
    });
    const filtered = await client.query(api.tasks.queries.listFiltered, {
      status: "todo",
      priority: true,
    });
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("High todo");
  });

  test("sorts by position ascending", async ({
    client,
    userId,
    testClient,
  }) => {
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Second",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 200,
      });
      await ctx.db.insert("tasks", {
        title: "First",
        priority: false,
        status: "todo",
        visibility: "private",
        creatorId: userId,
        assigneeId: userId,
        position: 100,
      });
    });

    const results = await client.query(api.tasks.queries.listFiltered, {});
    expect(results.length).toBe(2);
    expect(results[0].title).toBe("First");
    expect(results[1].title).toBe("Second");
  });
});

describe("listUsers", () => {
  test("returns all users with name, username, and email fields", async ({
    client,
    testClient,
  }) => {
    await testClient.run(async (ctx: any) =>
      ctx.db.insert("users", {
        name: "Second User",
        username: "second",
        email: "second@example.com",
      }),
    );

    const users = await client.query(api.tasks.queries.listUsers, {});
    expect(users.length).toBeGreaterThanOrEqual(2);

    for (const u of users) {
      expect(u).toHaveProperty("_id");
    }

    const secondUser = users.find((u: any) => u.username === "second");
    expect(secondUser!.name).toBe("Second User");
    expect(secondUser!.email).toBe("second@example.com");
  });

  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const users = await testClient.query(api.tasks.queries.listUsers, {});
    expect(users).toEqual([]);
  });
});
