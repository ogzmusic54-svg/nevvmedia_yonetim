"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/actions/file";

export function FileUploader({
  customerId,
  taskId,
}: {
  customerId?: string;
  taskId?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>("");

  function pick() {
    inputRef.current?.click();
  }

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    if (customerId) fd.append("customerId", customerId);
    if (taskId) fd.append("taskId", taskId);
    return uploadFile(fd);
  }

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    e.target.value = "";

    startTransition(async () => {
      let success = 0;
      for (let i = 0; i < files.length; i++) {
        setProgress(`${i + 1}/${files.length} yükleniyor...`);
        const res = await uploadOne(files[i]);
        if (res.ok) success++;
        else toast.error(`${files[i].name}: ${res.error}`);
      }
      setProgress("");
      if (success > 0) {
        toast.success(`${success} dosya yüklendi`);
        router.refresh();
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={onChange}
        disabled={pending}
      />
      <Button onClick={pick} disabled={pending} size="sm">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress || "Yükleniyor..."}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Dosya Yükle
          </>
        )}
      </Button>
    </>
  );
}
