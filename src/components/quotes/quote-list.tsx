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
  quoteStatusLabels,
  quoteStatusValues,
} from "@/lib/validations/quote";
import { updateQuoteStatus, deleteQuote } from "@/lib/actions/quote";
import { formatTRY, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<keyof typeof quoteStatusLabels, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  SENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  EXPIRED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

type QuoteItem = {
  id: string;
  title: string;
  amount: number | string;
  status: keyof typeof quoteStatusLabels;
  validUntil: Date | string | null;
  createdAt: Date | string;
  customer?: { id: string; name: string };
};

export function QuoteList({
  quotes,
  showCustomer = false,
}: {
  quotes: QuoteItem[];
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function changeStatus(id: string, status: keyof typeof quoteStatusLabels) {
    startTransition(async () => {
      const res = await updateQuoteStatus(id, status);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Teklifi silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const res = await deleteQuote(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Teklif silindi");
      router.refresh();
    });
  }

  if (quotes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz teklif yok.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left">Teklif</th>
            {showCustomer && <th className="px-4 py-2.5 text-left">Müşteri</th>}
            <th className="px-4 py-2.5 text-right">Tutar</th>
            <th className="px-4 py-2.5 text-left">Geçerlilik</th>
            <th className="px-4 py-2.5 text-left">Durum</th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {quotes.map((q) => (
            <tr key={q.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{q.title}</div>
              </td>
              {showCustomer && (
                <td className="px-4 py-3">
                  {q.customer ? (
                    <Link
                      href={`/musteriler/${q.customer.id}`}
                      className="hover:underline"
                    >
                      {q.customer.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-right font-medium">
                {formatTRY(Number(q.amount))}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {q.validUntil ? formatDate(q.validUntil) : "—"}
              </td>
              <td className="px-4 py-3">
                <Select
                  value={q.status}
                  onValueChange={(v) =>
                    changeStatus(q.id, v as keyof typeof quoteStatusLabels)
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue>
                      <Badge
                        variant="outline"
                        className={`border-transparent ${STATUS_STYLES[q.status]}`}
                      >
                        {quoteStatusLabels[q.status]}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {quoteStatusValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {quoteStatusLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(q.id)}
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
