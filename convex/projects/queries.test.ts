import { describe, expect } from "vitest";
import { api } from "../_generated/api";
import { test } from "../test.setup";

describe("list", () => {
  test("returns all projects when no status filter", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, { name: "Alpha" });
    await client.mutation(api.projects.mutations.create, { name: "Beta" });

    const projects = await client.query(api.projects.queries.list, {});
    expect(projects).toHaveLength(2);
    expect(projects.map((p: any) => p.name)).toContain("Alpha");
    expect(projects.map((p: any) => p.name)).toContain("Beta");
  });

  test("returns only active projects when status='active'", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, { name: "Active" });
    await client.mutation(api.projects.mutations.create, {
      name: "To Archive",
    });

    // Change second project to archived
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const toArchive = projects.find((p: any) => p.name === "To Archive");
    await client.mutation(api.projects.mutations.update, {
      projectId: toArchive._id,
      status: "archived",
    });

    const activeProjects = await client.query(api.projects.queries.list, {
      status: "active",
    });
    expect(activeProjects).toHaveLength(1);
    expect(activeProjects[0].name).toBe("Active");
  });

  test("returns projects with taskCounts { total, todo, in_progress, done }", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Counted",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    // Add tasks with various statuses
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Todo 1",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 1,
      });
      await ctx.db.insert("tasks", {
        title: "In Progress 1",
        priority: false,
        status: "in_progress",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 2,
      });
      await ctx.db.insert("tasks", {
        title: "Done 1",
        priority: false,
        status: "done",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 3,
      });
    });

    const result = await client.query(api.projects.queries.list, {});
    expect(result).toHaveLength(1);
    expect(result[0].taskCounts).toEqual({
      total: 3,
      todo: 1,
      in_progress: 1,
      done: 1,
    });
  });

  test("returns empty array when unauthenticated", async ({ testClient }) => {
    const projects = await testClient.query(api.projects.queries.list, {});
    expect(projects).toEqual([]);
  });
});

describe("getWithTasks", () => {
  test("returns project with tasks array and statusSummary", async ({
    client,
    userId,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Detail Project",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    // Add tasks
    await testClient.run(async (ctx: any) => {
      await ctx.db.insert("tasks", {
        title: "Todo Task",
        priority: false,
        status: "todo",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 1,
      });
      await ctx.db.insert("tasks", {
        title: "Done Task",
        priority: false,
        status: "done",
        visibility: "shared",
        creatorId: userId,
        assigneeId: userId,
        projectId,
        position: 2,
      });
    });

    const result = await client.query(api.projects.queries.getWithTasks, {
      projectId,
    });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Detail Project");
    expect(result!.tasks).toHaveLength(2);
    expect(result!.statusSummary).toEqual({
      todo: 1,
      in_progress: 0,
      done: 1,
    });
  });

  test("returns null for nonexistent project", async ({
    client,
    testClient,
  }) => {
    // Create and delete a project to get a valid-format but non-existent ID
    await client.mutation(api.projects.mutations.create, {
      name: "Temporary",
    });
    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;
    await testClient.run(async (ctx: any) => ctx.db.delete(projectId));

    const result = await client.query(api.projects.queries.getWithTasks, {
      projectId,
    });
    expect(result).toBeNull();
  });

  test("returns null when unauthenticated", async ({
    client,
    testClient,
  }) => {
    await client.mutation(api.projects.mutations.create, {
      name: "Auth Test",
    });

    const projects = await testClient.run(async (ctx: any) =>
      ctx.db.query("projects").collect(),
    );
    const projectId = projects[0]._id;

    const result = await testClient.query(
      api.projects.queries.getWithTasks,
      { projectId },
    );
    expect(result).toBeNull();
  });
});
