import Link from "next/link";
import { Plus, Search, Users, Mail, Phone, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { getInitials } from "@/lib/utils";

export const metadata = { title: "Müşteriler | Nevvmedia Yönetim" };

type SearchParams = { q?: string; status?: string };

async function getCustomers(userId: string, isAdmin: boolean, q?: string, status?: string) {
  try {
    const where: Record<string, unknown> = {};
    if (!isAdmin) where.assignments = { some: { userId } };
    if (status && status !== "ALL") where.status = status;
    if (q && q.trim()) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    return await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        assignments: { include: { user: true } },
        _count: { select: { tasks: true, invoices: true } },
      },
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function CustomersPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const customers = await getCustomers(user.id, isAdmin, sp.q, sp.status);

  return (
    <>
      <PageHeader
        title="Müşteriler"
        description={
          isAdmin
            ? "Tüm ajans müşterileri ve markalar"
            : "Sana atanmış müşteriler"
        }
        actions={
          <Button asChild>
            <Link href="/musteriler/yeni">
              <Plus className="h-4 w-4" />
              Yeni Müşteri
            </Link>
          </Button>
        }
      />

      <form className="mb-5 flex flex-col gap-3 sm:flex-row" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="İsim, şirket veya e-posta ile ara..."
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Ara
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Henüz müşteri yok"
          description={
            isAdmin
              ? "İlk müşterinizi ekleyerek başlayın."
              : "Henüz size atanmış bir müşteri bulunmuyor."
          }
          action={
            isAdmin ? (
              <Button asChild>
                <Link href="/musteriler/yeni">
                  <Plus className="h-4 w-4" />
                  Müşteri Ekle
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/musteriler/${c.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{c.name}</h3>
                        {c.company && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <Building2 className="h-3 w-3" />
                            {c.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <CustomerStatusBadge status={c.status} />
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                    {c.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3 w-3" /> {c.email}
                      </p>
                    )}
                    {c.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{c._count.tasks} görev</span>
                      <span>•</span>
                      <span>{c._count.invoices} fatura</span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {c.assignments.slice(0, 3).map((a) => (
                        <Avatar key={a.id} className="h-6 w-6 border-2 border-card">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(a.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {c.assignments.length > 3 && (
                        <div className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-medium border-2 border-card">
                          +{c.assignments.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
