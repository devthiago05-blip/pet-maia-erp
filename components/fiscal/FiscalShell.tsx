"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const links = [
  ["/fiscal", "Visão geral"],
  ["/fiscal/produtos", "Produtos fiscais"],
  ["/fiscal/nfce", "NFC-e"],
  ["/fiscal/xml", "XML"],
  ["/fiscal/configuracoes", "Configurações fiscais"],
  ["/fiscal/pagamentos", "Pagamentos integrados"],
  ["/fiscal/logs", "Logs"],
] as const;

export function FiscalShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Header />
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-center font-bold text-amber-900">
          AMBIENTE MOCK / HOMOLOGAÇÃO — SEM VALIDADE FISCAL
        </div>
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {links.map(([href, label]) => {
            const active =
              href === "/fiscal"
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold",
                  active
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
