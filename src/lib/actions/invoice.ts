"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession } from "@/lib/auth-helpers";
import { invoiceSchema, type InvoiceInput } from "@/lib/validations/invoice";
import type { ActionResult } from "@/lib/actions/customer";

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createInvoice(input: InvoiceInput): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const parsed = invoiceSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik veya hatalı",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { customerId, invoiceNo, period, description, amount, status, dueDate, notes } =
      parsed.data;
    const invoice = await prisma.invoice.create({
      data: {
        customerId,
        invoiceNo,
        period,
        description,
        amount,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidAt: status === "PAID" ? new Date() : null,
        notes,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "INVOICE_CREATED",
        description: `${user.name ?? "Bir kullanıcı"} ${amount} TL'lik fatura oluşturdu`,
        userId: user.id,
        customerId,
      },
    });
    revalidatePath(`/musteriler/${customerId}`);
    revalidatePath("/faturalar");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: invoice.id } };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Fatura oluşturulamadı");
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceInput["status"],
): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const inv = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });
    if (status === "PAID") {
      await prisma.activityLog.create({
        data: {
          type: "INVOICE_PAID",
          description: `${user.name ?? "Bir kullanıcı"} ${inv.amount.toString()} TL'lik faturayı ödenmiş olarak işaretledi`,
          userId: user.id,
          customerId: inv.customerId,
        },
      });
    }
    revalidatePath(`/musteriler/${inv.customerId}`);
    revalidatePath("/faturalar");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Durum güncellenemedi");
  }
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const inv = await prisma.invoice.delete({ where: { id } });
    revalidatePath(`/musteriler/${inv.customerId}`);
    revalidatePath("/faturalar");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Fatura silinemedi");
  }
}
