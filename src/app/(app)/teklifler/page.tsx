import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { QuoteList } from "@/components/quotes/quote-list";
import { QuoteFormDialog } from "@/components/quotes/quote-form-dialog";

export const metadata = { title: "Teklifler | Nevvmedia Yönetim" };

async function getData(userId: string, isAdmin: boolean) {
  try {
    const customerWhere = isAdmin ? {} : { assignments: { some: { userId } } };
    const [quotes, customers] = await Promise.all([
      prisma.quote.findMany({
        where: { customer: customerWhere },
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { id: true, name: true } } },
      }),
      prisma.customer.findMany({
        where: { ...customerWhere, status: { not: "LOST" } },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return { quotes, customers };
  } catch (e) {
    console.error(e);
    return { quotes: [], customers: [] };
  }
}

export default async function QuotesPage() {
  const user = await requireUser();
  const { quotes, customers } = await getData(user.id, user.role === "ADMIN");

  return (
    <>
      <PageHeader
        title="Teklifler"
        description="Müşterilere sunulan teklifler"
        actions={<QuoteFormDialog customers={customers} />}
      />
      <QuoteList
        quotes={quotes.map((q) => ({ ...q, amount: Number(q.amount) }))}
        showCustomer
      />
    </>
  );
}
