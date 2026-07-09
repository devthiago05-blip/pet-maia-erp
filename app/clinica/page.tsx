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
  fetchClinicPatients,
  saveClinicalPrescription,
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
    id: number;
    vaccine_name: string;
    application_date: string;
    professional_name: string;
    next_dose_date?: string;
  }>;
}

interface ReturnQueueItem {
  id: string;
  petId: number;
  petName: string;
  tutorName?: string;
  returnDate: string;
  consultationDate: string;
  professionalName: string;
  daysDiff: number;
}

interface VaccineQueueItem {
  id: string;
  petId: number;
  petName: string;
  tutorName?: string;
  vaccineName: string;
  applicationDate: string;
  nextDoseDate: string;
  professionalName: string;
  daysDiff: number;
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
          const vaccinations = [...(patient.pet_vaccinations || [])].sort(
            (a, b) => b.application_date.localeCompare(a.application_date),
          );
          const nextReturnDate = records
            .map((record) => record.return_date)
            .filter(
              (date): date is string =>
                typeof date === "string" && date >= today,
            )
            .sort()[0];
          const nextVaccinationDate = vaccinations
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
            vaccinationRecords: vaccinations,
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
  const weeklyReturns = useMemo(() => {
    const today = getDateOnly(new Date());
    const endDate = addDays(today, 7);

    return patients
      .flatMap((patient) =>
        (patient.clinicalRecords || [])
          .filter(
            (record) =>
              record.return_date &&
              parseDateOnly(record.return_date) <= endDate,
          )
          .map((record) => {
            const returnDate = record.return_date || "";

            return {
              id: `${patient.id}-${record.id}`,
              petId: patient.id,
              petName: patient.nome,
              tutorName: patient.tutors?.nome,
              returnDate,
              consultationDate: record.consultation_date,
              professionalName: record.professional_name,
              daysDiff: differenceInDays(parseDateOnly(returnDate), today),
            };
          }),
      )
      .sort(
        (a, b) =>
          a.returnDate.localeCompare(b.returnDate) ||
          a.petName.localeCompare(b.petName),
      );
  }, [patients]);
  const vaccineAlerts = useMemo(() => {
    const today = getDateOnly(new Date());
    const endDate = addDays(today, 30);

    return patients
      .flatMap((patient) =>
        (patient.vaccinationRecords || [])
          .filter(
            (vaccination) =>
              vaccination.next_dose_date &&
              parseDateOnly(vaccination.next_dose_date) <= endDate,
          )
          .map((vaccination) => {
            const nextDoseDate = vaccination.next_dose_date || "";

            return {
              id: `${patient.id}-${vaccination.id}`,
              petId: patient.id,
              petName: patient.nome,
              tutorName: patient.tutors?.nome,
              vaccineName: vaccination.vaccine_name,
              applicationDate: vaccination.application_date,
              nextDoseDate,
              professionalName: vaccination.professional_name,
              daysDiff: differenceInDays(parseDateOnly(nextDoseDate), today),
            };
          }),
      )
      .sort(
        (a, b) =>
          a.nextDoseDate.localeCompare(b.nextDoseDate) ||
          a.petName.localeCompare(b.petName),
      );
  }, [patients]);

  async function handleCreateDocument(input: ClinicalDocumentInput) {
    const { error } = await createClinicalDocument(input);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Documento clínico salvo!");
  }

  async function handleCreatePrescription(input: NewClinicalPrescriptionInput) {
    const { error } = await saveClinicalPrescription(input);

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
            professionalCrmv={profile?.crmv || ""}
            onDocumentSave={handleCreateDocument}
            onPrescriptionSave={handleCreatePrescription}
          />

          <WeeklyReturnsQueue returns={weeklyReturns} />

          <VaccineAlertsQueue vaccines={vaccineAlerts} />

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
  professionalCrmv,
  onDocumentSave,
  onPrescriptionSave,
}: {
  patients: ClinicPatientOverview[];
  professionalName: string;
  professionalCrmv: string;
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
              defaultProfessionalCrmv={professionalCrmv}
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

function WeeklyReturnsQueue({ returns }: { returns: ReturnQueueItem[] }) {
  const overdueCount = returns.filter((item) => item.daysDiff < 0).length;
  const todayCount = returns.filter((item) => item.daysDiff === 0).length;
  const upcomingCount = returns.filter((item) => item.daysDiff > 0).length;

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Fila de retornos</h2>
          <p className="text-sm text-slate-500">
            Atrasados, retornos de hoje e proximos 7 dias.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-64">
          <ReturnCounter label="Atrasados" value={overdueCount} tone="danger" />
          <ReturnCounter label="Hoje" value={todayCount} tone="warning" />
          <ReturnCounter label="7 dias" value={upcomingCount} tone="success" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {returns.length > 0 ? (
          <div className="min-w-[720px] divide-y">
            {returns.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.2fr_1.1fr_1fr_1.1fr_auto] items-center gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.petName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.tutorName || "Tutor nao informado"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{formatDate(item.returnDate)}</p>
                  <ReturnStatus daysDiff={item.daysDiff} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Consulta base</p>
                  <p>{formatDate(item.consultationDate)}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-500">
                    Profissional
                  </p>
                  <p className="truncate">{item.professionalName || "-"}</p>
                </div>
                <Link
                  href={`/pets/${item.petId}`}
                  className="rounded-xl border border-[#8A0EEA] px-3 py-2 text-center font-medium text-[#8A0EEA] transition hover:bg-purple-50"
                >
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhum retorno atrasado ou previsto para os proximos 7 dias.
          </div>
        )}
      </div>
    </section>
  );
}

function ReturnCounter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success";
}) {
  const toneClasses = {
    danger: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className={`rounded-xl px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 leading-none">{label}</p>
    </div>
  );
}

function ReturnStatus({ daysDiff }: { daysDiff: number }) {
  if (daysDiff < 0) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
        Atrasado ha {Math.abs(daysDiff)} dia(s)
      </span>
    );
  }

  if (daysDiff === 0) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
        Retorno hoje
      </span>
    );
  }

  return (
    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
      Em {daysDiff} dia(s)
    </span>
  );
}

function VaccineAlertsQueue({ vaccines }: { vaccines: VaccineQueueItem[] }) {
  const overdueCount = vaccines.filter((item) => item.daysDiff < 0).length;
  const todayCount = vaccines.filter((item) => item.daysDiff === 0).length;
  const upcomingCount = vaccines.filter((item) => item.daysDiff > 0).length;

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Vacinas em atencao</h2>
          <p className="text-sm text-slate-500">
            Doses atrasadas, vencendo hoje e proximas doses em ate 30 dias.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-64">
          <ReturnCounter label="Atrasadas" value={overdueCount} tone="danger" />
          <ReturnCounter label="Hoje" value={todayCount} tone="warning" />
          <ReturnCounter label="30 dias" value={upcomingCount} tone="success" />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {vaccines.length > 0 ? (
          <div className="min-w-[780px] divide-y">
            {vaccines.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.1fr_1.2fr_1fr_1.1fr_auto] items-center gap-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.petName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {item.tutorName || "Tutor nao informado"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.vaccineName}</p>
                  <p className="text-xs text-slate-500">
                    Aplicada em {formatDate(item.applicationDate)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{formatDate(item.nextDoseDate)}</p>
                  <VaccineStatus daysDiff={item.daysDiff} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-slate-500">
                    Profissional
                  </p>
                  <p className="truncate">{item.professionalName || "-"}</p>
                </div>
                <Link
                  href={`/pets/${item.petId}`}
                  className="rounded-xl border border-[#8A0EEA] px-3 py-2 text-center font-medium text-[#8A0EEA] transition hover:bg-purple-50"
                >
                  Abrir
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhuma vacina atrasada ou prevista para os proximos 30 dias.
          </div>
        )}
      </div>
    </section>
  );
}

function VaccineStatus({ daysDiff }: { daysDiff: number }) {
  if (daysDiff < 0) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
        Atrasada ha {Math.abs(daysDiff)} dia(s)
      </span>
    );
  }

  if (daysDiff === 0) {
    return (
      <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
        Dose hoje
      </span>
    );
  }

  return (
    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
      Em {daysDiff} dia(s)
    </span>
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

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function differenceInDays(date: Date, baseDate: Date) {
  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  return Math.round(
    (getDateOnly(date).getTime() - getDateOnly(baseDate).getTime()) /
      dayInMilliseconds,
  );
}
