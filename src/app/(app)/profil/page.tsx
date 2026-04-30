import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/common/page-header";
import { ProfileForms } from "@/components/users/profile-forms";

export const metadata = { title: "Profil | Nevvmedia Yönetim" };

export default async function ProfilePage() {
  const me = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return null;

  return (
    <>
      <PageHeader title="Profilim" description="Hesap bilgileri ve şifre" />
      <ProfileForms
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone,
        }}
      />
    </>
  );
}
