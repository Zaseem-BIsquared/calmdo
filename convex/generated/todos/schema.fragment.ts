// @generated — DO NOT EDIT. Customize in src/custom/todos/

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const todosTable = defineTable({
  title: v.string(),
  completed: v.optional(v.boolean()),
  creatorId: v.id("users"),
});
