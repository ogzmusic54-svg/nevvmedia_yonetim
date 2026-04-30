import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const role = (session.user as { role?: string }).role;
  if (role !== "ADMIN" && file.customerId) {
    const allowed = await prisma.customerAssignment.findUnique({
      where: { customerId_userId: { customerId: file.customerId, userId: session.user.id } },
    });
    if (!allowed) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const fullPath = path.join(getUploadDir(), file.path);
  try {
    const data = await fs.readFile(fullPath);
    return new NextResponse(data as unknown as BodyInit, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }
}
