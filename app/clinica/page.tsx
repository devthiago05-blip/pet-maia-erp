"use client";

import { CalendarClock, Search, Stethoscope, Syringe } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import { fetchClinicPatients } from "@/services/clinical";
import type { ClinicPatientOverview } from "@/types/domain";

interface ClinicPatientResponse {
  id: number;
  nome: string;
  especie: string;
  raca: string;
  porte?: string;
  sexo?: string;
  idade?: string;
  tutor_id?: number;
  tutors?: {
    nome: string;
    telefone?: string;
  };
  clinical_records?: Array<{
    consultation_date: string;
    professional_name: string;
    return_date?: string;
  }>;
  pet_vaccinations?: Array<{
    next_dose_date?: string;
  }>;
}

export default function ClinicPage() {
  const [patients, setPatients] = useState<ClinicPatientOverview[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useMountEffect(() => {
    async function loadPatients() {
      const { data, error } = await fetchClinicPatients();

      if (error) {
        console.error(error);
        setLoadError(
          "Não foi possível carregar a Clínica. Execute os scripts clínicos até o 010.",
        );
        setLoading(false);
        return;
      }

      const today = new Date().toLocaleDateString("en-CA");
      const mappedPatients = ((data || []) as ClinicPatientResponse[]).map(
        (patient) => {
          const records = [...(patient.clinical_records || [])].sort((a, b) =>
            b.consultation_date.localeCompare(a.consultation_date),
          );
          const nextReturnDate = records
            .map((record) => record.return_date)
            .filter(
              (date): date is string =>
                typeof date === "string" && date >= today,
            )
            .sort()[0];
          const nextVaccinationDate = (patient.pet_vaccinations || [])
            .map((vaccination) => vaccination.next_dose_date)
            .filter(
              (date): date is string =>
                typeof date === "string" && date >= today,
            )
            .sort()[0];

          return {
            id: patient.id,
            nome: patient.nome,
            especie: patient.especie,
            raca: patient.raca,
            porte: patient.porte,
            sexo: patient.sexo,
            idade: patient.idade,
            tutor_id: patient.tutor_id,
            tutors: patient.tutors,
            lastClinicalRecord: records[0],
            nextReturnDate,
            nextVaccinationDate,
          };
        },
      );

      setPatients(mappedPatients);
      setLoading(false);
    }

    loadPatients();
  });

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return patients.filter(
      (patient) =>
        !term ||
        patient.nome.toLowerCase().includes(term) ||
        patient.tutors?.nome.toLowerCase().includes(term) ||
        patient.raca?.toLowerCase().includes(term),
    );
  }, [patients, search]);

  const returnsCount = patients.filter(
    (patient) => patient.nextReturnDate,
  ).length;
  const vaccinationsCount = patients.filter(
    (patient) => patient.nextVaccinationDate,
  ).length;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Clínica
            </h1>
            <p className="text-slate-500">
              Prontuários, retornos e acompanhamento dos pacientes
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ClinicSummary
              icon={Stethoscope}
              label="Pacientes"
              value={patients.length}
            />
            <ClinicSummary
              icon={CalendarClock}
              label="Retornos programados"
              value={returnsCount}
            />
            <ClinicSummary
              icon={Syringe}
              label="Próximas vacinas"
              value={vaccinationsCount}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border bg-white px-4">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar paciente, tutor ou raça"
              className="min-w-0 flex-1 py-3 outline-none"
            />
          </label>

          {loadError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando pacientes...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.map((patient) => (
                <article
                  key={patient.id}
                  className="rounded-xl border bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">
                        {patient.nome}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {patient.especie || "-"} · {patient.raca || "-"}
                      </p>
                    </div>
                    <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs text-[#8A0EEA]">
                      {patient.porte || "Porte não informado"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
                    <p>
                      <strong>Tutor:</strong> {patient.tutors?.nome || "-"}
                    </p>
                    <p>
                      <strong>Última consulta:</strong>{" "}
                      {formatDate(
                        patient.lastClinicalRecord?.consultation_date,
                      )}
                    </p>
                    <p>
                      <strong>Retorno:</strong>{" "}
                      {formatDate(patient.nextReturnDate)}
                    </p>
                    <p>
                      <strong>Próxima vacina:</strong>{" "}
                      {formatDate(patient.nextVaccinationDate)}
                    </p>
                  </div>
                  <Link
                    href={`/pets/${patient.id}`}
                    className="mt-4 block rounded-xl bg-[#8A0EEA] px-4 py-2 text-center font-medium text-white"
                  >
                    Abrir prontuário
                  </Link>
                </article>
              ))}

              {filteredPatients.length === 0 && !loadError && (
                <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                  Nenhum paciente encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ClinicSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div className="rounded-xl bg-purple-50 p-3 text-[#8A0EEA]">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
