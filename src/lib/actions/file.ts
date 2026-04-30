"use server";

import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertSession } from "@/lib/auth-helpers";
import type { ActionResult } from "@/lib/actions/customer";

const ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-rar-compressed",
];

function fail<T = unknown>(error: string): ActionResult<T> {
  return { ok: false, error };
}

function getUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

export async function uploadFile(formData: FormData): Promise<ActionResult> {
  try {
    const user = await assertSession();
    const file = formData.get("file") as File | null;
    const customerId = formData.get("customerId") as string | null;
    const taskId = formData.get("taskId") as string | null;

    if (!file || !(file instanceof File)) return fail("Dosya seçilmedi");
    if (!customerId && !taskId) return fail("Müşteri veya görev belirtilmedi");

    const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "25");
    if (file.size > maxMb * 1024 * 1024) {
      return fail(`Dosya boyutu ${maxMb}MB sınırını aşıyor`);
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return fail(`Desteklenmeyen dosya türü: ${file.type}`);
    }

    const uploadDir = getUploadDir();
    const subDir = customerId ? `customers/${customerId}` : `tasks/${taskId}`;
    const targetDir = path.join(uploadDir, subDir);
    await fs.mkdir(targetDir, { recursive: true });

    const ext = path.extname(file.name) || "";
    const storedName = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const fullPath = path.join(targetDir, storedName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    await prisma.uploadedFile.create({
      data: {
        customerId: customerId || null,
        taskId: taskId || null,
        name: file.name,
        storedName,
        path: path.posix.join(subDir, storedName),
        size: file.size,
        mimeType: file.type,
        uploadedById: user.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        type: "FILE_UPLOADED",
        description: `${user.name ?? "Bir kullanıcı"} "${file.name}" dosyasını yükledi`,
        userId: user.id,
        customerId: customerId || null,
      },
    });

    if (customerId) revalidatePath(`/musteriler/${customerId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Dosya yüklenemedi");
  }
}

export async function deleteFile(id: string): Promise<ActionResult> {
  try {
    await assertSession();
    const file = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!file) return fail("Dosya bulunamadı");
    const fullPath = path.join(getUploadDir(), file.path);
    await fs.unlink(fullPath).catch(() => {});
    await prisma.uploadedFile.delete({ where: { id } });
    if (file.customerId) revalidatePath(`/musteriler/${file.customerId}`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return fail((e as Error).message ?? "Dosya silinemedi");
  }
}
