import { v } from "convex/values";
import { mutation } from "@cvx/_generated/server";

export const store = mutation({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    html: v.string(),
    text: v.optional(v.string()),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("devEmails", args);
  },
});

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const emails = await ctx.db.query("devEmails").collect();
    for (const email of emails) {
      await ctx.db.delete(email._id);
    }
  },
});
