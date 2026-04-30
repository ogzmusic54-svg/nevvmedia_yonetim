"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changeOwnPassword, updateOwnProfile } from "@/lib/actions/user";

type Props = {
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
};

export function ProfileForms({ user }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateOwnProfile({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Profil güncellendi");
      router.refresh();
    });
  }

  function onPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const currentPassword = String(fd.get("currentPassword") ?? "");
    const newPassword = String(fd.get("newPassword") ?? "");
    const confirmPassword = String(fd.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    startTransition(async () => {
      const res = await changeOwnPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Şifre değiştirildi");
      form.reset();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Ad Soyad</Label>
              <Input name="name" defaultValue={user.name} required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label>E-posta</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">
                E-postayı değiştirmek için yöneticiye başvurun.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input name="phone" defaultValue={user.phone ?? ""} />
            </div>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Mevcut Şifre</Label>
              <Input name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Yeni Şifre</Label>
              <Input
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Yeni Şifre (Tekrar)</Label>
              <Input
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Şifreyi Güncelle
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
