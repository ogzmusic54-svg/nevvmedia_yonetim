import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");
  return session.user as {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    name?: string | null;
    email?: string | null;
  };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}

export class AuthError extends Error {
  constructor(msg = "Yetkisiz işlem") {
    super(msg);
    this.name = "AuthError";
  }
}

export async function assertSession() {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError("Giriş yapmanız gerekli");
  return session.user as {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    name?: string | null;
    email?: string | null;
  };
}

export async function assertAdmin() {
  const u = await assertSession();
  if (u.role !== "ADMIN") throw new AuthError("Bu işlem için yönetici yetkisi gerekli");
  return u;
}
