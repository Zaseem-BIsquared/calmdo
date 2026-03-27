import { z } from "zod";

export const WORK_LOG_BODY_MAX_LENGTH = 2000;

export const workLogBody = z
  .string()
  .min(1)
  .max(WORK_LOG_BODY_MAX_LENGTH)
  .trim();

export const createWorkLogInput = z.object({
  body: workLogBody,
  timeMinutes: z.number().int().positive().optional(),
});

export const updateWorkLogInput = z.object({
  body: workLogBody.optional(),
  timeMinutes: z.number().int().positive().optional(),
});
