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
import { createInvoice } from "@/lib/actions/invoice";
import {
  invoiceStatusLabels,
  invoiceStatusValues,
} from "@/lib/validations/invoice";

type CustomerOption = { id: string; name: string };

export function InvoiceFormDialog({
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
  const [status, setStatus] = useState<(typeof invoiceStatusValues)[number]>("PENDING");
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customerId ?? "");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      customerId: customerId ?? selectedCustomer,
      invoiceNo: String(fd.get("invoiceNo") ?? ""),
      period: String(fd.get("period") ?? ""),
      description: String(fd.get("description") ?? ""),
      amount: Number(fd.get("amount") ?? 0),
      status,
      dueDate: String(fd.get("dueDate") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    };

    if (!payload.customerId) {
      toast.error("Müşteri seçin");
      return;
    }

    startTransition(async () => {
      const res = await createInvoice(payload);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Fatura kaydedildi");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="h-4 w-4" /> Yeni Fatura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Fatura</DialogTitle>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fatura No</Label>
              <Input name="invoiceNo" placeholder="2026-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Dönem</Label>
              <Input name="period" placeholder="2026-04" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Açıklama</Label>
            <Input name="description" placeholder="Aylık ajans hizmeti" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tutar (TL) *</Label>
              <Input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="5000.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vade</Label>
              <Input type="date" name="dueDate" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {invoiceStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {invoiceStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notlar</Label>
            <Textarea name="notes" rows={2} />
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
