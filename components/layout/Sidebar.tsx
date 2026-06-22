"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Scissors,
  CalendarDays,
  Wallet,
  Receipt,
  Settings,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const [open, setOpen] = useState(false);

  const MenuItems = () => (
    <nav className="flex flex-col gap-2">
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-50 text-[#8A0EEA] font-medium"
      >
        <LayoutDashboard size={20} />
        Dashboard
      </Link>

      <Link
        href="/tutors"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <Users size={20} />
        Tutores
      </Link>

      <Link
        href="/pets"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <PawPrint size={20} />
        Pets
      </Link>

      <Link
        href="/services"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <Scissors size={20} />
        Serviços
      </Link>

      <Link
        href="/agenda"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <CalendarDays size={20} />
        Agenda
      </Link>

      <Link
        href="/financeiro"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <Wallet size={20} />
        Financeiro
      </Link>

      <Link
        href="/receipts"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <Receipt size={20} />
        Recibos
      </Link>

      <Link
        href="/settings"
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100"
      >
        <Settings size={20} />
        Configurações
      </Link>
    </nav>
  );

  return (
    <>
      {/* BOTÃO MOBILE */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-xl shadow"
      >
        <Menu size={24} />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR MOBILE */}
      {open && (
        <aside className="fixed left-0 top-0 z-50 w-72 h-screen bg-white border-r border-slate-200 p-6 shadow-xl md:hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-[#8A0EEA]">
              PET MAIA ERP
            </h2>

            <button onClick={() => setOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            Gestão Veterinária
          </p>

          <MenuItems />
        </aside>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:block w-72 bg-white border-r border-slate-200 h-screen sticky top-0 p-6 shadow-sm">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-[#8A0EEA]">
            PET MAIA ERP
          </h2>

          <p className="text-sm text-gray-500">
            Gestão Veterinária
          </p>
        </div>

        <MenuItems />
      </aside>
    </>
  );
}