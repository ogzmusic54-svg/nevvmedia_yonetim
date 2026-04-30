"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession, assertAdmin } from "@/lib/auth-helpers";
import { customerSchema, type CustomerInput } from "@/lib/validations/customer";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertSession();
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik veya hatalı",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const customer = await prisma.customer.create({
      data: { ...parsed.data, createdById: user.id },
    });
    await prisma.activityLog.create({
      data: {
        type: "CUSTOMER_CREATED",
        description: `${user.name ?? "Bir kullanıcı"} "${customer.name}" müşterisini ekledi`,
        userId: user.id,
        customerId: customer.id,
      },
    });
    revalidatePath("/musteriler");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: customer.id } };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Müşteri oluşturulamadı");
  }
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik veya hatalı",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    await prisma.customer.update({ where: { id }, data: parsed.data });
    await prisma.activityLog.create({
      data: {
        type: "CUSTOMER_UPDATED",
        description: `${user.name ?? "Bir kullanıcı"} "${parsed.data.name}" müşterisini güncelledi`,
        userId: user.id,
        customerId: id,
      },
    });
    revalidatePath("/musteriler");
    revalidatePath(`/musteriler/${id}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Müşteri güncellenemedi");
  }
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/musteriler");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Müşteri silinemedi");
  }
}

export async function assignUserToCustomer(
  customerId: string,
  userId: string,
  role?: string,
): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.customerAssignment.upsert({
      where: { customerId_userId: { customerId, userId } },
      update: { role },
      create: { customerId, userId, role },
    });
    revalidatePath(`/musteriler/${customerId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Atama yapılamadı");
  }
}

export async function unassignUserFromCustomer(
  customerId: string,
  userId: string,
): Promise<ActionResult> {
  try {
    await assertSession();
    await prisma.customerAssignment.delete({
      where: { customerId_userId: { customerId, userId } },
    });
    revalidatePath(`/musteriler/${customerId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Atama kaldırılamadı");
  }
}
