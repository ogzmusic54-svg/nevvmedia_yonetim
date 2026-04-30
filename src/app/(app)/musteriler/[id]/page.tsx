import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  StickyNote,
  Tag,
  ExternalLink,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerActions } from "@/components/customers/customer-actions";
import { AssignmentManager } from "@/components/customers/assignment-manager";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { QuoteList } from "@/components/quotes/quote-list";
import { QuoteFormDialog } from "@/components/quotes/quote-form-dialog";
import { ContractList } from "@/components/contracts/contract-list";
import { ContractFormDialog } from "@/components/contracts/contract-form-dialog";
import { FileList } from "@/components/files/file-list";
import { FileUploader } from "@/components/files/file-uploader";
import { formatTRY } from "@/lib/utils";

export default async function CustomerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await requireUser();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignments: { include: { user: true } },
      tasks: {
        orderBy: { createdAt: "desc" },
        include: { assignedTo: { select: { id: true, name: true } } },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      contracts: { orderBy: { createdAt: "desc" } },
      files: {
        where: { taskId: null },
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });

  if (!customer) notFound();

  // Yetki: çalışan ise atanmış olmalı
  if (user.role !== "ADMIN") {
    const isAssigned = customer.assignments.some((a) => a.userId === user.id);
    if (!isAssigned) {
      return (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Bu müşteriyi görüntüleme yetkiniz yok.
          </CardContent>
        </Card>
      );
    }
  }

  const employees = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const totalInvoices = customer.invoices.reduce(
    (s, i) => s + Number(i.amount),
    0,
  );
  const paidInvoices = customer.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.company ?? undefined}
        actions={<CustomerActions id={customer.id} isAdmin={user.role === "ADMIN"} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Müşteri Bilgileri</CardTitle>
                <CustomerStatusBadge status={customer.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.company && (
                <Detail icon={Building2} label="Ünvan" value={customer.company} />
              )}
              {customer.industry && (
                <Detail icon={Tag} label="Sektör" value={customer.industry} />
              )}
              {customer.email && (
                <Detail
                  icon={Mail}
                  label="E-posta"
                  value={
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:underline"
                    >
                      {customer.email}
                    </a>
                  }
                />
              )}
              {customer.phone && (
                <Detail
                  icon={Phone}
                  label="Telefon"
                  value={
                    <a href={`tel:${customer.phone}`} className="hover:underline">
                      {customer.phone}
                    </a>
                  }
                />
              )}
              {customer.whatsapp && (
                <Detail
                  icon={Phone}
                  label="WhatsApp"
                  value={customer.whatsapp}
                />
              )}
              {customer.website && (
                <Detail
                  icon={Globe}
                  label="Web"
                  value={
                    <a
                      href={customer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {customer.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  }
                />
              )}
              {customer.address && (
                <Detail icon={MapPin} label="Adres" value={customer.address} />
              )}
              {(customer.taxOffice || customer.taxNumber) && (
                <Detail
                  icon={Tag}
                  label="Vergi"
                  value={
                    <span className="text-muted-foreground">
                      {[customer.taxOffice, customer.taxNumber].filter(Boolean).join(" / ")}
                    </span>
                  }
                />
              )}
              {customer.notes && (
                <Detail icon={StickyNote} label="Notlar" value={customer.notes} />
              )}
              <div className="border-t pt-3">
                <Link
                  href={`/musteriler/${customer.id}/duzenle`}
                  className="text-xs text-primary hover:underline"
                >
                  Bilgileri düzenle
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <AssignmentManager
                customerId={customer.id}
                assignments={customer.assignments}
                employees={employees}
                canManage={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finansal Özet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Toplam Fatura" value={formatTRY(totalInvoices)} />
              <Row label="Tahsil Edilen" value={formatTRY(paidInvoices)} />
              <Row
                label="Bekleyen"
                value={formatTRY(totalInvoices - paidInvoices)}
                emphasize
              />
              <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                {customer.invoices.length} fatura • {customer.quotes.length} teklif •{" "}
                {customer.contracts.length} sözleşme
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="tasks">
            <TabsList className="w-full overflow-x-auto justify-start">
              <TabsTrigger value="tasks">
                Görevler ({customer.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="invoices">
                Faturalar ({customer.invoices.length})
              </TabsTrigger>
              <TabsTrigger value="quotes">
                Teklifler ({customer.quotes.length})
              </TabsTrigger>
              <TabsTrigger value="contracts">
                Sözleşmeler ({customer.contracts.length})
              </TabsTrigger>
              <TabsTrigger value="files">
                Dosyalar ({customer.files.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-3">
              <div className="flex items-center justify-end">
                <TaskFormDialog customerId={customer.id} employees={employees} />
              </div>
              <TaskList tasks={customer.tasks} />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-3">
              <div className="flex items-center justify-end">
                <InvoiceFormDialog customerId={customer.id} />
              </div>
              <InvoiceList
                invoices={customer.invoices.map((i) => ({
                  ...i,
                  amount: Number(i.amount),
                }))}
              />
            </TabsContent>

            <TabsContent value="quotes" className="space-y-3">
              <div className="flex items-center justify-end">
                <QuoteFormDialog customerId={customer.id} />
              </div>
              <QuoteList
                quotes={customer.quotes.map((q) => ({
                  ...q,
                  amount: Number(q.amount),
                }))}
              />
            </TabsContent>

            <TabsContent value="contracts" className="space-y-3">
              <div className="flex items-center justify-end">
                <ContractFormDialog customerId={customer.id} />
              </div>
              <ContractList
                contracts={customer.contracts.map((c) => ({
                  ...c,
                  amount: c.amount != null ? Number(c.amount) : null,
                }))}
              />
            </TabsContent>

            <TabsContent value="files" className="space-y-3">
              <div className="flex items-center justify-end">
                <FileUploader customerId={customer.id} />
              </div>
              <FileList files={customer.files} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="break-words">{value}</div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
