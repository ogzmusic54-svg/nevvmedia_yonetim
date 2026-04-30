import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "info@nevvmedia.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Nevvmedia2026!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Nevvmedia Yönetici";

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });

  if (existing) {
    console.log(`Admin kullanıcı zaten mevcut: ${adminEmail}`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      password: hashed,
      name: adminName,
      role: UserRole.ADMIN,
    },
  });

  console.log("✓ Admin kullanıcı oluşturuldu:");
  console.log(`  E-posta: ${admin.email}`);
  console.log(`  Şifre  : ${adminPassword}`);
  console.log("  >>> İlk girişten sonra şifreyi mutlaka değiştirin <<<");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
