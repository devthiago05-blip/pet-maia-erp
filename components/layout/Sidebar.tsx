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
} from "lucide-react";

export function Sidebar() {
return ( <aside className="w-72 bg-white border-r border-slate-200 h-screen sticky top-0 p-6 shadow-sm"> <div className="mb-10"> <h2 className="text-2xl font-bold text-[#8A0EEA]">
[LOGO]

PET MAIA ERP </h2>

    <p className="text-sm text-gray-500">
      Gestão Veterinária
    </p>
  </div>

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
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <Users size={20} />
      Tutores
    </Link>

    <Link
      href="/pets"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <PawPrint size={20} />
      Pets
    </Link>

    <Link
      href="/services"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <Scissors size={20} />
      Serviços
    </Link>

    <Link
      href="/appointments"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <CalendarDays size={20} />
      Agenda
    </Link>

    <Link
      href="/finance"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <Wallet size={20} />
      Financeiro
    </Link>

    <Link
      href="/receipts"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <Receipt size={20} />
      Recibos
    </Link>

    <Link
      href="/settings"
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
    >
      <Settings size={20} />
      Configurações
    </Link>
  </nav>
</aside>

);
}
