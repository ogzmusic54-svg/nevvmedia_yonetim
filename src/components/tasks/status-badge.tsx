import { Badge } from "@/components/ui/badge";
import { taskStatusLabels, taskPriorityLabels } from "@/lib/validations/task";

const STATUS_STYLES: Record<keyof typeof taskStatusLabels, string> = {
  TODO: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  REVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

const PRIORITY_STYLES: Record<keyof typeof taskPriorityLabels, string> = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  URGENT: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function TaskStatusBadge({ status }: { status: keyof typeof taskStatusLabels }) {
  return (
    <Badge variant="outline" className={`border-transparent ${STATUS_STYLES[status]}`}>
      {taskStatusLabels[status]}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: keyof typeof taskPriorityLabels }) {
  return (
    <Badge variant="outline" className={`border-transparent ${PRIORITY_STYLES[priority]}`}>
      {taskPriorityLabels[priority]}
    </Badge>
  );
}
