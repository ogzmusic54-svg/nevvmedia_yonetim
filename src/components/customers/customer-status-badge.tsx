import { Badge } from "@/components/ui/badge";
import { customerStatusLabels } from "@/lib/validations/customer";

const STYLES: Record<keyof typeof customerStatusLabels, string> = {
  LEAD: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  PROSPECT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  INACTIVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  LOST: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function CustomerStatusBadge({ status }: { status: keyof typeof customerStatusLabels }) {
  return (
    <Badge variant="outline" className={`border-transparent ${STYLES[status]}`}>
      {customerStatusLabels[status]}
    </Badge>
  );
}
