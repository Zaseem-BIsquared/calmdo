import { query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import { zodToConvex } from "convex-helpers/server/zod4";
import { projectStatus } from "../../src/shared/schemas/projects";

export const list = query({
  args: { status: v.optional(zodToConvex(projectStatus)) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const projects = args.status
      ? await ctx.db
          .query("projects")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("projects").collect();

    return await asyncMap(projects, async (project) => {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      const taskCounts = {
        total: tasks.length,
        todo: tasks.filter((t) => t.status === "todo").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        done: tasks.filter((t) => t.status === "done").length,
      };

      return { ...project, taskCounts };
    });
  },
});

export const getWithTasks = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const statusSummary = {
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };

    return { ...project, tasks, statusSummary };
  },
});
