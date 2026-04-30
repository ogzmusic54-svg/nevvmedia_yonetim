import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Giriş Yap | Nevvmedia Yönetim",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-2xl font-bold shadow-lg">
            N
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Nevvmedia Yönetim
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hesabınıza giriş yapın
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <Suspense
            fallback={
              <div className="text-center text-sm text-muted-foreground">
                Yükleniyor...
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nevvmedia. Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
