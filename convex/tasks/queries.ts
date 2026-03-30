import { query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { v } from "convex/values";
import { zodToConvex } from "convex-helpers/server/zod4";
import { taskStatus } from "../../src/shared/schemas/tasks";

export const myTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .collect()
      .then((tasks) => tasks.sort((a, b) => a.position - b.position));
  },
});

export const teamPool = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const sharedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_visibility", (q) => q.eq("visibility", "shared"))
      .collect();
    return sharedTasks
      .filter((t) => !t.assigneeId)
      .sort((a, b) => a.position - b.position);
  },
});

export const getById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(args.taskId);
  },
});

export const search = query({
  args: { searchTerm: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    if (!args.searchTerm.trim()) return [];
    return ctx.db
      .query("tasks")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.searchTerm),
      )
      .take(args.limit ?? 10);
  },
});

export const listFiltered = query({
  args: {
    status: v.optional(zodToConvex(taskStatus)),
    priority: v.optional(v.boolean()),
    assigneeId: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    let tasks = await ctx.db.query("tasks").collect();

    if (args.status !== undefined) {
      tasks = tasks.filter((t) => t.status === args.status);
    }
    if (args.priority !== undefined) {
      tasks = tasks.filter((t) => t.priority === args.priority);
    }
    if (args.assigneeId !== undefined) {
      if (args.assigneeId === "me") {
        tasks = tasks.filter((t) => t.assigneeId === userId);
      } else if (args.assigneeId === "unassigned") {
        tasks = tasks.filter((t) => !t.assigneeId);
      } else {
        tasks = tasks.filter((t) => t.assigneeId === args.assigneeId);
      }
    }
    if (args.projectId !== undefined) {
      tasks = tasks.filter((t) => t.projectId === args.projectId);
    }

    return tasks.sort((a, b) => a.position - b.position);
  },
});

// TODO: scope to org in v3.0
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const users = await ctx.db.query("users").collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      email: u.email,
      image: u.image,
    }));
  },
});
