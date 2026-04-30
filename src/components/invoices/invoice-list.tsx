"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  invoiceStatusLabels,
  invoiceStatusValues,
} from "@/lib/validations/invoice";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoice";
import { formatTRY, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<keyof typeof invoiceStatusLabels, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  OVERDUE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

type InvoiceItem = {
  id: string;
  invoiceNo: string | null;
  period: string | null;
  description: string | null;
  amount: number | string;
  status: keyof typeof invoiceStatusLabels;
  issueDate: Date | string;
  dueDate: Date | string | null;
  customer?: { id: string; name: string };
};

export function InvoiceList({
  invoices,
  showCustomer = false,
}: {
  invoices: InvoiceItem[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: keyof typeof invoiceStatusLabels) {
    startTransition(async () => {
      const res = await updateInvoiceStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Faturayı silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteInvoice(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Fatura silindi");
      router.refresh();
    });
  }

  if (invoices.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz fatura yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left">Fatura</th>
            {showCustomer && <th className="px-4 py-2.5 text-left">Müşteri</th>}
            <th className="px-4 py-2.5 text-left">Dönem</th>
            <th className="px-4 py-2.5 text-right">Tutar</th>
            <th className="px-4 py-2.5 text-left">Vade</th>
            <th className="px-4 py-2.5 text-left">Durum</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invoices.map((i) => (
            <tr key={i.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{i.invoiceNo ?? "—"}</div>
                {i.description && (
                  <div className="text-xs text-muted-foreground">{i.description}</div>
                )}
              </td>
              {showCustomer && (
                <td className="px-4 py-3">
                  {i.customer ? (
                    <Link
                      href={`/musteriler/${i.customer.id}`}
                      className="hover:underline"
                    >
                      {i.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground">{i.period ?? "—"}</td>
              <td className="px-4 py-3 text-right font-medium">
                {formatTRY(Number(i.amount))}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {i.dueDate ? formatDate(i.dueDate) : "—"}
              </td>
              <td className="px-4 py-3">
                <Select
                  value={i.status}
                  onValueChange={(v) =>
                    changeStatus(i.id, v as keyof typeof invoiceStatusLabels)
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge
                        variant="outline"
                        className={`border-transparent ${STATUS_STYLES[i.status]}`}
                      >
                        {invoiceStatusLabels[i.status]}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {invoiceStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(i.id)}
                  disabled={pending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
