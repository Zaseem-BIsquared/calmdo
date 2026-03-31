// @generated — DO NOT EDIT. Customize in src/custom/contacts/

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contactsTable = defineTable({
  name: v.string(),
  email: v.optional(v.string()),
  company: v.optional(v.string()),
  status: v.string(),
  phone: v.optional(v.string()),
  creatorId: v.id("users"),
});
