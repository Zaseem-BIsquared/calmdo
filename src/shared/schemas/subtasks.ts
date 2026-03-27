import { z } from "zod";

export const SUBTASK_TITLE_MAX_LENGTH = 200;

export const SUBTASK_STATUS_VALUES = ["todo", "done", "promoted"] as const;
export const subtaskStatus = z.enum(SUBTASK_STATUS_VALUES);
export type SubtaskStatus = z.infer<typeof subtaskStatus>;

export const subtaskTitle = z
  .string()
  .min(1)
  .max(SUBTASK_TITLE_MAX_LENGTH)
  .trim();

export const createSubtaskInput = z.object({
  title: subtaskTitle,
});

export const updateSubtaskInput = z.object({
  title: subtaskTitle.optional(),
});
