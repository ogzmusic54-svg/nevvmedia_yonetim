"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CalendarClock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { TaskPriorityBadge } from "./status-badge";
import { taskStatusLabels, taskStatusValues } from "@/lib/validations/task";
import { updateTaskStatus } from "@/lib/actions/task";
import { formatDate, cn } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  status: (typeof taskStatusValues)[number];
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | string | null;
  assignedTo: { id: string; name: string } | null;
  customer?: { id: string; name: string };
};

const COLUMNS: (typeof taskStatusValues)[number][] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
];

const COLUMN_HEADERS: Record<(typeof taskStatusValues)[number], string> = {
  TODO: "border-t-slate-400",
  IN_PROGRESS: "border-t-indigo-400",
  REVIEW: "border-t-purple-400",
  DONE: "border-t-emerald-400",
  CANCELLED: "border-t-rose-400",
};

export function TaskKanban({
  tasks,
  showCustomer = false,
}: {
  tasks: TaskItem[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function moveTask(id: string, status: (typeof taskStatusValues)[number]) {
    startTransition(async () => {
      const res = await updateTaskStatus(id, status);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
  }

  function onDrop(e: React.DragEvent, status: (typeof taskStatusValues)[number]) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) moveTask(id, status);
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, col)}
            className={cn(
              "flex flex-col rounded-xl border-t-4 bg-muted/40 p-3",
              COLUMN_HEADERS[col],
              pending && "opacity-70",
            )}
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold">{taskStatusLabels[col]}</h3>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {colTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-32">
              {colTasks.map((t) => (
                <Card
                  key={t.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/gorevler/${t.id}`}
                        className="text-sm font-medium leading-snug hover:underline"
                      >
                        {t.title}
                      </Link>
                      <TaskPriorityBadge priority={t.priority} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {showCustomer && t.customer && (
                        <span className="rounded bg-background px-1.5 py-0.5">
                          {t.customer.name}
                        </span>
                      )}
                      {t.assignedTo && (
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> {t.assignedTo.name}
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" /> {formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {colTasks.length === 0 && (
                <p className="rounded border border-dashed py-4 text-center text-xs text-muted-foreground">
                  Boş
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
