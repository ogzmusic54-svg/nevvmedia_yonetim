import Link from "next/link";

export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 px-4 py-5 group"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold shadow-sm">
        N
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Nevvmedia</span>
          <span className="text-[11px] text-muted-foreground">Yönetim Paneli</span>
        </div>
      )}
    </Link>
  );
}
