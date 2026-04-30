import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Receipt,
  FileText,
  FileSignature,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
  { label: "Müşteriler", href: "/musteriler", icon: Users },
  { label: "Görevler", href: "/gorevler", icon: ClipboardList },
  { label: "Teklifler", href: "/teklifler", icon: FileText },
  { label: "Sözleşmeler", href: "/sozlesmeler", icon: FileSignature },
  { label: "Faturalar", href: "/faturalar", icon: Receipt },
  { label: "Kullanıcılar", href: "/kullanicilar", icon: UserCog, adminOnly: true },
  { label: "Ayarlar", href: "/ayarlar", icon: Settings, adminOnly: true },
];
