"use client";

export default function AgendaPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-[#8A0EEA]">
          Agenda
        </h1>

        <p className="text-slate-500">
          Gerencie os agendamentos
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">

        <h2 className="font-bold text-lg mb-4">
          Agendamentos de Hoje
        </h2>

        <div className="space-y-3">

          <div className="border rounded-xl p-4">
            08:00 - Rex - Banho
          </div>

          <div className="border rounded-xl p-4">
            09:00 - Mel - Consulta
          </div>

          <div className="border rounded-xl p-4">
            10:00 - Nina - Vacina
          </div>

        </div>

      </div>

    </div>
  );
}