import { mutation } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { v } from "convex/values";
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { createWorkLogInput } from "../../src/shared/schemas/work-logs";
import { ERRORS } from "../../src/shared/errors";

const zMutation = zCustomMutation(mutation, NoOp);

export const create = zMutation({
  args: createWorkLogInput.extend({
    taskId: v.id("tasks"),
  }),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    return await ctx.db.insert("workLogs", {
      body: args.body,
      timeMinutes: args.timeMinutes,
      taskId: args.taskId,
      creatorId: userId,
    });
  },
});

export const update = mutation({
  args: {
    workLogId: v.id("workLogs"),
    body: v.optional(v.string()),
    timeMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const workLog = await ctx.db.get(args.workLogId);
    if (!workLog) throw new Error(ERRORS.workLogs.NOT_FOUND);

    if (workLog.creatorId !== userId) {
      throw new Error(ERRORS.workLogs.NOT_OWNER);
    }

    const patch: Record<string, unknown> = {};
    if (args.body !== undefined) patch.body = args.body;
    if (args.timeMinutes !== undefined) patch.timeMinutes = args.timeMinutes;

    await ctx.db.patch(args.workLogId, patch);
  },
});

export const remove = mutation({
  args: { workLogId: v.id("workLogs") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;

    const workLog = await ctx.db.get(args.workLogId);
    if (!workLog) throw new Error(ERRORS.workLogs.NOT_FOUND);

    if (workLog.creatorId !== userId) {
      throw new Error(ERRORS.workLogs.NOT_OWNER);
    }

    await ctx.db.delete(args.workLogId);
  },
});
