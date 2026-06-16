"use client";

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-[#8A0EEA]">
          Financeiro
        </h1>

        <p className="text-slate-500">
          Controle financeiro da clínica
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Receita do Dia
          </p>

          <h2 className="text-3xl font-bold mt-2">
            R$ 0,00
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Receita do Mês
          </p>

          <h2 className="text-3xl font-bold mt-2">
            R$ 0,00
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Atendimentos
          </p>

          <h2 className="text-3xl font-bold mt-2">
            0
          </h2>
        </div>

      </div>

    </div>
  );
}