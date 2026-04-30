import { redirect } from "next/navigation";
import { Settings, MessageCircle, Database, HardDrive } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ayarlar | Nevvmedia Yönetim" };

export default async function SettingsPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/dashboard");

  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const evolutionInstance = process.env.EVOLUTION_INSTANCE;
  const evolutionConfigured = Boolean(evolutionUrl && process.env.EVOLUTION_API_KEY && evolutionInstance);
  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  const maxUpload = process.env.MAX_UPLOAD_SIZE_MB ?? "25";

  return (
    <>
      <PageHeader
        title="Ayarlar"
        description="Sistem yapılandırması ve entegrasyonlar"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              WhatsApp (Evolution API)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="Durum"
              value={
                evolutionConfigured ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Yapılandırıldı
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Yapılandırılmadı
                  </span>
                )
              }
            />
            <Row label="API URL" value={evolutionUrl || "—"} mono />
            <Row label="Instance" value={evolutionInstance || "—"} mono />
            <p className="pt-2 text-xs text-muted-foreground">
              Bildirimler için <code>.env</code> dosyanızda <code>EVOLUTION_API_URL</code>,{" "}
              <code>EVOLUTION_API_KEY</code> ve <code>EVOLUTION_INSTANCE</code>{" "}
              değerlerini ayarlayın. Faz 3&apos;te otomatik bildirim gönderimi
              eklenecek.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Dosya Depolama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Yükleme dizini" value={uploadDir} mono />
            <Row label="Maks. dosya boyutu" value={`${maxUpload} MB`} />
            <p className="pt-2 text-xs text-muted-foreground">
              Coolify üzerinde dosyaları kalıcı saklamak için bu dizini bir{" "}
              <code>persistent volume</code> olarak bağlayın.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Veritabanı
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row
              label="Tür"
              value={process.env.DATABASE_URL?.startsWith("postgresql://") ? "PostgreSQL" : "—"}
            />
            <p className="pt-2 text-xs text-muted-foreground">
              Bağlantı bilgileri <code>DATABASE_URL</code> ortam değişkeninden okunur.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Uygulama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Uygulama Adı" value={process.env.APP_NAME ?? "Nevvmedia Yönetim"} />
            <Row label="URL" value={process.env.APP_URL ?? "—"} mono />
            <Row label="Sürüm" value="1.0.0" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
    </div>
  );
}
