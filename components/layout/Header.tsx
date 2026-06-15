import { Bell, CalendarDays } from "lucide-react";

export function Header() {
const today = new Date().toLocaleDateString("pt-BR");

return ( <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between"> <div> <h1 className="text-2xl font-bold text-slate-800">
Dashboard </h1>


    <p className="text-sm text-slate-500">
      Bem-vindo ao PET MAIA ERP
    </p>
  </div>

  <div className="flex items-center gap-6">
    <div className="flex items-center gap-2 text-slate-500">
      <CalendarDays size={18} />
      <span>{today}</span>
    </div>

    <button className="relative">
      <Bell size={20} />

      <span className="absolute -top-2 -right-2 bg-[#FF7A00] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
        3
      </span>
    </button>

    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#8A0EEA] text-white flex items-center justify-center font-bold">
        T
      </div>

      <div>
        <p className="font-medium">
          Thiago
        </p>

        <p className="text-xs text-slate-500">
          Administrador
        </p>
      </div>
    </div>
  </div>
</header>


);
}
