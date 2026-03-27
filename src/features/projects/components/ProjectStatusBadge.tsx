import type { ProjectStatus } from "@/shared/schemas/projects";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { colorClass: string; bgClass: string; label: string }
> = {
  active: {
    colorClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    label: "Active",
  },
  on_hold: {
    colorClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    label: "On Hold",
  },
  completed: {
    colorClass: "text-gray-700 dark:text-gray-400",
    bgClass: "bg-gray-100 dark:bg-gray-800/30",
    label: "Completed",
  },
  archived: {
    colorClass: "text-gray-500 dark:text-gray-500",
    bgClass: "bg-gray-100 dark:bg-gray-800/30 opacity-60",
    label: "Archived",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.colorClass} ${config.bgClass}`}
    >
      {config.label}
    </span>
  );
}
