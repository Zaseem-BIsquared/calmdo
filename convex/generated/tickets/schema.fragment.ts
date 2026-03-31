// @generated — DO NOT EDIT. Customize in src/custom/tickets/

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const ticketsTable = defineTable({
  title: v.string(),
  description: v.optional(v.string()),
  status: v.string(),
  priority: v.string(),
  creatorId: v.id("users"),
});
