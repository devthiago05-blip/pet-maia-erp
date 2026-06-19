"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { FinancialTable } from "@/components/financeiro/FinancialTable";
import { NewFinancialModal } from "@/components/financeiro/NewFinancialModal";

export default function FinanceiroPage() {
    const [entries, setEntries] =
  useState<any[]>([]);
const totalReceitas = entries
  .filter(
    (entry) =>
      (entry.tipo || "Receita") ===
      "Receita"
  )
  .reduce(
    (total, entry) =>
      total + entry.valor,
    0
  );

const totalDespesas = entries
  .filter(
    (entry) =>
      entry.tipo === "Despesa"
  )
  .reduce(
    (total, entry) =>
      total + entry.valor,
    0
  );

const lucro =
  totalReceitas -
  totalDespesas;
  useEffect(() => {
  async function loadFinancial() {

    const { data, error } =
      await supabase
        .from("financial_entries")
        .select("*")
        .order(
          "created_at",
          { ascending: false }
        );

    if (error) {
      console.error(error);
      return;
    }

    console.log(
      "FINANCEIRO:",
      data
    );

    setEntries(data || []);
  }

  loadFinancial();
}, []);
  return (
  <div className="flex">
    <Sidebar />

    <main className="flex-1 bg-slate-50 min-h-screen">
      <Header />

      <div className="p-8 space-y-6">

      <div>
        <div className="flex items-center justify-between">

  <div>
    <h1 className="text-3xl font-bold text-[#8A0EEA]">
      Financeiro
    </h1>

    <p className="text-slate-500">
      Controle financeiro da clínica
    </p>
  </div>

 <NewFinancialModal
  onSave={async (novoLancamento) => {

    const { error } =
      await supabase
        .from("financial_entries")
        .insert([
          {
            descricao:
              novoLancamento.descricao,

            valor:
              novoLancamento.valor,

            tipo:
              novoLancamento.tipo,

            forma_pagamento:
              novoLancamento.formaPagamento,

            status_pagamento:
              "Pendente",
          },
        ]);

    if (error) {
      console.error(error);
      alert(
        "Erro ao salvar lançamento"
      );
      return;
    }

    alert(
      "Lançamento salvo com sucesso!"
    );

    const { data } =
      await supabase
        .from("financial_entries")
        .select("*")
        .order(
          "created_at",
          { ascending: false }
        );

    setEntries(data || []);
  }}
/>

</div>

        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Receitas
          </p>

          <h2 className="text-3xl font-bold mt-2">
            R$ {totalReceitas.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Despesas
          </p>

          <h2 className="text-3xl font-bold mt-2">
            R$ {totalDespesas.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-6">
          <p className="text-slate-500">
            Lucro
          </p>

          <h2 className="text-3xl font-bold mt-2">
            R$ {lucro.toFixed(2)}
          </h2>
        </div>

      </div>
   <FinancialTable
  entries={entries}

  onReceive={async (id) => {

    const { error } =
      await supabase
        .from("financial_entries")
        .update({
          status_pagamento:
            "Pago",
        })
        .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const { data } =
      await supabase
        .from("financial_entries")
        .select("*")
        .order(
          "created_at",
          { ascending: false }
        );

    setEntries(data || []);
  }}

  onDelete={async (id) => {

    const confirmar =
      window.confirm(
        "Deseja excluir este lançamento?"
      );

    if (!confirmar) return;

    const { error } =
      await supabase
        .from("financial_entries")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setEntries(
      entries.filter(
        (entry) =>
          entry.id !== id
      )
    );
  }}
/>
          </div>
    </main>
  </div>
);
}