"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  PawPrint,
  Receipt,
  Scissors,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function MenuItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-2">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl bg-purple-50 px-4 py-3 font-medium text-[#8A0EEA]"
      >
        <LayoutDashboard size={20} />
        Dashboard
      </Link>

      <Link
        href="/tutors"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <Users size={20} />
        Tutores
      </Link>

      <Link
        href="/pets"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <PawPrint size={20} />
        Pets
      </Link>

      <Link
        href="/services"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <Scissors size={20} />
        Serviços
      </Link>

      <Link
        href="/agenda"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <CalendarDays size={20} />
        Agenda
      </Link>

      <Link
        href="/financeiro"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <Wallet size={20} />
        Financeiro
      </Link>

      <Link
        href="/receipts"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <Receipt size={20} />
        Recibos
      </Link>

      <Link
        href="/settings"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100"
      >
        <Settings size={20} />
        Configurações
      </Link>
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
