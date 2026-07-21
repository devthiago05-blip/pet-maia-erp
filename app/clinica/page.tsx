"use client";

import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Search,
  Stethoscope,
  Syringe,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { ClinicalCatalogManager } from "@/components/clinic/ClinicalCatalogManager";
import { ClinicalDocumentModal } from "@/components/clinic/ClinicalDocumentModal";
import { ClinicalDocumentTemplateManager } from "@/components/clinic/ClinicalDocumentTemplateManager";
import { ClinicalTasksPanel } from "@/components/clinic/ClinicalTasksPanel";
import { PrescriptionModal } from "@/components/clinic/PrescriptionModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import { normalizeBrazilianWhatsAppPhone } from "@/lib/whatsapp";
import {
  createClinicalDocument,
  createClinicalTask,
  deleteClinicalTask,
  fetchClinicalTasks,
  fetchClinicPatients,
  saveClinicalPrescription,
  setClinicalReturnConfirmation,
  setClinicalTaskCompleted,
  setVaccinationConfirmation,
} from "@/services/clinical";
import type {
  ClinicalDocumentInput,
  ClinicalTask,
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
    reminder_status?: "Pendente" | "Confirmado";
    reminder_confirmed_at?: string;
  }>;
  pet_vaccinations?: Array<{
    id: number;
    vaccine_name: string;
    application_date: string;
    professional_name: string;
    next_dose_date?: string;
    reminder_status?: "Pendente" | "Confirmado";
    reminder_confirmed_at?: string;
  }>;
}

interface ReturnQueueItem {
  id: string;
  recordId: number;
  petId: number;
  petName: string;
  tutorName?: string;
  tutorPhone?: string;
  returnDate: string;
  consultationDate: string;
  professionalName: string;
  daysDiff: number;
  reminderStatus: "Pendente" | "Confirmado";
}

interface VaccineQueueItem {
  id: string;
  vaccinationId: number;
  petId: number;
  petName: string;
  tutorName?: string;
  tutorPhone?: string;
  vaccineName: string;
  applicationDate: string;
  nextDoseDate: string;
  professionalName: string;
  daysDiff: number;
  reminderStatus: "Pendente" | "Confirmado";
}

type QueueFilter = "all" | "overdue" | "today" | "upcoming";

export default function ClinicPage() {
  const { profile } = useAccess();
  const [patients, setPatients] = useState<ClinicPatientOverview[]>([]);
  const [clinicalTasks, setClinicalTasks] = useState<ClinicalTask[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useMountEffect(() => {
    async function loadPatients() {
      const [patientsResponse, tasksResponse] = await Promise.all([
        fetchClinicPatients(),
        fetchClinicalTasks(),
      ]);
      const { data, error } = patientsResponse;

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
      if (tasksResponse.error) {
        console.error(tasksResponse.error);
        toast.error("Não foi possível carregar as tarefas clínicas.");
      } else {
        setClinicalTasks(tasksResponse.data || []);
      }
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
              recordId: record.id,
              petId: patient.id,
              petName: patient.nome,
              tutorName: patient.tutors?.nome,
              tutorPhone: patient.tutors?.telefone,
              returnDate,
              consultationDate: record.consultation_date,
              professionalName: record.professional_name,
              daysDiff: differenceInDays(parseDateOnly(returnDate), today),
              reminderStatus: record.reminder_status || "Pendente",
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
              vaccinationId: vaccination.id,
              petId: patient.id,
              petName: patient.nome,
              tutorName: patient.tutors?.nome,
              tutorPhone: patient.tutors?.telefone,
              vaccineName: vaccination.vaccine_name,
              applicationDate: vaccination.application_date,
              nextDoseDate,
              professionalName: vaccination.professional_name,
              daysDiff: differenceInDays(parseDateOnly(nextDoseDate), today),
              reminderStatus: vaccination.reminder_status || "Pendente",
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

  async function handleReturnConfirmation(
    recordId: number,
    confirmed: boolean,
  ) {
    const { error } = await setClinicalReturnConfirmation(recordId, confirmed);

    if (error) {
      toast.error("Não foi possível atualizar a confirmação do retorno.");
      return false;
    }

    setPatients((current) =>
      current.map((patient) => ({
        ...patient,
        clinicalRecords: patient.clinicalRecords?.map((record) =>
          record.id === recordId
            ? {
                ...record,
                reminder_status: confirmed ? "Confirmado" : "Pendente",
                reminder_confirmed_at: confirmed
                  ? new Date().toISOString()
                  : undefined,
              }
            : record,
        ),
      })),
    );
    toast.success(confirmed ? "Retorno confirmado!" : "Confirmação removida.");
    return true;
  }

  async function handleVaccinationConfirmation(
    vaccinationId: number,
    confirmed: boolean,
  ) {
    const { error } = await setVaccinationConfirmation(
      vaccinationId,
      confirmed,
    );

    if (error) {
      toast.error("Não foi possível atualizar a confirmação da vacina.");
      return false;
    }

    setPatients((current) =>
      current.map((patient) => ({
        ...patient,
        vaccinationRecords: patient.vaccinationRecords?.map((vaccination) =>
          vaccination.id === vaccinationId
            ? {
                ...vaccination,
                reminder_status: confirmed ? "Confirmado" : "Pendente",
                reminder_confirmed_at: confirmed
                  ? new Date().toISOString()
                  : undefined,
              }
            : vaccination,
        ),
      })),
    );
    toast.success(confirmed ? "Vacina confirmada!" : "Confirmação removida.");
    return true;
  }

  async function handleCreateClinicalTask(input: {
    petId: number;
    taskType: ClinicalTask["task_type"];
    title: string;
    dueDate: string;
    priority: ClinicalTask["priority"];
    assignedTo?: string;
    notes?: string;
  }) {
    const { data, error } = await createClinicalTask(input);
    if (error) {
      toast.error("Não foi possível criar a tarefa clínica.");
      return false;
    }
    setClinicalTasks((current) => [...current, data]);
    toast.success("Tarefa clínica criada!");
    return true;
  }

  async function handleToggleClinicalTask(taskId: number, completed: boolean) {
    const { data, error } = await setClinicalTaskCompleted(taskId, completed);
    if (error) {
      toast.error("Não foi possível atualizar a tarefa.");
      return false;
    }
    setClinicalTasks((current) =>
      current.map((task) => (task.id === taskId ? data : task)),
    );
    toast.success(completed ? "Tarefa concluída!" : "Tarefa reaberta.");
    return true;
  }

  async function handleDeleteClinicalTask(taskId: number) {
    const { error } = await deleteClinicalTask(taskId);
    if (error) {
      toast.error("Não foi possível excluir a tarefa.");
      return false;
    }
    setClinicalTasks((current) => current.filter((task) => task.id !== taskId));
    toast.success("Tarefa excluída.");
    return true;
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

          <DailyVetDashboard
            returns={weeklyReturns}
            vaccines={vaccineAlerts}
            tasks={clinicalTasks}
            onReturnConfirmation={handleReturnConfirmation}
            onVaccinationConfirmation={handleVaccinationConfirmation}
            onTaskToggle={handleToggleClinicalTask}
          />

          <ClinicalTasksPanel
            tasks={clinicalTasks}
            patients={patients}
            professionalName={profile?.nome || ""}
            onCreate={handleCreateClinicalTask}
            onToggle={handleToggleClinicalTask}
            onDelete={handleDeleteClinicalTask}
          />

          <ClinicDocumentWorkspace
            patients={patients}
            professionalName={profile?.nome || ""}
            professionalCrmv={profile?.crmv || ""}
            onDocumentSave={handleCreateDocument}
            onPrescriptionSave={handleCreatePrescription}
          />

          <ClinicalCatalogManager />

          <ClinicalDocumentTemplateManager />

          <WeeklyReturnsQueue
            returns={weeklyReturns}
            onConfirmationChange={handleReturnConfirmation}
          />

          <VaccineAlertsQueue
            vaccines={vaccineAlerts}
            onConfirmationChange={handleVaccinationConfirmation}
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

function DailyVetDashboard({
  returns,
  vaccines,
  tasks,
  onReturnConfirmation,
  onVaccinationConfirmation,
  onTaskToggle,
}: {
  returns: ReturnQueueItem[];
  vaccines: VaccineQueueItem[];
  tasks: ClinicalTask[];
  onReturnConfirmation: (
    recordId: number,
    confirmed: boolean,
  ) => Promise<boolean>;
  onVaccinationConfirmation: (
    vaccinationId: number,
    confirmed: boolean,
  ) => Promise<boolean>;
  onTaskToggle: (taskId: number, completed: boolean) => Promise<boolean>;
}) {
  const items = [
    ...returns.map((item) => ({
      id: `return-${item.id}`,
      sourceId: item.recordId,
      kind: "return" as const,
      title: `Retorno de ${item.petName}`,
      detail: "Retorno clínico",
      date: item.returnDate,
      daysDiff: item.daysDiff,
      confirmed: item.reminderStatus === "Confirmado",
      petId: item.petId,
      petName: item.petName,
      tutorName: item.tutorName,
      tutorPhone: item.tutorPhone,
    })),
    ...vaccines.map((item) => ({
      id: `vaccine-${item.id}`,
      sourceId: item.vaccinationId,
      kind: "vaccine" as const,
      title: `Vacina de ${item.petName}`,
      detail: item.vaccineName,
      date: item.nextDoseDate,
      daysDiff: item.daysDiff,
      confirmed: item.reminderStatus === "Confirmado",
      petId: item.petId,
      petName: item.petName,
      tutorName: item.tutorName,
      tutorPhone: item.tutorPhone,
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      sourceId: task.id,
      kind: "task" as const,
      title: task.title,
      detail: `${task.task_type} · ${task.priority}`,
      date: task.due_date,
      daysDiff: differenceInDays(
        parseDateOnly(task.due_date),
        getDateOnly(new Date()),
      ),
      confirmed: task.status === "Concluída",
      petId: task.pet_id,
      petName: task.pets?.nome || "Pet",
      tutorName: task.pets?.tutors?.nome,
      tutorPhone: task.pets?.tutors?.telefone,
    })),
  ];
  const actionableItems = items
    .filter((item) => item.daysDiff <= 0 || !item.confirmed)
    .sort(
      (a, b) =>
        Number(a.confirmed) - Number(b.confirmed) ||
        a.daysDiff - b.daysDiff ||
        a.title.localeCompare(b.title),
    )
    .slice(0, 8);
  const overdueCount = items.filter(
    (item) => item.daysDiff < 0 && !item.confirmed,
  ).length;
  const todayCount = items.filter((item) => item.daysDiff === 0).length;
  const tomorrowCount = items.filter((item) => item.daysDiff === 1).length;
  const confirmedTodayCount = items.filter(
    (item) => item.daysDiff === 0 && item.confirmed,
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-purple-50 to-white p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#8A0EEA] p-3 text-white">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Painel do Veterinário Hoje</h2>
            <p className="text-sm text-slate-500">
              Prioridades clínicas e preparação do próximo dia.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DailyMetric label="Atrasados" value={overdueCount} tone="danger" />
          <DailyMetric label="Para hoje" value={todayCount} tone="warning" />
          <DailyMetric
            label="Confirmados hoje"
            value={confirmedTodayCount}
            tone="success"
          />
          <DailyMetric label="Amanhã" value={tomorrowCount} tone="info" />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-bold">Ações prioritárias</h3>
          <span className="text-xs text-slate-500">
            {actionableItems.length} exibida(s)
          </span>
        </div>
        {actionableItems.length > 0 ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {actionableItems.map((item) => (
              <article
                key={item.id}
                className={`rounded-xl border p-3 ${
                  item.confirmed
                    ? "border-emerald-100 bg-emerald-50/40"
                    : item.daysDiff < 0
                      ? "border-rose-200 bg-rose-50/40"
                      : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.title}</p>
                    <p className="truncate text-sm text-slate-500">
                      {item.detail} · {item.tutorName || "Tutor não informado"}
                    </p>
                  </div>
                  {item.daysDiff < 0 ? (
                    <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                      {Math.abs(item.daysDiff)}d atrasado
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-[#8A0EEA]">
                      {item.daysDiff === 0 ? "Hoje" : formatDate(item.date)}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {item.kind === "task" ? (
                    <span className="flex items-center justify-center rounded-xl border bg-slate-50 px-2 text-xs font-medium text-slate-600">
                      Tarefa
                    </span>
                  ) : (
                    <ClinicWhatsAppLink
                      phone={item.tutorPhone}
                      tutorName={item.tutorName}
                      petName={item.petName}
                      date={item.date}
                      kind={item.kind}
                      vaccineName={
                        item.kind === "vaccine" ? item.detail : undefined
                      }
                      compact
                    />
                  )}
                  <ReminderConfirmationButton
                    confirmed={item.confirmed}
                    onChange={(confirmed) =>
                      item.kind === "return"
                        ? onReturnConfirmation(item.sourceId, confirmed)
                        : item.kind === "vaccine"
                          ? onVaccinationConfirmation(item.sourceId, confirmed)
                          : onTaskToggle(item.sourceId, confirmed)
                    }
                    mode={item.kind === "task" ? "task" : "confirmation"}
                    compact
                  />
                  <Link
                    href={`/pets/${item.petId}`}
                    className="flex items-center justify-center rounded-xl border border-[#8A0EEA] px-3 py-2 text-sm font-medium text-[#8A0EEA]"
                  >
                    Abrir
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhuma ação clínica prioritária no momento.
          </div>
        )}
      </div>
    </section>
  );
}

function DailyMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "warning" | "success" | "info";
}) {
  const classes = {
    danger: "bg-rose-50 text-rose-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-sky-50 text-sky-700",
  };

  return (
    <div className={`rounded-xl p-3 ${classes[tone]}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium">{label}</p>
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

function WeeklyReturnsQueue({
  returns,
  onConfirmationChange,
}: {
  returns: ReturnQueueItem[];
  onConfirmationChange: (
    recordId: number,
    confirmed: boolean,
  ) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const overdueCount = returns.filter((item) => item.daysDiff < 0).length;
  const todayCount = returns.filter((item) => item.daysDiff === 0).length;
  const upcomingCount = returns.filter((item) => item.daysDiff > 0).length;
  const filteredReturns = filterQueueItems(returns, filter);

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
      <QueueFilterBar
        allCount={returns.length}
        overdueCount={overdueCount}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        upcomingLabel="7 dias"
        value={filter}
        onChange={setFilter}
      />

      <div className="mt-4">
        {filteredReturns.length > 0 ? (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredReturns.map((item) => (
                <article key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.petName}</p>
                      <p className="truncate text-sm text-slate-500">
                        {item.tutorName || "Tutor não informado"}
                      </p>
                    </div>
                    <ReturnStatus daysDiff={item.daysDiff} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Retorno</p>
                      <p className="font-semibold">
                        {formatDate(item.returnDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Consulta base</p>
                      <p className="font-semibold">
                        {formatDate(item.consultationDate)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Profissional</p>
                      <p className="truncate font-semibold">
                        {item.professionalName || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ClinicWhatsAppLink
                      phone={item.tutorPhone}
                      tutorName={item.tutorName}
                      petName={item.petName}
                      date={item.returnDate}
                      kind="return"
                    />
                    <ReminderConfirmationButton
                      confirmed={item.reminderStatus === "Confirmado"}
                      onChange={(confirmed) =>
                        onConfirmationChange(item.recordId, confirmed)
                      }
                    />
                    <Link
                      href={`/pets/${item.petId}`}
                      className="col-span-2 rounded-xl bg-[#8A0EEA] px-3 py-2.5 text-center font-medium text-white"
                    >
                      Prontuário
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[720px] divide-y">
                {filteredReturns.map((item) => (
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
                      <p className="font-medium">
                        {formatDate(item.returnDate)}
                      </p>
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
                    <div className="flex gap-2">
                      <ClinicWhatsAppLink
                        phone={item.tutorPhone}
                        tutorName={item.tutorName}
                        petName={item.petName}
                        date={item.returnDate}
                        kind="return"
                        compact
                      />
                      <ReminderConfirmationButton
                        confirmed={item.reminderStatus === "Confirmado"}
                        onChange={(confirmed) =>
                          onConfirmationChange(item.recordId, confirmed)
                        }
                        compact
                      />
                      <Link
                        href={`/pets/${item.petId}`}
                        className="rounded-xl border border-[#8A0EEA] px-3 py-2 text-center font-medium text-[#8A0EEA] transition hover:bg-purple-50"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhum retorno encontrado para este filtro.
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

function QueueFilterBar({
  allCount,
  overdueCount,
  todayCount,
  upcomingCount,
  upcomingLabel,
  value,
  onChange,
}: {
  allCount: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  upcomingLabel: string;
  value: QueueFilter;
  onChange: (filter: QueueFilter) => void;
}) {
  const options: Array<{
    label: string;
    value: QueueFilter;
    count: number;
  }> = [
    { label: "Todos", value: "all", count: allCount },
    { label: "Atrasados", value: "overdue", count: overdueCount },
    { label: "Hoje", value: "today", count: todayCount },
    { label: upcomingLabel, value: "upcoming", count: upcomingCount },
  ];

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]"
                : "border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:bg-purple-50"
            }`}
          >
            {option.label} ({option.count})
          </button>
        );
      })}
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

function VaccineAlertsQueue({
  vaccines,
  onConfirmationChange,
}: {
  vaccines: VaccineQueueItem[];
  onConfirmationChange: (
    vaccinationId: number,
    confirmed: boolean,
  ) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const overdueCount = vaccines.filter((item) => item.daysDiff < 0).length;
  const todayCount = vaccines.filter((item) => item.daysDiff === 0).length;
  const upcomingCount = vaccines.filter((item) => item.daysDiff > 0).length;
  const filteredVaccines = filterQueueItems(vaccines, filter);

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
      <QueueFilterBar
        allCount={vaccines.length}
        overdueCount={overdueCount}
        todayCount={todayCount}
        upcomingCount={upcomingCount}
        upcomingLabel="30 dias"
        value={filter}
        onChange={setFilter}
      />

      <div className="mt-4">
        {filteredVaccines.length > 0 ? (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredVaccines.map((item) => (
                <article key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.petName}</p>
                      <p className="truncate text-sm text-slate-500">
                        {item.tutorName || "Tutor não informado"}
                      </p>
                    </div>
                    <VaccineStatus daysDiff={item.daysDiff} />
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="truncate font-semibold">{item.vaccineName}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Aplicação</p>
                        <p className="font-semibold">
                          {formatDate(item.applicationDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Próxima dose</p>
                        <p className="font-semibold">
                          {formatDate(item.nextDoseDate)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Profissional</p>
                        <p className="truncate font-semibold">
                          {item.professionalName || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <ClinicWhatsAppLink
                      phone={item.tutorPhone}
                      tutorName={item.tutorName}
                      petName={item.petName}
                      date={item.nextDoseDate}
                      kind="vaccine"
                      vaccineName={item.vaccineName}
                    />
                    <ReminderConfirmationButton
                      confirmed={item.reminderStatus === "Confirmado"}
                      onChange={(confirmed) =>
                        onConfirmationChange(item.vaccinationId, confirmed)
                      }
                    />
                    <Link
                      href={`/pets/${item.petId}`}
                      className="col-span-2 rounded-xl bg-[#8A0EEA] px-3 py-2.5 text-center font-medium text-white"
                    >
                      Prontuário
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <div className="min-w-[780px] divide-y">
                {filteredVaccines.map((item) => (
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
                      <p className="font-medium">
                        {formatDate(item.nextDoseDate)}
                      </p>
                      <VaccineStatus daysDiff={item.daysDiff} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500">
                        Profissional
                      </p>
                      <p className="truncate">{item.professionalName || "-"}</p>
                    </div>
                    <div className="flex gap-2">
                      <ClinicWhatsAppLink
                        phone={item.tutorPhone}
                        tutorName={item.tutorName}
                        petName={item.petName}
                        date={item.nextDoseDate}
                        kind="vaccine"
                        vaccineName={item.vaccineName}
                        compact
                      />
                      <ReminderConfirmationButton
                        confirmed={item.reminderStatus === "Confirmado"}
                        onChange={(confirmed) =>
                          onConfirmationChange(item.vaccinationId, confirmed)
                        }
                        compact
                      />
                      <Link
                        href={`/pets/${item.petId}`}
                        className="rounded-xl border border-[#8A0EEA] px-3 py-2 text-center font-medium text-[#8A0EEA] transition hover:bg-purple-50"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">
            Nenhuma vacina encontrada para este filtro.
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

function ReminderConfirmationButton({
  confirmed,
  onChange,
  compact = false,
  mode = "confirmation",
}: {
  confirmed: boolean;
  onChange: (confirmed: boolean) => Promise<boolean>;
  compact?: boolean;
  mode?: "confirmation" | "task";
}) {
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    setSaving(true);
    await onChange(!confirmed);
    setSaving(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 font-medium transition disabled:opacity-50 ${
        confirmed
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-300 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
      }`}
      title={
        mode === "task"
          ? confirmed
            ? "Reabrir tarefa"
            : "Concluir tarefa"
          : confirmed
            ? "Remover confirmação"
            : "Marcar como confirmado"
      }
    >
      <CheckCircle2 size={17} />
      {!compact &&
        (saving
          ? "Salvando..."
          : mode === "task"
            ? confirmed
              ? "Concluída"
              : "Concluir"
            : confirmed
              ? "Confirmado"
              : "Confirmar")}
    </button>
  );
}

function ClinicWhatsAppLink({
  phone,
  tutorName,
  petName,
  date,
  kind,
  vaccineName,
  compact = false,
}: {
  phone?: string;
  tutorName?: string;
  petName: string;
  date: string;
  kind: "return" | "vaccine";
  vaccineName?: string;
  compact?: boolean;
}) {
  const normalizedPhone = normalizeBrazilianWhatsAppPhone(phone);
  const firstName = tutorName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const subject =
    kind === "return"
      ? `o retorno de ${petName}, previsto para ${formatDate(date)}`
      : `a próxima dose de ${vaccineName || "vacina"} de ${petName}, prevista para ${formatDate(date)}`;
  const message = `${greeting} Aqui é da Pet Maia. Estamos entrando em contato para lembrar sobre ${subject}. Podemos confirmar?`;
  const classes = compact
    ? "inline-flex items-center justify-center rounded-xl border border-emerald-500 px-3 py-2 text-emerald-700 transition hover:bg-emerald-50"
    : "flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 font-medium text-white";

  if (!normalizedPhone) {
    return (
      <span
        className={`${classes} cursor-not-allowed opacity-40`}
        title="Tutor sem WhatsApp válido cadastrado"
      >
        <MessageCircle size={17} />
        {!compact && "WhatsApp"}
      </span>
    );
  }

  return (
    <a
      href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      className={classes}
      title={`Enviar lembrete para ${tutorName || "o tutor"}`}
      aria-label={`Enviar lembrete de ${kind === "return" ? "retorno" : "vacina"} pelo WhatsApp`}
    >
      <MessageCircle size={17} />
      {!compact && "WhatsApp"}
    </a>
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

function filterQueueItems<T extends { daysDiff: number }>(
  items: T[],
  filter: QueueFilter,
) {
  if (filter === "overdue") {
    return items.filter((item) => item.daysDiff < 0);
  }

  if (filter === "today") {
    return items.filter((item) => item.daysDiff === 0);
  }

  if (filter === "upcoming") {
    return items.filter((item) => item.daysDiff > 0);
  }

  return items;
}
