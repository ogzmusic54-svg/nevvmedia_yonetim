"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertSession } from "@/lib/auth-helpers";
import { taskSchema, type TaskInput } from "@/lib/validations/task";
import type { ActionResult } from "@/lib/actions/customer";

function fail<T = unknown>(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, error, fieldErrors };
}

export async function createTask(input: TaskInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await assertSession();
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik veya hatalı",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { customerId, title, description, status, priority, assignedToId, dueDate } =
      parsed.data;
    const task = await prisma.task.create({
      data: {
        customerId,
        title,
        description,
        status,
        priority,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdById: user.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "TASK_CREATED",
        description: `${user.name ?? "Bir kullanıcı"} "${title}" görevini oluşturdu`,
        userId: user.id,
        customerId,
      },
    });
    revalidatePath(`/musteriler/${customerId}`);
    revalidatePath("/gorevler");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: task.id } };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Görev oluşturulamadı");
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskInput["status"],
): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : null,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: status === "DONE" ? "TASK_COMPLETED" : "TASK_UPDATED",
        description: `${user.name ?? "Bir kullanıcı"} "${task.title}" görevinin durumunu güncelledi`,
        userId: user.id,
        customerId: task.customerId,
      },
    });
    revalidatePath(`/musteriler/${task.customerId}`);
    revalidatePath("/gorevler");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Durum güncellenemedi");
  }
}

export async function updateTask(
  id: string,
  input: TaskInput,
): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      return fail(
        "Form bilgileri eksik veya hatalı",
        z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      );
    }
    const { title, description, status, priority, assignedToId, dueDate } = parsed.data;
    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedAt: status === "DONE" ? new Date() : null,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "TASK_UPDATED",
        description: `${user.name ?? "Bir kullanıcı"} "${title}" görevini güncelledi`,
        userId: user.id,
        customerId: task.customerId,
      },
    });
    revalidatePath(`/musteriler/${task.customerId}`);
    revalidatePath("/gorevler");
    revalidatePath(`/gorevler/${id}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Görev güncellenemedi");
  }
}

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const task = await prisma.task.delete({ where: { id } });
    revalidatePath(`/musteriler/${task.customerId}`);
    revalidatePath("/gorevler");
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Görev silinemedi");
  }
}

export async function addTaskComment(
  taskId: string,
  content: string,
): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const trimmed = content.trim();
    if (!trimmed) return fail("Yorum boş olamaz");
    const comment = await prisma.taskComment.create({
      data: { taskId, userId: user.id, content: trimmed },
      include: { task: true },
    });
    await prisma.activityLog.create({
      data: {
        type: "TASK_COMMENTED",
        description: `${user.name ?? "Bir kullanıcı"} "${comment.task.title}" görevine yorum yaptı`,
        userId: user.id,
        customerId: comment.task.customerId,
      },
    });
    revalidatePath(`/gorevler/${taskId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Yorum eklenemedi");
  }
}
