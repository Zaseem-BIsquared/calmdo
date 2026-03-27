import { mutation } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { v } from "convex/values";
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { zodToConvex } from "convex-helpers/server/zod4";
import { asyncMap } from "convex-helpers";
import { createProjectInput, projectStatus } from "../../src/shared/schemas/projects";
import { ERRORS } from "../../src/shared/errors";

const zMutation = zCustomMutation(mutation, NoOp);

export const create = zMutation({
  args: createProjectInput,
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    return await ctx.db.insert("projects", {
      name: args.name,
      status: "active",
      creatorId: userId,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    status: v.optional(zodToConvex(projectStatus)),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error(ERRORS.projects.NOT_FOUND);

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.status !== undefined) patch.status = args.status;

    await ctx.db.patch(args.projectId, patch);
  },
});

export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    await asyncMap(tasks, (task) => ctx.db.delete(task._id));
    await ctx.db.delete(args.projectId);
  },
});
