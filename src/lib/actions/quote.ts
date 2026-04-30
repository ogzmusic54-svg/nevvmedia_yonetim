"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession } from "@/lib/auth-helpers";
import { quoteSchema, type QuoteInput } from "@/lib/validations/quote";
import type { ActionResult } from "@/lib/actions/customer";

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createQuote(input: QuoteInput): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const parsed = quoteSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { customerId, title, description, amount, status, validUntil } = parsed.data;
    await prisma.quote.create({
      data: {
        customerId,
        title,
        description,
        amount,
        status,
        validUntil: validUntil ? new Date(validUntil) : null,
        sentAt: status === "SENT" ? new Date() : null,
        acceptedAt: status === "ACCEPTED" ? new Date() : null,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "QUOTE_CREATED",
        description: `${user.name ?? "Bir kullanıcı"} "${title}" teklifini oluşturdu`,
        userId: user.id,
        customerId,
      },
    });
    revalidatePath(`/musteriler/${customerId}`);
    revalidatePath("/teklifler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Teklif oluşturulamadı");
  }
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteInput["status"],
): Promise<ActionResult> {
  try {
    await assertSession();
    const q = await prisma.quote.update({
      where: { id },
      data: {
        status,
        sentAt: status === "SENT" ? new Date() : undefined,
        acceptedAt: status === "ACCEPTED" ? new Date() : undefined,
      },
    });
    revalidatePath(`/musteriler/${q.customerId}`);
    revalidatePath("/teklifler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Durum güncellenemedi");
  }
}

export async function deleteQuote(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const q = await prisma.quote.delete({ where: { id } });
    revalidatePath(`/musteriler/${q.customerId}`);
    revalidatePath("/teklifler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Teklif silinemedi");
  }
}
