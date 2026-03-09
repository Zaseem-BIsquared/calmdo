import { internal } from "@cvx/_generated/api";
import { mutation } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { zCustomMutation } from "convex-helpers/server/zod4";
import { NoOp } from "convex-helpers/server/customFunctions";
import { username } from "../../src/shared/schemas/username";
import { currency as currencyZod } from "../../src/shared/schemas/billing";

const zMutation = zCustomMutation(mutation, NoOp);

export const completeOnboarding = zMutation({
  args: { username, currency: currencyZod },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return;
    }
    await ctx.db.patch(userId, { username: args.username });
    if (user.customerId) {
      return;
    }
    await ctx.scheduler.runAfter(
      0,
      internal.billing.stripe.PREAUTH_createStripeCustomer,
      {
        currency: args.currency,
        userId,
      },
    );
  },
});
