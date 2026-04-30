"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession } from "@/lib/auth-helpers";
import { contractSchema, type ContractInput } from "@/lib/validations/contract";
import type { ActionResult } from "@/lib/actions/customer";

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createContract(input: ContractInput): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const parsed = contractSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { customerId, title, description, amount, startDate, endDate, status, fileUrl } =
      parsed.data;
    await prisma.contract.create({
      data: {
        customerId,
        title,
        description,
        amount,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status,
        fileUrl,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "CONTRACT_CREATED",
        description: `${user.name ?? "Bir kullanıcı"} "${title}" sözleşmesini oluşturdu`,
        userId: user.id,
        customerId,
      },
    });
    revalidatePath(`/musteriler/${customerId}`);
    revalidatePath("/sozlesmeler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Sözleşme oluşturulamadı");
  }
}

export async function updateContractStatus(
  id: string,
  status: ContractInput["status"],
): Promise<ActionResult> {
  try {
    await assertSession();
    const c = await prisma.contract.update({ where: { id }, data: { status } });
    revalidatePath(`/musteriler/${c.customerId}`);
    revalidatePath("/sozlesmeler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Durum güncellenemedi");
  }
}

export async function deleteContract(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const c = await prisma.contract.delete({ where: { id } });
    revalidatePath(`/musteriler/${c.customerId}`);
    revalidatePath("/sozlesmeler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Sözleşme silinemedi");
  }
}
