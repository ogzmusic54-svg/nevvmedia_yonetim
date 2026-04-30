import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserActions } from "@/components/users/user-actions";
import { userRoleLabels } from "@/lib/validations/user";
import { formatDate, getInitials } from "@/lib/utils";

export const metadata = { title: "Kullanıcılar | Nevvmedia Yönetim" };

export default async function UsersPage() {
  const me = await requireUser();
  if (me.role !== "ADMIN") redirect("/dashboard");

  let users: Array<{
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "EMPLOYEE";
    active: boolean;
    phone: string | null;
    createdAt: Date;
    _count: { assignments: number; assignedTasks: number };
  }> = [];
  try {
    users = await prisma.user.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { assignments: true, assignedTasks: true } },
      },
    });
  } catch (e) {
    console.error(e);
  }

  return (
    <>
      <PageHeader
        title="Kullanıcılar"
        description="Ekip üyelerini yönetin"
        actions={<UserFormDialog />}
      />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Kullanıcı</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Müşteri</th>
              <th className="px-4 py-3 text-left">Görev</th>
              <th className="px-4 py-3 text-left">Eklendi</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {u.name} {u.id === me.id && (
                          <span className="text-xs text-muted-foreground">(siz)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {u.phone && (
                        <div className="text-xs text-muted-foreground">{u.phone}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                    {userRoleLabels[u.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {u.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Pasif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.assignments}</td>
                <td className="px-4 py-3 text-muted-foreground">{u._count.assignedTasks}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <UserActions userId={u.id} active={u.active} isSelf={u.id === me.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  Kullanıcı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
