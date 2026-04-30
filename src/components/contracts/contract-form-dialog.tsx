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
import { createContract } from "@/lib/actions/contract";
import {
  contractStatusLabels,
  contractStatusValues,
} from "@/lib/validations/contract";

type CustomerOption = { id: string; name: string };

export function ContractFormDialog({
  customerId,
  customers,
  trigger,
}: {
  customerId?: string;
  customers?: CustomerOption[];
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<(typeof contractStatusValues)[number]>("ACTIVE");
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId ?? "");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amountStr = String(fd.get("amount") ?? "").trim();
    const payload = {
      customerId: customerId ?? selectedCustomer,
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      amount: amountStr === "" ? undefined : Number(amountStr),
      startDate: String(fd.get("startDate") ?? ""),
      endDate: String(fd.get("endDate") ?? ""),
      status,
      fileUrl: String(fd.get("fileUrl") ?? ""),
    };

    if (!payload.customerId) {
      toast.error("Müşteri seçin");
      return;
    }
    if (!payload.startDate) {
      toast.error("Başlangıç tarihi gerekli");
      return;
    }

    startTransition(async () => {
      const res = await createContract(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Sözleşme kaydedildi");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> Yeni Sözleşme
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Sözleşme</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          {!customerId && customers && (
            <div className="space-y-1.5">
              <Label>Müşteri *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
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
            <Input name="title" required minLength={2} placeholder="Aylık ajans hizmeti sözleşmesi" />
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Textarea name="description" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Başlangıç *</Label>
              <Input type="date" name="startDate" required />
            </div>
            <div className="space-y-1.5">
              <Label>Bitiş</Label>
              <Input type="date" name="endDate" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tutar (TL)</Label>
            <Input name="amount" type="number" step="0.01" min="0" placeholder="50000.00" />
          </div>
          <div className="space-y-1.5">
            <Label>Sözleşme Dosya URL</Label>
            <Input name="fileUrl" placeholder="Dosyayı önce dosya bölümünden yükleyin" />
          </div>
          <div className="space-y-1.5">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contractStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {contractStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
