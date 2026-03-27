import { z } from "zod";

export const ACTIVITY_LOG_ENTITY_TYPE_VALUES = ["task", "project", "subtask"] as const;
export const activityLogEntityType = z.enum(ACTIVITY_LOG_ENTITY_TYPE_VALUES);
export type ActivityLogEntityType = z.infer<typeof activityLogEntityType>;

export const ACTIVITY_LOG_ACTION_VALUES = [
  "created", "status_changed", "assigned", "unassigned",
  "edited", "deleted", "completed", "promoted",
] as const;
export const activityLogAction = z.enum(ACTIVITY_LOG_ACTION_VALUES);
export type ActivityLogAction = z.infer<typeof activityLogAction>;
