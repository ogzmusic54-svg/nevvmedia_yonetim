import { z } from "zod";

export const customerStatusValues = [
  "LEAD",
  "PROSPECT",
  "ACTIVE",
  "INACTIVE",
  "LOST",
] as const;

export const customerStatusLabels: Record<(typeof customerStatusValues)[number], string> = {
  LEAD: "Aday",
  PROSPECT: "Potansiyel",
  ACTIVE: "Aktif",
  INACTIVE: "Pasif",
  LOST: "Kayıp",
};

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı"),
  company: optionalString,
  email: optionalString.refine(
    (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    "Geçerli bir e-posta girin",
  ),
  phone: optionalString,
  whatsapp: optionalString,
  website: optionalString,
  address: optionalString,
  taxOffice: optionalString,
  taxNumber: optionalString,
  industry: optionalString,
  notes: optionalString,
  status: z.enum(customerStatusValues).default("ACTIVE"),
});

export type CustomerInput = z.infer<typeof customerSchema>;
