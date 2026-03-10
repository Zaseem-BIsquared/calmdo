import { query } from "@cvx/_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("devEmails")
      .withIndex("sentAt")
      .order("desc")
      .collect();
  },
});
