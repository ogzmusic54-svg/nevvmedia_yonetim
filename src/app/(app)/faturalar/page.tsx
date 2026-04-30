import { Receipt, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { formatTRY } from "@/lib/utils";

export const metadata = { title: "Faturalar | Nevvmedia Yönetim" };

async function getData(userId: string, isAdmin: boolean) {
  try {
    const customerWhere = isAdmin
      ? {}
      : { assignments: { some: { userId } } };

    const [invoices, customers, sums] = await Promise.all([
      prisma.invoice.findMany({
        where: { customer: customerWhere },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        include: { customer: { select: { id: true, name: true } } },
      }),
      prisma.customer.findMany({
        where: { ...customerWhere, status: { not: "LOST" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.invoice.groupBy({
        by: ["status"],
        where: { customer: customerWhere },
        _sum: { amount: true },
      }),
    ]);

    const totals = {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
    };
    for (const s of sums) {
      const amt = Number(s._sum.amount ?? 0);
      totals.total += amt;
      if (s.status === "PAID") totals.paid += amt;
      else if (s.status === "PENDING") totals.pending += amt;
      else if (s.status === "OVERDUE") totals.overdue += amt;
    }
    return { invoices, customers, totals };
  } catch (e) {
    console.error(e);
    return {
      invoices: [],
      customers: [],
      totals: { total: 0, paid: 0, pending: 0, overdue: 0 },
    };
  }
}

export default async function InvoicesPage() {
  const user = await requireUser();
  const { invoices, customers, totals } = await getData(user.id, user.role === "ADMIN");

  return (
    <>
      <PageHeader
        title="Faturalar"
        description="Tüm dönemlerin fatura takibi"
        actions={<InvoiceFormDialog customers={customers} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Toplam"
          value={formatTRY(totals.total)}
          icon={Receipt}
          tone="info"
        />
        <StatCard
          label="Tahsil Edilen"
          value={formatTRY(totals.paid)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Bekleyen"
          value={formatTRY(totals.pending)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Geciken"
          value={formatTRY(totals.overdue)}
          icon={AlertCircle}
          tone="danger"
        />
      </div>

      <InvoiceList
        invoices={invoices.map((i) => ({ ...i, amount: Number(i.amount) }))}
        showCustomer
      />
    </>
  );
}
