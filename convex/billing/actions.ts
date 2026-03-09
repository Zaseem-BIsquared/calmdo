import { action } from "@cvx/_generated/server";
import { v } from "convex/values";
import { ERRORS } from "~/errors";
import { auth } from "@cvx/auth";
import { currencyValidator, intervalValidator, PLANS } from "@cvx/schema";
import { api, internal } from "~/convex/_generated/api";
import { SITE_URL } from "@cvx/env";
import { stripe } from "@cvx/billing/stripe";

/**
 * Creates a Stripe checkout session for a user.
 */
/* v8 ignore start -- calls Stripe SDK */
export const createSubscriptionCheckout = action({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    planInterval: intervalValidator,
    currency: currencyValidator,
  },
  handler: async (ctx, args): Promise<string | undefined> => {
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user || !user.customerId) {
      throw new Error(ERRORS.billing.SOMETHING_WENT_WRONG);
    }

    const { currentSubscription, newPlan } = await ctx.runQuery(
      internal.billing.stripe.getCurrentUserSubscription,
      { planId: args.planId },
    );
    if (!currentSubscription?.plan) {
      throw new Error(ERRORS.billing.SOMETHING_WENT_WRONG);
    }
    if (currentSubscription.plan.key !== PLANS.FREE) {
      return;
    }

    const price = newPlan?.prices[args.planInterval][args.currency];

    const checkout = await stripe.checkout.sessions.create({
      customer: user.customerId,
      line_items: [{ price: price?.stripeId, quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card"],
      success_url: `${SITE_URL}/dashboard/checkout`,
      cancel_url: `${SITE_URL}/dashboard/settings/billing`,
    });
    if (!checkout) {
      throw new Error(ERRORS.billing.SOMETHING_WENT_WRONG);
    }
    return checkout.url || undefined;
  },
});

/**
 * Creates a Stripe customer portal for a user.
 */
export const createCustomerPortal = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return;
    }
    const user = await ctx.runQuery(api.users.queries.getCurrentUser);
    if (!user || !user.customerId) {
      throw new Error(ERRORS.billing.SOMETHING_WENT_WRONG);
    }

    const customerPortal = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${SITE_URL}/dashboard/settings/billing`,
    });
    if (!customerPortal) {
      throw new Error(ERRORS.billing.SOMETHING_WENT_WRONG);
    }
    return customerPortal.url;
  },
});
/* v8 ignore stop */
