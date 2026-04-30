import {
  Users,
  ClipboardList,
  Receipt,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTRY } from "@/lib/utils";

export const metadata = { title: "Panel | Nevvmedia Yönetim" };

async function getStats(userId: string, isAdmin: boolean) {
  try {
    const customerWhere = isAdmin
      ? {}
      : { assignments: { some: { userId } } };
    const taskWhere = isAdmin ? {} : { assignedToId: userId };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      customerCount,
      activeTaskCount,
      monthInvoiceTotal,
      overdueInvoices,
      recentActivities,
      upcomingTasks,
    ] = await Promise.all([
      prisma.customer.count({ where: { ...customerWhere, status: { not: "LOST" } } }),
      prisma.task.count({
        where: { ...taskWhere, status: { in: ["TODO", "IN_PROGRESS", "REVIEW"] } },
      }),
      prisma.invoice.aggregate({
        where: { issueDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: {
          status: "PENDING",
          dueDate: { lt: now },
        },
      }),
      prisma.activityLog.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { user: true, customer: true },
      }),
      prisma.task.findMany({
        where: {
          ...taskWhere,
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueDate: { not: null },
        },
        take: 6,
        orderBy: { dueDate: "asc" },
        include: { customer: true, assignedTo: true },
      }),
    ]);

    return {
      customerCount,
      activeTaskCount,
      monthInvoiceTotal: Number(monthInvoiceTotal._sum.amount ?? 0),
      overdueInvoices,
      recentActivities,
      upcomingTasks,
      dbConnected: true,
    };
  } catch (e) {
    console.error("Dashboard verileri yüklenemedi:", e);
    return {
      customerCount: 0,
      activeTaskCount: 0,
      monthInvoiceTotal: 0,
      overdueInvoices: 0,
      recentActivities: [],
      upcomingTasks: [],
      dbConnected: false,
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const stats = await getStats(session?.user?.id ?? "", isAdmin);

  return (
    <>
      <PageHeader
        title={`Hoş geldin, ${session?.user?.name?.split(" ")[0] ?? "Kullanıcı"}`}
        description="Ajansınızın güncel durumuna hızlı bir bakış."
      />

      {!stats.dbConnected && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Veritabanına bağlanılamadı</p>
              <p className="mt-0.5 text-muted-foreground">
                <code>DATABASE_URL</code> ayarlarınızı kontrol edin ve{" "}
                <code>npx prisma migrate deploy</code> komutunu çalıştırın.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Müşteriler"
          value={stats.customerCount}
          icon={Users}
          tone="info"
          hint={isAdmin ? "Toplam aktif müşteri" : "Sana atanmış müşteri"}
        />
        <StatCard
          label="Açık Görevler"
          value={stats.activeTaskCount}
          icon={ClipboardList}
          tone="warning"
          hint={isAdmin ? "Tüm ekibin açık görevleri" : "Sana atanmış görevler"}
        />
        <StatCard
          label="Bu Ay Fatura"
          value={formatTRY(stats.monthInvoiceTotal)}
          icon={Receipt}
          tone="success"
          hint="Bu ay kesilen toplam"
        />
        <StatCard
          label="Geciken Fatura"
          value={stats.overdueInvoices}
          icon={AlertCircle}
          tone="danger"
          hint="Vadesi geçmiş ve ödenmemiş"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Yaklaşan Görevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Yaklaşan görev yok"
                description="Görevler eklendikçe burada gözükecek."
              />
            ) : (
              <ul className="divide-y">
                {stats.upcomingTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/gorevler/${t.id}`}
                      className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{t.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.customer.name}
                          {t.assignedTo && ` • ${t.assignedTo.name}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {t.dueDate ? formatDate(t.dueDate) : "—"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 ? (
              <EmptyState icon={Activity} title="Henüz aktivite yok" />
            ) : (
              <ul className="space-y-3">
                {stats.recentActivities.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5 text-sm">
                    <span>{a.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.user?.name ?? "Sistem"} • {formatDate(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
