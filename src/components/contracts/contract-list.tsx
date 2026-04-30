"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
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
  contractStatusLabels,
  contractStatusValues,
} from "@/lib/validations/contract";
import { updateContractStatus, deleteContract } from "@/lib/actions/contract";
import { formatTRY, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<keyof typeof contractStatusLabels, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

type ContractItem = {
  id: string;
  title: string;
  amount: number | string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  status: keyof typeof contractStatusLabels;
  fileUrl: string | null;
  customer?: { id: string; name: string };
};

export function ContractList({
  contracts,
  showCustomer = false,
}: {
  contracts: ContractItem[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: keyof typeof contractStatusLabels) {
    startTransition(async () => {
      const res = await updateContractStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Sözleşmeyi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteContract(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Sözleşme silindi");
      router.refresh();
    });
  }

  if (contracts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz sözleşme yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left">Sözleşme</th>
            {showCustomer && <th className="px-4 py-2.5 text-left">Müşteri</th>}
            <th className="px-4 py-2.5 text-left">Başlangıç</th>
            <th className="px-4 py-2.5 text-left">Bitiş</th>
            <th className="px-4 py-2.5 text-right">Tutar</th>
            <th className="px-4 py-2.5 text-left">Durum</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {contracts.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.title}</span>
                  {c.fileUrl && (
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </td>
              {showCustomer && (
                <td className="px-4 py-3">
                  {c.customer ? (
                    <Link
                      href={`/musteriler/${c.customer.id}`}
                      className="hover:underline"
                    >
                      {c.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-muted-foreground">{formatDate(c.startDate)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {c.endDate ? formatDate(c.endDate) : "Süresiz"}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {c.amount != null ? formatTRY(Number(c.amount)) : "—"}
              </td>
              <td className="px-4 py-3">
                <Select
                  value={c.status}
                  onValueChange={(v) =>
                    changeStatus(c.id, v as keyof typeof contractStatusLabels)
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge
                        variant="outline"
                        className={`border-transparent ${STATUS_STYLES[c.status]}`}
                      >
                        {contractStatusLabels[c.status]}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {contractStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {contractStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(c.id)}
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
