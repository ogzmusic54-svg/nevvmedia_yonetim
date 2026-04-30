import { z } from "zod";

export const taskStatusValues = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
] as const;

export const taskStatusLabels: Record<(typeof taskStatusValues)[number], string> = {
  TODO: "Yapılacak",
  IN_PROGRESS: "Devam Ediyor",
  REVIEW: "İnceleme",
  DONE: "Tamamlandı",
  CANCELLED: "İptal",
};

export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const taskPriorityLabels: Record<(typeof taskPriorityValues)[number], string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
};

export const taskSchema = z.object({
  customerId: z.string().min(1, "Müşteri seçin"),
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı"),
  description: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  status: z.enum(taskStatusValues).default("TODO"),
  priority: z.enum(taskPriorityValues).default("MEDIUM"),
  assignedToId: z
    .string()
    .transform((v) => (v === "" || v === "none" ? undefined : v))
    .optional(),
  dueDate: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
