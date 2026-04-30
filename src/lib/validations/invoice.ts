import { z } from "zod";

export const invoiceStatusValues = ["PENDING", "PAID", "OVERDUE", "CANCELLED"] as const;

export const invoiceStatusLabels: Record<(typeof invoiceStatusValues)[number], string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  OVERDUE: "Gecikti",
  CANCELLED: "İptal",
};

export const invoiceSchema = z.object({
  customerId: z.string().min(1, "Müşteri gerekli"),
  invoiceNo: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  period: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  description: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  amount: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
  status: z.enum(invoiceStatusValues).default("PENDING"),
  dueDate: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  notes: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
