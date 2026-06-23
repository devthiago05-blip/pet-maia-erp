import { Bell, CalendarDays } from "lucide-react";

export function Header() {
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <header className="border-b border-slate-200 bg-white py-3 pr-4 pl-16 sm:py-4 md:pl-8">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
            Dashboard
          </h1>
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            Bem-vindo ao PET MAIA ERP
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-2 text-slate-500 sm:flex">
            <CalendarDays size={18} />
            <span>{today}</span>
          </div>

          <button type="button" className="relative">
            <Bell size={20} />

            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF7A00] text-xs text-white">
              3
            </span>
          </button>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8A0EEA] font-bold text-white">
              T
            </div>

            <div className="hidden lg:block">
              <p className="font-medium">Thiago</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
