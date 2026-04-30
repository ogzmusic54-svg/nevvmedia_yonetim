"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusBadge, TaskPriorityBadge } from "./status-badge";
import { updateTaskStatus, deleteTask } from "@/lib/actions/task";
import { taskStatusValues, taskStatusLabels } from "@/lib/validations/task";
import { formatDate } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  status: (typeof taskStatusValues)[number];
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: Date | string | null;
  assignedTo: { id: string; name: string } | null;
  customer?: { id: string; name: string };
};

export function TaskList({
  tasks,
  showCustomer = false,
}: {
  tasks: TaskItem[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: (typeof taskStatusValues)[number]) {
    startTransition(async () => {
      const res = await updateTaskStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Görevi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteTask(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Görev silindi");
      router.refresh();
    });
  }

  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz görev yok.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border bg-card">
      {tasks.map((t) => (
        <li
          key={t.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/gorevler/${t.id}`}
                className="font-medium hover:underline"
              >
                {t.title}
              </Link>
              <TaskPriorityBadge priority={t.priority} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {showCustomer && t.customer && (
                <Link
                  href={`/musteriler/${t.customer.id}`}
                  className="hover:underline"
                >
                  {t.customer.name}
                </Link>
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
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={t.status}
              onValueChange={(v) =>
                changeStatus(t.id, v as (typeof taskStatusValues)[number])
              }
              disabled={pending}
            >
              <SelectTrigger className="w-36">
                <SelectValue>
                  <TaskStatusBadge status={t.status} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {taskStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {taskStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(t.id)}
              disabled={pending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
