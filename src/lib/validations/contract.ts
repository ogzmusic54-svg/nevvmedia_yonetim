import { z } from "zod";

export const contractStatusValues = ["ACTIVE", "EXPIRED", "CANCELLED"] as const;

export const contractStatusLabels: Record<(typeof contractStatusValues)[number], string> = {
  ACTIVE: "Aktif",
  EXPIRED: "Süresi Doldu",
  CANCELLED: "İptal",
};

export const contractSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().trim().min(2, "Başlık en az 2 karakter"),
  description: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  amount: z.coerce
    .number()
    .nonnegative("Tutar negatif olamaz")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  startDate: z.string().min(1, "Başlangıç tarihi gerekli"),
  endDate: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  status: z.enum(contractStatusValues).default("ACTIVE"),
  fileUrl: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;
