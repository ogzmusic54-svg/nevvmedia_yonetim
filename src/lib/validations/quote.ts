import { z } from "zod";

export const quoteStatusValues = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;

export const quoteStatusLabels: Record<(typeof quoteStatusValues)[number], string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  ACCEPTED: "Kabul",
  REJECTED: "Red",
  EXPIRED: "Süresi Doldu",
};

export const quoteSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().trim().min(2, "Başlık en az 2 karakter"),
  description: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  amount: z.coerce.number().positive("Tutar 0'dan büyük olmalı"),
  status: z.enum(quoteStatusValues).default("DRAFT"),
  validUntil: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;
