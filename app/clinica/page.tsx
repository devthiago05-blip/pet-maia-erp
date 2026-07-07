"use client";

import { CalendarClock, Search, Stethoscope, Syringe } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { ClinicalDocumentModal } from "@/components/clinic/ClinicalDocumentModal";
import { PrescriptionModal } from "@/components/clinic/PrescriptionModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import {
  createClinicalDocument,
  createClinicalPrescription,
  fetchClinicPatients,
} from "@/services/clinical";
import type {
  ClinicalDocumentInput,
  ClinicPatientOverview,
  NewClinicalPrescriptionInput,
} from "@/types/domain";

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
    id: number;
    consultation_date: string;
    professional_name: string;
    return_date?: string;
  }>;
  pet_vaccinations?: Array<{
    next_dose_date?: string;
  }>;
}

export default function ClinicPage() {
  const { profile } = useAccess();
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
            clinicalRecords: records,
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

  async function handleCreateDocument(input: ClinicalDocumentInput) {
    const { error } = await createClinicalDocument(input);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Documento clínico salvo!");
  }

  async function handleCreatePrescription(input: NewClinicalPrescriptionInput) {
    const { error } = await createClinicalPrescription(input);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Medicação adicionada à receita!");
  }

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

          <ClinicDocumentWorkspace
            patients={patients}
            professionalName={profile?.nome || ""}
            onDocumentSave={handleCreateDocument}
            onPrescriptionSave={handleCreatePrescription}
          />

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

function ClinicDocumentWorkspace({
  patients,
  professionalName,
  onDocumentSave,
  onPrescriptionSave,
}: {
  patients: ClinicPatientOverview[];
  professionalName: string;
  onDocumentSave: (input: ClinicalDocumentInput) => Promise<void>;
  onPrescriptionSave: (input: NewClinicalPrescriptionInput) => Promise<void>;
}) {
  const [tutorId, setTutorId] = useState("");
  const [petId, setPetId] = useState("");

  const tutors = Array.from(
    new Map(
      patients
        .filter((patient) => patient.tutor_id && patient.tutors?.nome)
        .map((patient) => [
          String(patient.tutor_id),
          patient.tutors?.nome || "Tutor não informado",
        ]),
    ),
  );
  const tutorPets = tutorId
    ? patients.filter((patient) => String(patient.tutor_id) === tutorId)
    : [];
  const selectedPet = patients.find((patient) => String(patient.id) === petId);
  const latestRecord = selectedPet?.clinicalRecords?.[0];

  return (
    <section className="border-y bg-white p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold">Documentos e receitas</h2>
        <p className="text-sm text-slate-500">
          Selecione o responsável e o paciente para emitir.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-medium">
          Tutor
          <select
            value={tutorId}
            onChange={(event) => {
              setTutorId(event.target.value);
              setPetId("");
            }}
            className="rounded-xl border p-3 font-normal"
          >
            <option value="">Selecione o tutor</option>
            {tutors.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Pet
          <select
            value={petId}
            onChange={(event) => setPetId(event.target.value)}
            disabled={!tutorId}
            className="rounded-xl border p-3 font-normal disabled:bg-slate-100"
          >
            <option value="">Selecione o pet</option>
            {tutorPets.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {selectedPet && (
            <ClinicalDocumentModal
              pet={selectedPet}
              defaultProfessionalName={professionalName}
              onSave={onDocumentSave}
            />
          )}
          {latestRecord && (
            <PrescriptionModal
              clinicalRecordId={latestRecord.id}
              onSave={onPrescriptionSave}
            />
          )}
        </div>
      </div>
      {selectedPet && !latestRecord && (
        <p className="mt-3 text-sm text-amber-700">
          Cadastre uma consulta no prontuário para emitir receita.
        </p>
      )}
    </section>
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
