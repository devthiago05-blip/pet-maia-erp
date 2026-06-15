"use client";

import { useState } from "react";

export default function PetPage() {

  const [tab, setTab] =
    useState("dados");
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-[#8A0EEA]">
          Ficha do Pet
        </h1>

        <p className="text-slate-500">
          Informações do paciente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 p-6">

          <div className="w-24 h-24 rounded-full bg-slate-200 mx-auto mb-4"></div>

          <h2 className="text-xl font-bold text-center">
            Rex
          </h2>

          <p className="text-center text-slate-500">
            Pitbull
          </p>

          <div className="mt-6 space-y-3">

            <div>
              <span className="font-semibold">
                Tutor:
              </span>{" "}
              Thiago Lima
            </div>

            <div>
              <span className="font-semibold">
                Espécie:
              </span>{" "}
              Cachorro
            </div>

            <div>
              <span className="font-semibold">
                Sexo:
              </span>{" "}
              Macho
            </div>

            <div>
              <span className="font-semibold">
                Peso:
              </span>{" "}
              25 kg
            </div>

            <div>
              <span className="font-semibold">
                Nascimento:
              </span>{" "}
              10/03/2022
            </div>

          </div>

        </div>

        <div className="lg:col-span-2">

  <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-6">

    <div className="flex flex-wrap gap-2">

      <button
        onClick={() =>
          setTab("dados")
        }
        className={`px-4 py-2 rounded-xl ${
          tab === "dados"
            ? "bg-[#8A0EEA] text-white"
            : "bg-slate-100"
        }`}
      >
        Dados
      </button>

      <button
        onClick={() =>
          setTab("historico")
        }
        className={`px-4 py-2 rounded-xl ${
          tab === "historico"
            ? "bg-[#8A0EEA] text-white"
            : "bg-slate-100"
        }`}
      >
        Histórico
      </button>

      <button
        onClick={() =>
          setTab("vacinas")
        }
        className={`px-4 py-2 rounded-xl ${
          tab === "vacinas"
            ? "bg-[#8A0EEA] text-white"
            : "bg-slate-100"
        }`}
      >
        Vacinas
      </button>

      <button
        onClick={() =>
          setTab("banhos")
        }
        className={`px-4 py-2 rounded-xl ${
          tab === "banhos"
            ? "bg-[#8A0EEA] text-white"
            : "bg-slate-100"
        }`}
      >
        Banhos
      </button>

      <button
        onClick={() =>
          setTab("financeiro")
        }
        className={`px-4 py-2 rounded-xl ${
          tab === "financeiro"
            ? "bg-[#8A0EEA] text-white"
            : "bg-slate-100"
        }`}
      >
        Financeiro
      </button>

    </div>

  </div>

        

        {tab === "dados" && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-bold text-lg mb-4">
      Dados do Pet
    </h3>

    <p>
      Aqui ficarão os dados completos do pet.
    </p>
  </div>
)}

{tab === "historico" && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-bold text-lg mb-4">
      Histórico
    </h3>

    <p>
      Nenhum histórico cadastrado.
    </p>
  </div>
)}

{tab === "vacinas" && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-bold text-lg mb-4">
      Vacinas
    </h3>

    <p>
      Nenhuma vacina cadastrada.
    </p>
  </div>
)}

{tab === "banhos" && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-bold text-lg mb-4">
      Banhos e Tosas
    </h3>

    <p>
      Nenhum banho registrado.
    </p>
  </div>
)}

{tab === "financeiro" && (
  <div className="bg-white rounded-2xl border border-slate-200 p-6">
    <h3 className="font-bold text-lg mb-4">
      Financeiro
    </h3>

    <p>
      Nenhum lançamento financeiro.
    </p>
  </div>
)}

          <div className="bg-white rounded-2xl border border-slate-200 p-6">

            <h3 className="font-bold text-lg mb-4">
              Histórico
            </h3>

            <div className="space-y-3">

              <div className="border rounded-xl p-3">
                Consulta Clínica
                <br />
                <span className="text-sm text-slate-500">
                  15/06/2026
                </span>
              </div>

              <div className="border rounded-xl p-3">
                Banho e Tosa
                <br />
                <span className="text-sm text-slate-500">
                  20/06/2026
                </span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}