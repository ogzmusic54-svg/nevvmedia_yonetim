import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function EditCustomerPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  await requireUser();
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <>
      <PageHeader
        title={`${customer.name} — Düzenle`}
        description="Müşteri bilgilerini güncelleyin."
      />
      <div className="max-w-4xl">
        <CustomerForm initial={customer} />
      </div>
    </>
  );
}
