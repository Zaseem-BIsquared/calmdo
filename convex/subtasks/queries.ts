import { query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { v } from "convex/values";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { subtasks: [], completionCount: { done: 0, total: 0 } };

    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();

    const sorted = subtasks.sort((a, b) => a.position - b.position);
    const done = subtasks.filter(
      (s) => s.status === "done" || s.status === "promoted",
    ).length;

    return {
      subtasks: sorted,
      completionCount: { done, total: subtasks.length },
    };
  },
});
