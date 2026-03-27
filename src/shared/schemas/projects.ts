import { z } from "zod";

export const PROJECT_STATUS_VALUES = [
  "active",
  "on_hold",
  "completed",
  "archived",
] as const;
export const projectStatus = z.enum(PROJECT_STATUS_VALUES);
export type ProjectStatus = z.infer<typeof projectStatus>;

export const PROJECT_NAME_MAX_LENGTH = 100;
export const projectName = z.string().min(1).max(PROJECT_NAME_MAX_LENGTH).trim();

export const createProjectInput = z.object({ name: projectName });
export const updateProjectInput = z.object({
  name: projectName.optional(),
  status: projectStatus.optional(),
});
