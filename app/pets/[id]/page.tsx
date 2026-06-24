"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { fetchAppointmentsByPet } from "@/services/appointments";
import { fetchFinancialEntriesByPet } from "@/services/financial";
import { fetchPetById } from "@/services/pets";
import type { Appointment, FinancialEntry, Pet } from "@/types/domain";

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "historico", label: "Histórico" },
  { id: "vacinas", label: "Vacinas" },
  { id: "banhos", label: "Banhos" },
  { id: "financeiro", label: "Financeiro" },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function PetPage() {
  const params = useParams<{ id: string }>();
  const [tab, setTab] = useState("dados");
  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(
    [],
  );
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

      if (petError || !data) {
        console.error(petError);
        setError("Não foi possível carregar a ficha do pet.");
        setLoading(false);
        return;
      }

      const [appointmentsResponse, financialResponse] = await Promise.all([
        fetchAppointmentsByPet(petId),
        fetchFinancialEntriesByPet(data.nome),
      ]);

      if (appointmentsResponse.error) {
        console.error(appointmentsResponse.error);
      }

      if (financialResponse.error) {
        console.error(financialResponse.error);
      }

      setPet(data);
      setAppointments(appointmentsResponse.data || []);
      setFinancialEntries(financialResponse.data || []);
      setLoading(false);
    }

    loadPet();
  });

  const vaccineAppointments = appointments.filter((appointment) =>
    normalizeText(appointment.servico).includes("vacina"),
  );
  const groomingAppointments = appointments.filter((appointment) => {
    const service = normalizeText(appointment.servico);
    return ["banho", "tosa", "hidratacao", "unhas", "ouvido"].some((term) =>
      service.includes(term),
    );
  });

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando ficha do pet...
            </div>
          ) : error || !pet ? (
            <div className="rounded-xl border bg-white p-6">
              <h1 className="text-2xl font-bold text-[#8A0EEA]">
                Ficha do Pet
              </h1>
              <p className="mt-2 text-slate-500">
                {error || "Pet não encontrado."}
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                  Ficha do Pet
                </h1>
                <p className="text-slate-500">Informações do paciente</p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <PetSummary pet={pet} />

                <div className="min-w-0 lg:col-span-2">
                  <div className="mb-6 overflow-hidden rounded-xl border bg-white p-2">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {tabs.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTab(item.id)}
                          className={`shrink-0 rounded-xl px-4 py-2 ${
                            tab === item.id
                              ? "bg-[#8A0EEA] text-white"
                              : "bg-slate-100"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tab === "dados" && <PetData pet={pet} />}
                  {tab === "historico" && (
                    <AppointmentHistory
                      title="Histórico de atendimentos"
                      appointments={appointments}
                    />
                  )}
                  {tab === "vacinas" && (
                    <AppointmentHistory
                      title="Vacinas"
                      appointments={vaccineAppointments}
                    />
                  )}
                  {tab === "banhos" && (
                    <AppointmentHistory
                      title="Banhos e Tosas"
                      appointments={groomingAppointments}
                    />
                  )}
                  {tab === "financeiro" && (
                    <FinancialHistory entries={financialEntries} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PetSummary({ pet }: { pet: Pet }) {
  return (
    <div className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-3xl font-bold text-slate-500">
        {pet.nome.charAt(0).toUpperCase()}
      </div>
      <h2 className="text-center text-xl font-bold">{pet.nome}</h2>
      <p className="text-center text-slate-500">{pet.raca || "-"}</p>
      <div className="mt-6 space-y-3 break-words">
        <p>
          <strong>Tutor:</strong> {pet.tutors?.nome || "-"}
        </p>
        <p>
          <strong>Espécie:</strong> {pet.especie || "-"}
        </p>
        <p>
          <strong>Sexo:</strong> {pet.sexo || "-"}
        </p>
        <p>
          <strong>Idade:</strong> {pet.idade || "-"}
        </p>
        <p>
          <strong>Porte:</strong> {pet.porte || "-"}
        </p>
      </div>
    </div>
  );
}

function PetData({ pet }: { pet: Pet }) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-lg font-bold">Dados do Pet</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoItem label="Nome" value={pet.nome} />
        <InfoItem label="Espécie" value={pet.especie} />
        <InfoItem label="Raça" value={pet.raca} />
        <InfoItem label="Sexo" value={pet.sexo} />
        <InfoItem label="Idade" value={pet.idade} />
        <InfoItem label="Porte" value={pet.porte} />
        <InfoItem label="Tutor" value={pet.tutors?.nome} />
        <InfoItem label="Telefone do tutor" value={pet.tutors?.telefone} />
        <InfoItem label="Email do tutor" value={pet.tutors?.email} />
      </div>
    </section>
  );
}

function AppointmentHistory({
  title,
  appointments,
}: {
  title: string;
  appointments: Appointment[];
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <h3 className="border-b p-4 text-lg font-bold sm:p-6">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-left">Horário</th>
              <th className="p-4 text-left">Serviços</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id} className="border-t">
                  <td className="p-4">{formatDate(appointment.data)}</td>
                  <td className="p-4">{appointment.hora}</td>
                  <td className="p-4">{appointment.servico}</td>
                  <td className="p-4">{appointment.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FinancialHistory({ entries }: { entries: FinancialEntry[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <h3 className="border-b p-4 text-lg font-bold sm:p-6">Financeiro</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Data</th>
              <th className="p-4 text-left">Descrição</th>
              <th className="p-4 text-left">Valor</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  Nenhum lançamento financeiro encontrado.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t">
                  <td className="p-4">{formatDate(entry.created_at)}</td>
                  <td className="p-4">{entry.descricao}</td>
                  <td className="p-4">{formatCurrency(entry.valor)}</td>
                  <td className="p-4">
                    {entry.status_pagamento || "Pendente"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
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
