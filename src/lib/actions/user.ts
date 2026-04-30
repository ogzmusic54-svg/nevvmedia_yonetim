"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession, assertAdmin } from "@/lib/auth-helpers";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ChangePasswordInput,
} from "@/lib/validations/user";
import type { ActionResult } from "@/lib/actions/customer";

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createUser(input: CreateUserInput): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { name, email, password, role, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return fail("Bu e-posta zaten kayıtlı");

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role,
        phone,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "USER_CREATED",
        description: `${admin.name ?? "Yönetici"} "${name}" kullanıcısını oluşturdu`,
        userId: admin.id,
      },
    });
    revalidatePath("/kullanicilar");
    return { ok: true, data: { id: user.id } };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Kullanıcı oluşturulamadı");
  }
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    await prisma.user.update({ where: { id }, data: parsed.data });
    revalidatePath("/kullanicilar");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Kullanıcı güncellenemedi");
  }
}

export async function deactivateUser(id: string): Promise<ActionResult> {
  try {
    const admin = await assertAdmin();
    if (admin.id === id) return fail("Kendi hesabınızı pasifleştiremezsiniz");
    await prisma.user.update({ where: { id }, data: { active: false } });
    revalidatePath("/kullanicilar");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Kullanıcı pasifleştirilemedi");
  }
}

export async function reactivateUser(id: string): Promise<ActionResult> {
  try {
    await assertAdmin();
    await prisma.user.update({ where: { id }, data: { active: true } });
    revalidatePath("/kullanicilar");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Kullanıcı aktifleştirilemedi");
  }
}

export async function adminResetPassword(
  id: string,
  newPassword: string,
): Promise<ActionResult> {
  try {
    await assertAdmin();
    if (newPassword.length < 8) return fail("Şifre en az 8 karakter olmalı");
    await prisma.user.update({
      where: { id },
      data: { password: await hashPassword(newPassword) },
    });
    revalidatePath("/kullanicilar");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Şifre sıfırlanamadı");
  }
}

export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  try {
    const me = await assertSession();
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) return fail("Kullanıcı bulunamadı");

    const ok = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!ok) return fail("Mevcut şifre hatalı");

    await prisma.user.update({
      where: { id: me.id },
      data: { password: await hashPassword(parsed.data.newPassword) },
    });
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Şifre değiştirilemedi");
  }
}

export async function updateOwnProfile(input: {
  name?: string;
  phone?: string;
}): Promise<ActionResult> {
  try {
    const me = await assertSession();
    const name = input.name?.trim();
    const phone = input.phone?.trim() || null;
    if (name && name.length < 2) return fail("İsim en az 2 karakter olmalı");
    await prisma.user.update({
      where: { id: me.id },
      data: { name: name ?? undefined, phone },
    });
    revalidatePath("/profil");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Profil güncellenemedi");
  }
}
