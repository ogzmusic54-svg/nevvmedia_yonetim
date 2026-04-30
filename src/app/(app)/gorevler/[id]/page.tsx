import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, User as UserIcon, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TaskStatusBadge, TaskPriorityBadge } from "@/components/tasks/status-badge";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskCommentForm } from "@/components/tasks/task-comment-form";
import { FileList } from "@/components/files/file-list";
import { FileUploader } from "@/components/files/file-uploader";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";

export default async function TaskDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const user = await requireUser();
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      customer: true,
      assignedTo: true,
      createdBy: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      },
      files: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });

  if (!task) notFound();

  const employees = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/gorevler">
            <ArrowLeft className="h-4 w-4" /> Görevlere Dön
          </Link>
        </Button>
      </div>
      <PageHeader
        title={task.title}
        description={
          <Link href={`/musteriler/${task.customer.id}`} className="hover:underline">
            {task.customer.name}
          </Link>
        }
        actions={
          <TaskFormDialog
            employees={employees}
            customerId={task.customer.id}
            initial={{
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              assignedToId: task.assignedToId,
              dueDate: task.dueDate,
              customerId: task.customerId,
            }}
            trigger={<Button variant="outline">Düzenle</Button>}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Açıklama</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="whitespace-pre-wrap text-sm">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Açıklama yok.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Yorumlar ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskCommentForm taskId={task.id} />
              <Separator />
              {task.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz yorum yok.</p>
              ) : (
                <ul className="space-y-4">
                  {task.comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(c.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{c.user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dosyalar</CardTitle>
                <FileUploader taskId={task.id} customerId={task.customerId} />
              </div>
            </CardHeader>
            <CardContent>
              <FileList files={task.files} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detaylar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Durum" value={<TaskStatusBadge status={task.status} />} />
              <Row label="Öncelik" value={<TaskPriorityBadge priority={task.priority} />} />
              <Row
                label="Atanan"
                value={
                  task.assignedTo ? (
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5" /> {task.assignedTo.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <Row
                label="Son Tarih"
                value={
                  task.dueDate ? (
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" /> {formatDate(task.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <Row label="Oluşturan" value={task.createdBy.name} />
              <Row label="Oluşturma" value={formatDate(task.createdAt)} />
              {task.completedAt && (
                <Row label="Tamamlanma" value={formatDate(task.completedAt)} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
