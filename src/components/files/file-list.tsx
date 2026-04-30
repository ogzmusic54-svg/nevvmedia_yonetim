"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteFile } from "@/lib/actions/file";
import { formatDate } from "@/lib/utils";

type FileItem = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date | string;
  uploadedBy?: { name: string };
};

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime === "application/pdf" || mime.startsWith("text/")) return FileText;
  return FileIcon;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files }: { files: FileItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete(id: string, name: string) {
    if (!confirm(`"${name}" silinsin mi?`)) return;
    startTransition(async () => {
      const res = await deleteFile(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Dosya silindi");
      router.refresh();
    });
  }

  if (files.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Henüz dosya yok.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {files.map((f) => {
        const Icon = iconFor(f.mimeType);
        return (
          <li
            key={f.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(f.size)} • {formatDate(f.createdAt)}
                  {f.uploadedBy && ` • ${f.uploadedBy.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="icon">
                <a
                  href={`/api/dosyalar/${f.id}`}
                  target="_blank"
                  rel="noreferrer"
                  download={f.name}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(f.id, f.name)}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
