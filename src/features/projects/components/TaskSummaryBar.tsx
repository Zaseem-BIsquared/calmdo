interface TaskSummaryCounts {
  todo: number;
  in_progress: number;
  done: number;
}

export function TaskSummaryBar({ counts }: { counts: TaskSummaryCounts }) {
  const total = counts.todo + counts.in_progress + counts.done;
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-primary/60">
        {counts.todo} todo &middot; {counts.in_progress} in progress &middot;{" "}
        {counts.done} done
      </p>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {counts.todo > 0 && (
          <div
            className="bg-blue-500"
            style={{ width: `${(counts.todo / total) * 100}%` }}
          />
        )}
        {counts.in_progress > 0 && (
          <div
            className="bg-yellow-500"
            style={{ width: `${(counts.in_progress / total) * 100}%` }}
          />
        )}
        {counts.done > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${(counts.done / total) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
