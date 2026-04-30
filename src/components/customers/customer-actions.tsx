"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCustomer } from "@/lib/actions/customer";

export function CustomerActions({ id, isAdmin }: { id: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Bu müşteri ve TÜM ilgili veriler (görevler, faturalar, vb.) kalıcı olarak silinecek. Emin misiniz?")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteCustomer(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Müşteri silindi");
      router.push("/musteriler");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={pending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/musteriler/${id}/duzenle`}>
            <Edit className="h-4 w-4" /> Düzenle
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" /> Sil
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
