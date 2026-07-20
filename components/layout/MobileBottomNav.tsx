"use client";

import {
  CalendarDays,
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAccess } from "@/components/auth/AccessContext";
import type { AccessModule } from "@/lib/access-control";
import { cn } from "@/lib/utils";

const items: Array<{
  href: string;
  label: string;
  module: AccessModule;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/", label: "Início", module: "dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", module: "agenda", icon: CalendarDays },
  { href: "/pdv", label: "PDV", module: "pdv", icon: ShoppingCart },
  { href: "/estoque", label: "Estoque", module: "pdv", icon: PackageSearch },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { canAccess } = useAccess();
  const visibleItems = items.filter((item) => canAccess(item.module));

  if (visibleItems.length === 0) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(4.25rem+env(safe-area-inset-bottom))] shrink-0 md:hidden"
      />
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4.25rem+env(safe-area-inset-bottom))] border-t bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
        style={{
          gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`,
        }}
      >
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold",
                active ? "text-[#8A0EEA]" : "text-slate-500",
              )}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
