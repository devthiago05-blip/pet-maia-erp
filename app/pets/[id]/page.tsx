"use client";

import { useState } from "react";

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "historico", label: "Histórico" },
  { id: "vacinas", label: "Vacinas" },
  { id: "banhos", label: "Banhos" },
  { id: "financeiro", label: "Financeiro" },
];

export default function PetPage() {
  const [tab, setTab] = useState("dados");

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
          Ficha do Pet
        </h1>
        <p className="text-slate-500">Informações do paciente</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-slate-200" />

          <h2 className="text-center text-xl font-bold">Rex</h2>
          <p className="text-center text-slate-500">Pitbull</p>

          <div className="mt-6 space-y-3 break-words">
            <div>
              <span className="font-semibold">Tutor:</span> Thiago Lima
            </div>

            <div>
              <span className="font-semibold">Espécie:</span> Cachorro
            </div>

            <div>
              <span className="font-semibold">Sexo:</span> Macho
            </div>

            <div>
              <span className="font-semibold">Peso:</span> 25 kg
            </div>

            <div>
              <span className="font-semibold">Nascimento:</span> 10/03/2022
            </div>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-2">
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-xl px-4 py-2 ${
                    tab === item.id ? "bg-[#8A0EEA] text-white" : "bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === "dados" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold">Dados do Pet</h3>
              <p>Aqui ficarão os dados completos do pet.</p>
            </div>
          )}

          {tab === "historico" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold">Histórico</h3>
              <p>Nenhum histórico cadastrado.</p>
            </div>
          )}

          {tab === "vacinas" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold">Vacinas</h3>
              <p>Nenhuma vacina cadastrada.</p>
            </div>
          )}

          {tab === "banhos" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold">Banhos e Tosas</h3>
              <p>Nenhum banho registrado.</p>
            </div>
          )}

          {tab === "financeiro" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h3 className="mb-4 text-lg font-bold">Financeiro</h3>
              <p>Nenhum lançamento financeiro.</p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
            <h3 className="mb-4 text-lg font-bold">Histórico</h3>

            <div className="space-y-3">
              <div className="rounded-xl border p-3">
                Consulta Clínica
                <br />
                <span className="text-sm text-slate-500">15/06/2026</span>
              </div>

              <div className="rounded-xl border p-3">
                Banho e Tosa
                <br />
                <span className="text-sm text-slate-500">20/06/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
