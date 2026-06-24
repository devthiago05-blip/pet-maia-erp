"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  PawPrint,
  Receipt,
  Scissors,
  Settings,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAccess } from "@/components/auth/AccessContext";
import type { AccessModule } from "@/lib/access-control";
import { cn } from "@/lib/utils";

const menuItems: Array<{
  href: string;
  label: string;
  module: AccessModule;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/", label: "Dashboard", module: "dashboard", icon: LayoutDashboard },
  { href: "/tutors", label: "Tutores", module: "tutores", icon: Users },
  { href: "/pets", label: "Pets", module: "pets", icon: PawPrint },
  { href: "/services", label: "Serviços", module: "servicos", icon: Scissors },
  { href: "/agenda", label: "Agenda", module: "agenda", icon: CalendarDays },
  {
    href: "/financeiro",
    label: "Financeiro",
    module: "financeiro",
    icon: Wallet,
  },
  { href: "/receipts", label: "Recibos", module: "recibos", icon: Receipt },
  {
    href: "/settings",
    label: "Configurações",
    module: "configuracoes",
    icon: Settings,
  },
  { href: "/usuarios", label: "Usuários", module: "usuarios", icon: UserCog },
];

function MenuItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAccess } = useAccess();

  return (
    <nav className="flex flex-col gap-2">
      {menuItems
        .filter((item) => canAccess(item.module))
        .map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition",
                isActive
                  ? "bg-purple-50 text-[#8A0EEA]"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-xl bg-white p-2 shadow md:hidden"
      >
        <Menu size={24} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <aside className="fixed top-0 left-0 z-50 h-dvh w-[min(18rem,calc(100vw-2rem))] overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl md:hidden">
          <div className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#8A0EEA]">PET MAIA ERP</h2>
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <p className="mb-8 text-sm text-gray-500">Gestão Veterinária</p>
          <MenuItems onNavigate={() => setOpen(false)} />
        </aside>
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-sm md:block lg:w-72 lg:p-6">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#8A0EEA]">PET MAIA ERP</h2>
          <p className="text-sm text-gray-500">Gestão Veterinária</p>
        </div>
        <MenuItems />
      </aside>
    </>
  );
}
