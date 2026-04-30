import Link from "next/link";
import { LayoutGrid, List } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "@/components/tasks/task-list";
import { TaskKanban } from "@/components/tasks/task-kanban";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";

export const metadata = { title: "Görevler | Nevvmedia Yönetim" };

async function getData(userId: string, isAdmin: boolean) {
  try {
    const where = isAdmin ? {} : { assignedToId: userId };
    const [tasks, customers, employees] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: {
          customer: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      isAdmin
        ? prisma.customer.findMany({
            where: { status: { not: "LOST" } },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : prisma.customer.findMany({
            where: {
              assignments: { some: { userId } },
              status: { not: "LOST" },
            },
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          }),
      prisma.user.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
    return { tasks, customers, employees };
  } catch (e) {
    console.error(e);
    return { tasks: [], customers: [], employees: [] };
  }
}

export default async function TasksPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const { tasks, customers, employees } = await getData(user.id, isAdmin);

  return (
    <>
      <PageHeader
        title="Görevler"
        description={isAdmin ? "Tüm görevler" : "Sana atanmış görevler"}
        actions={<TaskFormDialog customers={customers} employees={employees} />}
      />

      <Tabs defaultValue="kanban">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            Liste
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
          {tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Henüz görev yok. Bir müşteri seçip görev oluşturabilirsiniz.
            </p>
          ) : (
            <TaskKanban tasks={tasks} showCustomer />
          )}
        </TabsContent>
        <TabsContent value="list">
          <TaskList tasks={tasks} showCustomer />
        </TabsContent>
      </Tabs>
    </>
  );
}
