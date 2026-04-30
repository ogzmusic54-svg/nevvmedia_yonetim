import { PageHeader } from "@/components/common/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireUser } from "@/lib/auth-helpers";

export const metadata = { title: "Yeni Müşteri | Nevvmedia Yönetim" };

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="Yeni Müşteri"
        description="Müşteri/marka bilgilerini doldurun."
      />
      <div className="max-w-4xl">
        <CustomerForm />
      </div>
    </>
  );
}
