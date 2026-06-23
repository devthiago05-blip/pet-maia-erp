"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { useMountEffect } from "@/hooks/useMountEffect";
import { fetchPetById } from "@/services/pets";
import type { Pet } from "@/types/domain";

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "historico", label: "Histórico" },
  { id: "vacinas", label: "Vacinas" },
  { id: "banhos", label: "Banhos" },
  { id: "financeiro", label: "Financeiro" },
];

export default function PetPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("dados");
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useMountEffect(() => {
    async function loadPet() {
      const petId = Number(params.id);

      if (!petId) {
        setError("Pet não encontrado.");
        setLoading(false);
        return;
      }

      const { data, error: petError } = await fetchPetById(petId);

      if (petError) {
        console.error(petError);
        setError("Não foi possível carregar a ficha do pet.");
        setLoading(false);
        return;
      }

      setPet(data);
      setLoading(false);
    }

    loadPet();
  });

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border bg-white p-6 text-slate-500">
          Carregando ficha do pet...
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold text-[#8A0EEA]">Ficha do Pet</h1>
          <p className="mt-2 text-slate-500">
            {error || "Pet não encontrado."}
          </p>
        </div>
      </div>
    );
  }

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
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-500">
            {pet.nome.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-center text-xl font-bold">{pet.nome}</h2>
          <p className="text-center text-slate-500">{pet.raca || "-"}</p>

          <div className="mt-6 space-y-3 break-words">
            <div>
              <span className="font-semibold">Tutor:</span>{" "}
              {pet.tutors?.nome || "-"}
            </div>

            <div>
              <span className="font-semibold">Espécie:</span>{" "}
              {pet.especie || "-"}
            </div>

            <div>
              <span className="font-semibold">Sexo:</span> {pet.sexo || "-"}
            </div>

            <div>
              <span className="font-semibold">Idade:</span> {pet.idade || "-"}
            </div>

            <div>
              <span className="font-semibold">Porte:</span> {pet.porte || "-"}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Nome" value={pet.nome} />
                <InfoItem label="Espécie" value={pet.especie} />
                <InfoItem label="Raça" value={pet.raca} />
                <InfoItem label="Sexo" value={pet.sexo} />
                <InfoItem label="Idade" value={pet.idade} />
                <InfoItem label="Porte" value={pet.porte} />
                <InfoItem label="Tutor" value={pet.tutors?.nome} />
                <InfoItem
                  label="Telefone do tutor"
                  value={pet.tutors?.telefone}
                />
                <InfoItem label="Email do tutor" value={pet.tutors?.email} />
              </div>
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
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words font-medium">{value || "-"}</p>
    </div>
  );
}
