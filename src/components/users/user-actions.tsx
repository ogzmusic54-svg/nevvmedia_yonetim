"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MoreHorizontal, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminResetPassword,
  deactivateUser,
  reactivateUser,
} from "@/lib/actions/user";

type Props = {
  userId: string;
  active: boolean;
  isSelf: boolean;
};

export function UserActions({ userId, active, isSelf }: Props) {
  const router = useRouter();
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pending, startTransition] = useTransition();

  function onToggleActive() {
    const action = active ? deactivateUser : reactivateUser;
    startTransition(async () => {
      const res = await action(userId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(active ? "Kullanıcı pasifleştirildi" : "Kullanıcı aktifleştirildi");
      router.refresh();
    });
  }

  function onResetPassword() {
    if (newPw.length < 8) {
      toast.error("Şifre en az 8 karakter olmalı");
      return;
    }
    startTransition(async () => {
      const res = await adminResetPassword(userId, newPw);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Şifre sıfırlandı");
      setPwOpen(false);
      setNewPw("");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setPwOpen(true)}>
            <KeyRound className="h-4 w-4" /> Şifre Sıfırla
          </DropdownMenuItem>
          {!isSelf && (
            <DropdownMenuItem onClick={onToggleActive}>
              {active ? (
                <>
                  <PowerOff className="h-4 w-4" /> Pasifleştir
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" /> Aktifleştir
                </>
              )}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Sıfırla</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Yeni Şifre</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={8}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Yeni şifreyi kullanıcıya güvenli bir şekilde iletmeyi unutmayın.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pending}>
              Vazgeç
            </Button>
            <Button onClick={onResetPassword} disabled={pending}>
              Sıfırla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
