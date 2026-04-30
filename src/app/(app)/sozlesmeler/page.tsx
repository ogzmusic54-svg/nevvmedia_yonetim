import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { ContractList } from "@/components/contracts/contract-list";
import { ContractFormDialog } from "@/components/contracts/contract-form-dialog";

export const metadata = { title: "Sözleşmeler | Nevvmedia Yönetim" };

async function getData(userId: string, isAdmin: boolean) {
  try {
    const customerWhere = isAdmin ? {} : { assignments: { some: { userId } } };
    const [contracts, customers] = await Promise.all([
      prisma.contract.findMany({
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
    return { contracts, customers };
  } catch (e) {
    console.error(e);
    return { contracts: [], customers: [] };
  }
}

export default async function ContractsPage() {
  const user = await requireUser();
  const { contracts, customers } = await getData(user.id, user.role === "ADMIN");

  return (
    <>
      <PageHeader
        title="Sözleşmeler"
        description="Aktif ve geçmiş sözleşmeler"
        actions={<ContractFormDialog customers={customers} />}
      />
      <ContractList
        contracts={contracts.map((c) => ({
          ...c,
          amount: c.amount != null ? Number(c.amount) : null,
        }))}
        showCustomer
      />
    </>
  );
}
