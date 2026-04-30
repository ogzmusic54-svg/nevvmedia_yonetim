"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, UserPlus } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignUserToCustomer,
  unassignUserFromCustomer,
} from "@/lib/actions/customer";
import { getInitials } from "@/lib/utils";

type EmployeeOption = { id: string; name: string; email: string };
type CurrentAssignment = {
  id: string;
  role: string | null;
  user: { id: string; name: string };
};

type Props = {
  customerId: string;
  assignments: CurrentAssignment[];
  employees: EmployeeOption[];
  canManage: boolean;
};

export function AssignmentManager({
  customerId,
  assignments,
  employees,
  canManage,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [role, setRole] = useState("");
  const [pending, startTransition] = useTransition();

  const assignedIds = new Set(assignments.map((a) => a.user.id));
  const availableEmployees = employees.filter((e) => !assignedIds.has(e.id));

  function handleAssign() {
    if (!selectedUser) {
      toast.error("Bir çalışan seçin");
      return;
    }
    startTransition(async () => {
      const res = await assignUserToCustomer(customerId, selectedUser, role || undefined);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Çalışan atandı");
      setSelectedUser("");
      setRole("");
      setOpen(false);
      router.refresh();
    });
  }

  function handleRemove(userId: string, userName: string) {
    if (!confirm(`${userName} bu müşteriden çıkarılsın mı?`)) return;
    startTransition(async () => {
      const res = await unassignUserFromCustomer(customerId, userId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Atama kaldırıldı");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Atanan Ekip ({assignments.length})</h3>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4" /> Ekip Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Çalışan Ata</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Çalışan</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Çalışan seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmployees.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Atanabilecek çalışan yok
                        </div>
                      ) : (
                        availableEmployees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bu müşterideki rolü (opsiyonel)</Label>
                  <Input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Hesap Yöneticisi, Tasarımcı..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                  Vazgeç
                </Button>
                <Button onClick={handleAssign} disabled={pending || !selectedUser}>
                  <Plus className="h-4 w-4" /> Ata
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz atama yok.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg border bg-card p-2.5"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(a.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{a.user.name}</p>
                  {a.role && (
                    <p className="text-xs text-muted-foreground">{a.role}</p>
                  )}
                </div>
              </div>
              {canManage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => handleRemove(a.user.id, a.user.name)}
                  disabled={pending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
