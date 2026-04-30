"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/components/ui/card";
import { customerStatusLabels, customerStatusValues } from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/lib/actions/customer";

type CustomerInitial = {
  id?: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
  industry?: string | null;
  notes?: string | null;
  status?: (typeof customerStatusValues)[number];
};

export function CustomerForm({ initial }: { initial?: CustomerInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<(typeof customerStatusValues)[number]>(
    initial?.status ?? "ACTIVE",
  );

  function err(field: string) {
    return errors[field]?.[0];
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      website: String(fd.get("website") ?? ""),
      address: String(fd.get("address") ?? ""),
      taxOffice: String(fd.get("taxOffice") ?? ""),
      taxNumber: String(fd.get("taxNumber") ?? ""),
      industry: String(fd.get("industry") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      status,
    };

    startTransition(async () => {
      const res = initial?.id
        ? await updateCustomer(initial.id, payload)
        : await createCustomer(payload);

      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }

      toast.success(initial?.id ? "Müşteri güncellendi" : "Müşteri oluşturuldu");

      let target = "/musteriler";
      if (initial?.id) {
        target = `/musteriler/${initial.id}`;
      } else if (res.ok && "data" in res) {
        const data = res.data as { id?: string } | undefined;
        if (data?.id) target = `/musteriler/${data.id}`;
      }
      router.push(target);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Field label="Müşteri / Marka Adı *" error={err("name")}>
            <Input
              name="name"
              defaultValue={initial?.name ?? ""}
              required
              minLength={2}
              placeholder="Örn: ABC Şirketi"
            />
          </Field>
          <Field label="Şirket Ünvanı" error={err("company")}>
            <Input name="company" defaultValue={initial?.company ?? ""} />
          </Field>
          <Field label="E-posta" error={err("email")}>
            <Input
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
              placeholder="iletisim@firma.com"
            />
          </Field>
          <Field label="Telefon" error={err("phone")}>
            <Input
              name="phone"
              defaultValue={initial?.phone ?? ""}
              placeholder="+90 555 555 55 55"
            />
          </Field>
          <Field label="WhatsApp" error={err("whatsapp")}>
            <Input
              name="whatsapp"
              defaultValue={initial?.whatsapp ?? ""}
              placeholder="+90 555 555 55 55"
            />
          </Field>
          <Field label="Web Sitesi" error={err("website")}>
            <Input
              name="website"
              defaultValue={initial?.website ?? ""}
              placeholder="https://..."
            />
          </Field>
          <Field label="Sektör" error={err("industry")}>
            <Input
              name="industry"
              defaultValue={initial?.industry ?? ""}
              placeholder="E-ticaret, Yiyecek..."
            />
          </Field>
          <Field label="Durum">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customerStatusValues.map((s) => (
                  <SelectItem key={s} value={s}>
                    {customerStatusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Adres" error={err("address")} className="sm:col-span-2">
            <Input name="address" defaultValue={initial?.address ?? ""} />
          </Field>
          <Field label="Vergi Dairesi" error={err("taxOffice")}>
            <Input name="taxOffice" defaultValue={initial?.taxOffice ?? ""} />
          </Field>
          <Field label="Vergi No" error={err("taxNumber")}>
            <Input name="taxNumber" defaultValue={initial?.taxNumber ?? ""} />
          </Field>
          <Field label="Notlar" error={err("notes")} className="sm:col-span-2">
            <Textarea
              name="notes"
              rows={4}
              defaultValue={initial?.notes ?? ""}
              placeholder="Müşteri hakkında not, brief, beklentiler..."
            />
          </Field>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Vazgeç
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initial?.id ? "Güncelle" : "Oluştur"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
