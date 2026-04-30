"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "@/lib/actions/task";
import {
  taskPriorityLabels,
  taskPriorityValues,
  taskStatusLabels,
  taskStatusValues,
} from "@/lib/validations/task";

type Employee = { id: string; name: string };
type CustomerOption = { id: string; name: string };

type TaskInitial = {
  id?: string;
  title?: string;
  description?: string | null;
  status?: (typeof taskStatusValues)[number];
  priority?: (typeof taskPriorityValues)[number];
  assignedToId?: string | null;
  dueDate?: Date | string | null;
  customerId?: string;
};

type Props = {
  trigger?: React.ReactNode;
  customerId?: string;
  customers?: CustomerOption[];
  employees: Employee[];
  initial?: TaskInitial;
};

export function TaskFormDialog({
  trigger,
  customerId,
  customers,
  employees,
  initial,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<(typeof taskStatusValues)[number]>(
    initial?.status ?? "TODO",
  );
  const [priority, setPriority] = useState<(typeof taskPriorityValues)[number]>(
    initial?.priority ?? "MEDIUM",
  );
  const [assignedTo, setAssignedTo] = useState<string>(
    initial?.assignedToId ?? "none",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customerId ?? initial?.customerId ?? "",
  );

  const initialDueDate =
    initial?.dueDate instanceof Date
      ? initial.dueDate.toISOString().slice(0, 10)
      : typeof initial?.dueDate === "string"
        ? initial.dueDate.slice(0, 10)
        : "";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      customerId: customerId ?? selectedCustomerId,
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      status,
      priority,
      assignedToId: assignedTo === "none" ? "" : assignedTo,
      dueDate: String(fd.get("dueDate") ?? ""),
    };

    if (!payload.customerId) {
      toast.error("Müşteri seçin");
      return;
    }

    startTransition(async () => {
      const res = initial?.id
        ? await updateTask(initial.id, payload)
        : await createTask(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(initial?.id ? "Görev güncellendi" : "Görev oluşturuldu");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Yeni Görev
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Görevi Düzenle" : "Yeni Görev"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          {!customerId && customers && (
            <div className="space-y-1.5">
              <Label>Müşteri *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Başlık *</Label>
            <Input
              name="title"
              defaultValue={initial?.title ?? ""}
              required
              minLength={2}
              placeholder="Örn: Logo revizyonu"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Textarea
              name="description"
              rows={3}
              defaultValue={initial?.description ?? ""}
              placeholder="Detaylar, brief, beklentiler..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {taskStatusLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Öncelik</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskPriorityValues.map((p) => (
                    <SelectItem key={p} value={p}>
                      {taskPriorityLabels[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Atanan</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Atanmamış</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Son Tarih</Label>
              <Input type="date" name="dueDate" defaultValue={initialDueDate} />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {initial?.id ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
