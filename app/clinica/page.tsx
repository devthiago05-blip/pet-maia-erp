"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Printer,
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
import { HospitalizationPanel } from "@/components/clinic/HospitalizationPanel";
import { LaboratoryExamPanel } from "@/components/clinic/LaboratoryExamPanel";
import { PrescriptionModal } from "@/components/clinic/PrescriptionModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import { normalizeBrazilianWhatsAppPhone } from "@/lib/whatsapp";
import {
  addClinicalHospitalizationLog,
  addHospitalizationMedication,
  administerHospitalizationMedication,
  createClinicalDocument,
  createClinicalHospitalization,
  createClinicalTask,
  deleteClinicalTask,
  dischargeClinicalHospitalization,
  fetchClinicalHospitalizations,
  fetchClinicalTasks,
  fetchClinicExams,
  fetchClinicPatients,
  saveClinicalPrescription,
  setClinicalReturnConfirmation,
  setClinicalTaskCompleted,
  setVaccinationConfirmation,
  updateClinicalExamStage,
} from "@/services/clinical";
import type {
  ClinicalDocumentInput,
  ClinicalExam,
  ClinicalHospitalization,
  ClinicalPatientAlert,
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
  clinical_patient_alerts?: ClinicalPatientAlert[];
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
type PatientFilter =
  | "all"
  | "attention"
  | "return_overdue"
  | "return_today"
  | "vaccine_due"
  | "hospitalized";

interface PatientClinicStatus {
  attentionScore: number;
  criticalAlerts: number;
  overdueReturns: number;
  todayReturns: number;
  overdueVaccines: number;
  todayVaccines: number;
  pendingTasks: number;
  pendingExams: number;
  hospitalized: boolean;
}

export default function ClinicPage() {
  const { profile } = useAccess();
  const [patients, setPatients] = useState<ClinicPatientOverview[]>([]);
  const [clinicalTasks, setClinicalTasks] = useState<ClinicalTask[]>([]);
  const [hospitalizations, setHospitalizations] = useState<
    ClinicalHospitalization[]
  >([]);
  const [clinicalExams, setClinicalExams] = useState<ClinicalExam[]>([]);
  const [search, setSearch] = useState("");
  const [patientFilter, setPatientFilter] = useState<PatientFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useMountEffect(() => {
    async function loadPatients() {
      const [
        patientsResponse,
        tasksResponse,
        hospitalizationsResponse,
        examsResponse,
      ] = await Promise.all([
        fetchClinicPatients(),
        fetchClinicalTasks(),
        fetchClinicalHospitalizations(),
        fetchClinicExams(),
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
            clinicalAlerts: (patient.clinical_patient_alerts || []).filter(
              (alert) => alert.active,
            ),
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
      if (!hospitalizationsResponse.error)
        setHospitalizations(hospitalizationsResponse.data || []);
      if (examsResponse.error) {
        console.error(examsResponse.error);
        toast.error("Não foi possível carregar os exames da clínica.");
      } else {
        setClinicalExams(examsResponse.data || []);
      }
      setLoading(false);
    }

    loadPatients();
  });

  const activeHospitalizations = useMemo(
    () => hospitalizations.filter((item) => item.status === "Internado"),
    [hospitalizations],
  );
  const hospitalizedPetIds = useMemo(
    () => new Set(activeHospitalizations.map((item) => item.pet_id)),
    [activeHospitalizations],
  );
  const pendingTasksByPet = useMemo(() => {
    const counts = new Map<number, number>();

    clinicalTasks
      .filter((task) => task.status === "Pendente")
      .forEach((task) => {
        counts.set(task.pet_id, (counts.get(task.pet_id) || 0) + 1);
      });

    return counts;
  }, [clinicalTasks]);
  const pendingExamsByPet = useMemo(() => {
    const counts = new Map<number, number>();

    clinicalExams
      .filter(
        (exam) => exam.status !== "Concluído" && exam.status !== "Cancelado",
      )
      .forEach((exam) => {
        counts.set(exam.pet_id, (counts.get(exam.pet_id) || 0) + 1);
      });

    return counts;
  }, [clinicalExams]);
  const patientStatuses = useMemo(() => {
    const today = getDateOnly(new Date());

    return new Map(
      patients.map((patient) => {
        const openReturns = (patient.clinicalRecords || []).filter(
          (record) =>
            record.return_date && record.reminder_status !== "Confirmado",
        );
        const openVaccines = (patient.vaccinationRecords || []).filter(
          (vaccination) =>
            vaccination.next_dose_date &&
            vaccination.reminder_status !== "Confirmado",
        );
        const overdueReturns = openReturns.filter(
          (record) =>
            record.return_date &&
            differenceInDays(parseDateOnly(record.return_date), today) < 0,
        ).length;
        const todayReturns = openReturns.filter(
          (record) =>
            record.return_date &&
            differenceInDays(parseDateOnly(record.return_date), today) === 0,
        ).length;
        const overdueVaccines = openVaccines.filter(
          (vaccination) =>
            vaccination.next_dose_date &&
            differenceInDays(parseDateOnly(vaccination.next_dose_date), today) <
              0,
        ).length;
        const todayVaccines = openVaccines.filter(
          (vaccination) =>
            vaccination.next_dose_date &&
            differenceInDays(
              parseDateOnly(vaccination.next_dose_date),
              today,
            ) === 0,
        ).length;
        const criticalAlerts = (patient.clinicalAlerts || []).filter(
          (alert) => alert.severity === "Crítico",
        ).length;
        const pendingTasks = pendingTasksByPet.get(patient.id) || 0;
        const pendingExams = pendingExamsByPet.get(patient.id) || 0;
        const hospitalized = hospitalizedPetIds.has(patient.id);
        const attentionScore =
          criticalAlerts * 6 +
          overdueReturns * 5 +
          overdueVaccines * 5 +
          todayReturns * 3 +
          todayVaccines * 3 +
          pendingExams * 2 +
          pendingTasks +
          (hospitalized ? 4 : 0);

        return [
          patient.id,
          {
            attentionScore,
            criticalAlerts,
            overdueReturns,
            todayReturns,
            overdueVaccines,
            todayVaccines,
            pendingTasks,
            pendingExams,
            hospitalized,
          },
        ];
      }),
    );
  }, [hospitalizedPetIds, patients, pendingExamsByPet, pendingTasksByPet]);
  const patientFilterOptions = useMemo(
    () => [
      { label: "Todos", value: "all" as const, count: patients.length },
      {
        label: "Em atenção",
        value: "attention" as const,
        count: patients.filter(
          (patient) =>
            (patientStatuses.get(patient.id)?.attentionScore || 0) > 0,
        ).length,
      },
      {
        label: "Retorno atrasado",
        value: "return_overdue" as const,
        count: patients.filter(
          (patient) =>
            (patientStatuses.get(patient.id)?.overdueReturns || 0) > 0,
        ).length,
      },
      {
        label: "Retorno hoje",
        value: "return_today" as const,
        count: patients.filter(
          (patient) => (patientStatuses.get(patient.id)?.todayReturns || 0) > 0,
        ).length,
      },
      {
        label: "Vacina pendente",
        value: "vaccine_due" as const,
        count: patients.filter((patient) => {
          const status = patientStatuses.get(patient.id);

          return (
            (status?.overdueVaccines || 0) + (status?.todayVaccines || 0) > 0
          );
        }).length,
      },
      {
        label: "Internados",
        value: "hospitalized" as const,
        count: patients.filter(
          (patient) => patientStatuses.get(patient.id)?.hospitalized,
        ).length,
      },
    ],
    [patientStatuses, patients],
  );
  const filteredPatients = useMemo(() => {
    const term = normalizeSearchText(search);

    return patients
      .filter((patient) => {
        const status = patientStatuses.get(patient.id);
        const searchableText = normalizeSearchText(
          [
            patient.nome,
            patient.tutors?.nome,
            patient.raca,
            patient.especie,
            patient.porte,
          ]
            .filter(Boolean)
            .join(" "),
        );
        const matchesSearch = !term || searchableText.includes(term);
        const matchesFilter =
          patientFilter === "all" ||
          (patientFilter === "attention" &&
            (status?.attentionScore || 0) > 0) ||
          (patientFilter === "return_overdue" &&
            (status?.overdueReturns || 0) > 0) ||
          (patientFilter === "return_today" &&
            (status?.todayReturns || 0) > 0) ||
          (patientFilter === "vaccine_due" &&
            (status?.overdueVaccines || 0) + (status?.todayVaccines || 0) >
              0) ||
          (patientFilter === "hospitalized" && Boolean(status?.hospitalized));

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const statusA = patientStatuses.get(a.id)?.attentionScore || 0;
        const statusB = patientStatuses.get(b.id)?.attentionScore || 0;

        return (
          statusB - statusA ||
          (b.lastClinicalRecord?.consultation_date || "").localeCompare(
            a.lastClinicalRecord?.consultation_date || "",
          ) ||
          a.nome.localeCompare(b.nome)
        );
      });
  }, [patientFilter, patientStatuses, patients, search]);

  const criticalAlertsCount = patients.reduce(
    (total, patient) =>
      total +
      (patient.clinicalAlerts || []).filter(
        (alert) => alert.severity === "Crítico",
      ).length,
    0,
  );
  const pendingTasksCount = clinicalTasks.filter(
    (task) => task.status === "Pendente",
  ).length;
  const pendingExamsCount = clinicalExams.filter(
    (exam) => exam.status !== "Concluído" && exam.status !== "Cancelado",
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
  const pendingClinicalCount =
    weeklyReturns.filter((item) => item.reminderStatus !== "Confirmado")
      .length +
    vaccineAlerts.filter((item) => item.reminderStatus !== "Confirmado")
      .length +
    pendingTasksCount +
    pendingExamsCount;

  function handlePrintClinic() {
    window.print();
  }

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

  async function handleAdmit(input: {
    petId: number;
    reason: string;
    veterinarianName?: string;
    kennel?: string;
  }) {
    const { data, error } = await createClinicalHospitalization(input);
    if (error) {
      toast.error("Não foi possível internar o paciente.");
      return false;
    }
    setHospitalizations((current) => [data, ...current]);
    toast.success("Paciente internado!");
    return true;
  }

  async function handleHospitalizationLog(
    input: Parameters<typeof addClinicalHospitalizationLog>[0],
  ) {
    const { data, error } = await addClinicalHospitalizationLog(input);
    if (error) {
      toast.error("Não foi possível salvar o registro.");
      return false;
    }
    setHospitalizations((current) =>
      current.map((item) =>
        item.id === input.hospitalizationId
          ? {
              ...item,
              clinical_hospitalization_logs: [
                data,
                ...(item.clinical_hospitalization_logs || []),
              ],
            }
          : item,
      ),
    );
    toast.success("Registro de internação salvo!");
    return true;
  }

  async function handleDischarge(id: number) {
    if (!window.confirm("Confirmar alta deste paciente?")) return false;
    const { data, error } = await dischargeClinicalHospitalization(id);
    if (error) {
      toast.error("Não foi possível registrar a alta.");
      return false;
    }
    setHospitalizations((current) =>
      current.map((item) => (item.id === id ? data : item)),
    );
    toast.success("Alta registrada!");
    return true;
  }

  async function handleMedication(
    input: Parameters<typeof addHospitalizationMedication>[0],
  ) {
    const { data, error } = await addHospitalizationMedication(input);
    if (error) {
      toast.error("Não foi possível agendar o medicamento.");
      return false;
    }
    setHospitalizations((c) =>
      c.map((h) =>
        h.id === input.hospitalizationId
          ? {
              ...h,
              clinical_hospitalization_medications: [
                ...(h.clinical_hospitalization_medications || []),
                data,
              ],
            }
          : h,
      ),
    );
    toast.success("Medicamento agendado!");
    return true;
  }
  async function handleAdminister(
    hospitalizationId: number,
    medicationId: number,
  ) {
    const { data, error } = await administerHospitalizationMedication(
      medicationId,
      profile?.nome || "",
    );
    if (error) {
      toast.error("Não foi possível confirmar a administração.");
      return false;
    }
    setHospitalizations((c) =>
      c.map((h) =>
        h.id === hospitalizationId
          ? {
              ...h,
              clinical_hospitalization_medications: (
                h.clinical_hospitalization_medications || []
              ).map((m) => (m.id === medicationId ? data : m)),
            }
          : h,
      ),
    );
    toast.success("Medicamento administrado!");
    return true;
  }

  async function handleExamStageChange(
    examId: number,
    status: ClinicalExam["status"],
  ) {
    const { data, error } = await updateClinicalExamStage(examId, status);
    if (error) {
      toast.error("Não foi possível atualizar o exame.");
      return false;
    }
    setClinicalExams((current) =>
      current.map((exam) => (exam.id === examId ? data : exam)),
    );
    toast.success(
      status === "Coletado"
        ? "Coleta confirmada!"
        : "Resultado disponibilizado!",
    );
    return true;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Clínica
              </h1>
              <p className="text-slate-500">
                Prontuários, retornos e acompanhamento dos pacientes
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintClinic}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 lg:w-auto"
            >
              <Printer size={18} />
              Imprimir resumo
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ClinicSummary
              icon={Stethoscope}
              label="Pacientes"
              value={patients.length}
            />
            <ClinicSummary
              icon={CalendarClock}
              label="Pacientes em atenção"
              value={
                patientFilterOptions.find((item) => item.value === "attention")
                  ?.count || 0
              }
              warning={
                Boolean(
                  patientFilterOptions.find(
                    (item) => item.value === "attention",
                  )?.count,
                ) || criticalAlertsCount > 0
              }
            />
            <ClinicSummary
              icon={Syringe}
              label="Internados"
              value={activeHospitalizations.length}
              warning={activeHospitalizations.length > 0}
            />
            <ClinicSummary
              icon={AlertTriangle}
              label="Pendências clínicas"
              value={pendingClinicalCount}
              warning={pendingClinicalCount > 0}
            />
          </div>

          <DailyVetDashboard
            returns={weeklyReturns}
            vaccines={vaccineAlerts}
            tasks={clinicalTasks}
            hospitalizations={hospitalizations}
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

          <HospitalizationPanel
            hospitalizations={hospitalizations}
            patients={patients}
            professionalName={profile?.nome || ""}
            onAdmit={handleAdmit}
            onLog={handleHospitalizationLog}
            onDischarge={handleDischarge}
            onMedication={handleMedication}
            onAdminister={handleAdminister}
          />

          <LaboratoryExamPanel
            exams={clinicalExams}
            onStageChange={handleExamStageChange}
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

          <PatientFilterBar
            options={patientFilterOptions}
            value={patientFilter}
            onChange={setPatientFilter}
          />

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
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  status={patientStatuses.get(patient.id)}
                />
              ))}

              {filteredPatients.length === 0 && !loadError && (
                <div className="rounded-xl border bg-white p-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                  Nenhum paciente encontrado.
                </div>
              )}
            </div>
          )}
        </div>
        <ClinicPrintView
          patients={filteredPatients}
          returns={weeklyReturns}
          vaccines={vaccineAlerts}
          tasks={clinicalTasks}
          hospitalizations={activeHospitalizations}
          pendingExamsCount={pendingExamsCount}
          pendingClinicalCount={pendingClinicalCount}
          patientStatuses={patientStatuses}
        />
      </main>
    </div>
  );
}

function PatientFilterBar({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: PatientFilter; count: number }>;
  value: PatientFilter;
  onChange: (value: PatientFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-xl border bg-white p-2">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-[#8A0EEA] text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {option.label} ({option.count})
          </button>
        );
      })}
    </div>
  );
}

function PatientCard({
  patient,
  status,
}: {
  patient: ClinicPatientOverview;
  status?: PatientClinicStatus;
}) {
  const hasAttention = Boolean(status && status.attentionScore > 0);

  return (
    <article
      className={`rounded-xl border bg-white p-4 ${
        hasAttention ? "border-amber-200 shadow-sm shadow-amber-100" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{patient.nome}</h2>
          <p className="text-sm text-slate-500">
            {patient.especie || "-"} · {patient.raca || "-"}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-purple-50 px-2 py-1 text-xs text-[#8A0EEA]">
          {patient.porte || "Porte não informado"}
        </span>
      </div>

      <PatientStatusBadges patient={patient} status={status} />

      <div className="mt-4 space-y-2 text-sm">
        <p>
          <strong>Tutor:</strong> {patient.tutors?.nome || "-"}
        </p>
        <p>
          <strong>Última consulta:</strong>{" "}
          {formatDate(patient.lastClinicalRecord?.consultation_date)}
        </p>
        <p>
          <strong>Retorno:</strong> {formatDate(patient.nextReturnDate)}
        </p>
        <p>
          <strong>Próxima vacina:</strong>{" "}
          {formatDate(patient.nextVaccinationDate)}
        </p>
        {(status?.pendingTasks || 0) + (status?.pendingExams || 0) > 0 && (
          <p className="text-amber-700">
            <strong>Pendências:</strong> {status?.pendingTasks || 0} tarefa(s),{" "}
            {status?.pendingExams || 0} exame(s)
          </p>
        )}
      </div>

      {(patient.clinicalAlerts || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          {(patient.clinicalAlerts || []).slice(0, 3).map((alert) => (
            <span
              key={alert.id}
              className={`rounded-full px-2 py-1 text-xs font-bold ${
                alert.severity === "Crítico"
                  ? "bg-red-100 text-red-700"
                  : alert.severity === "Atenção"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {alert.alert_type}: {alert.title}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PatientWhatsAppLink patient={patient} />
        <Link
          href={`/pets/${patient.id}`}
          className="block rounded-xl bg-[#8A0EEA] px-4 py-2 text-center font-medium text-white"
        >
          Abrir prontuário
        </Link>
      </div>
    </article>
  );
}

function PatientStatusBadges({
  patient,
  status,
}: {
  patient: ClinicPatientOverview;
  status?: PatientClinicStatus;
}) {
  const badges = [
    status?.hospitalized
      ? { label: "Internado", classes: "bg-sky-100 text-sky-700" }
      : null,
    status?.criticalAlerts
      ? {
          label: `${status.criticalAlerts} alerta(s) crítico(s)`,
          classes: "bg-red-100 text-red-700",
        }
      : null,
    status?.overdueReturns
      ? {
          label: `${status.overdueReturns} retorno(s) atrasado(s)`,
          classes: "bg-rose-100 text-rose-700",
        }
      : null,
    status?.todayReturns
      ? {
          label: `${status.todayReturns} retorno(s) hoje`,
          classes: "bg-amber-100 text-amber-800",
        }
      : null,
    status?.overdueVaccines
      ? {
          label: `${status.overdueVaccines} vacina(s) atrasada(s)`,
          classes: "bg-rose-100 text-rose-700",
        }
      : null,
    status?.todayVaccines
      ? {
          label: `${status.todayVaccines} vacina(s) hoje`,
          classes: "bg-amber-100 text-amber-800",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; classes: string }>;

  if (badges.length === 0) {
    return (
      <div className="mt-3">
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
          Rotina em dia
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      aria-label={`Status de ${patient.nome}`}
    >
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`rounded-full px-2 py-1 text-xs font-bold ${badge.classes}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function PatientWhatsAppLink({ patient }: { patient: ClinicPatientOverview }) {
  const normalizedPhone = normalizeBrazilianWhatsAppPhone(
    patient.tutors?.telefone,
  );
  const firstName = patient.tutors?.nome?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const message = `${greeting} Aqui é da Pet Maia. Estamos entrando em contato sobre o acompanhamento clínico de ${patient.nome}.`;
  const classes =
    "flex items-center justify-center gap-2 rounded-xl border border-emerald-500 px-3 py-2 font-medium text-emerald-700 transition hover:bg-emerald-50";

  if (!normalizedPhone) {
    return (
      <span
        className={`${classes} cursor-not-allowed opacity-40`}
        title="Tutor sem WhatsApp válido cadastrado"
      >
        <MessageCircle size={17} />
        WhatsApp
      </span>
    );
  }

  return (
    <a
      href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      className={classes}
      title={`Abrir WhatsApp de ${patient.tutors?.nome || "tutor"}`}
    >
      <MessageCircle size={17} />
      WhatsApp
    </a>
  );
}

function ClinicPrintView({
  patients,
  returns,
  vaccines,
  tasks,
  hospitalizations,
  pendingExamsCount,
  pendingClinicalCount,
  patientStatuses,
}: {
  patients: ClinicPatientOverview[];
  returns: ReturnQueueItem[];
  vaccines: VaccineQueueItem[];
  tasks: ClinicalTask[];
  hospitalizations: ClinicalHospitalization[];
  pendingExamsCount: number;
  pendingClinicalCount: number;
  patientStatuses: Map<number, PatientClinicStatus>;
}) {
  const printedAt = new Date().toLocaleString("pt-BR");
  const pendingTasks = tasks.filter((task) => task.status === "Pendente");
  const attentionPatients = patients.filter(
    (patient) => (patientStatuses.get(patient.id)?.attentionScore || 0) > 0,
  );
  const overdueReturns = returns.filter(
    (item) => item.daysDiff < 0 && item.reminderStatus !== "Confirmado",
  );
  const overdueVaccines = vaccines.filter(
    (item) => item.daysDiff < 0 && item.reminderStatus !== "Confirmado",
  );

  return (
    <section className="document-print-area hidden bg-white p-8 text-slate-900 print:block">
      <div className="mb-6 border-b-2 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          PET MAIA ERP
        </p>
        <h1 className="mt-1 text-2xl font-bold">Resumo da clínica</h1>
        <p className="mt-1 text-sm text-slate-500">Impresso em {printedAt}</p>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3 text-sm">
        <ClinicPrintMetric
          label="Pacientes filtrados"
          value={patients.length}
        />
        <ClinicPrintMetric label="Pendências" value={pendingClinicalCount} />
        <ClinicPrintMetric label="Internados" value={hospitalizations.length} />
        <ClinicPrintMetric label="Exames pendentes" value={pendingExamsCount} />
      </div>

      <PrintSectionTitle title="Prioridades" />
      <table className="mb-6 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Tipo</th>
            <th className="border p-2">Paciente</th>
            <th className="border p-2">Tutor</th>
            <th className="border p-2">Data</th>
          </tr>
        </thead>
        <tbody>
          {[
            ...overdueReturns.map((item) => ({
              id: `return-${item.id}`,
              type: "Retorno atrasado",
              pet: item.petName,
              tutor: item.tutorName || "-",
              date: formatDate(item.returnDate),
            })),
            ...overdueVaccines.map((item) => ({
              id: `vaccine-${item.id}`,
              type: `Vacina: ${item.vaccineName}`,
              pet: item.petName,
              tutor: item.tutorName || "-",
              date: formatDate(item.nextDoseDate),
            })),
            ...pendingTasks.slice(0, 12).map((task) => ({
              id: `task-${task.id}`,
              type: task.task_type,
              pet: task.pets?.nome || "-",
              tutor: task.pets?.tutors?.nome || "-",
              date: formatDate(task.due_date),
            })),
          ].map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.type}</td>
              <td className="border p-2">{item.pet}</td>
              <td className="border p-2">{item.tutor}</td>
              <td className="border p-2">{item.date}</td>
            </tr>
          ))}
          {overdueReturns.length +
            overdueVaccines.length +
            pendingTasks.length ===
            0 && (
            <tr>
              <td className="border p-3 text-center" colSpan={4}>
                Nenhuma prioridade pendente.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <PrintSectionTitle title="Pacientes em atenção" />
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Paciente</th>
            <th className="border p-2">Tutor</th>
            <th className="border p-2">Última consulta</th>
            <th className="border p-2">Resumo</th>
          </tr>
        </thead>
        <tbody>
          {attentionPatients.map((patient) => {
            const status = patientStatuses.get(patient.id);

            return (
              <tr key={patient.id}>
                <td className="border p-2">{patient.nome}</td>
                <td className="border p-2">{patient.tutors?.nome || "-"}</td>
                <td className="border p-2">
                  {formatDate(patient.lastClinicalRecord?.consultation_date)}
                </td>
                <td className="border p-2">
                  {[
                    status?.hospitalized ? "internado" : "",
                    status?.criticalAlerts
                      ? `${status.criticalAlerts} alerta(s) crítico(s)`
                      : "",
                    status?.overdueReturns
                      ? `${status.overdueReturns} retorno(s) atrasado(s)`
                      : "",
                    status?.overdueVaccines
                      ? `${status.overdueVaccines} vacina(s) atrasada(s)`
                      : "",
                    status?.pendingTasks
                      ? `${status.pendingTasks} tarefa(s)`
                      : "",
                    status?.pendingExams
                      ? `${status.pendingExams} exame(s)`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </td>
              </tr>
            );
          })}
          {attentionPatients.length === 0 && (
            <tr>
              <td className="border p-3 text-center" colSpan={4}>
                Nenhum paciente em atenção no filtro atual.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

function ClinicPrintMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-600">{label}</p>
    </div>
  );
}

function PrintSectionTitle({ title }: { title: string }) {
  return <h2 className="mb-2 text-base font-bold text-slate-900">{title}</h2>;
}

function DailyVetDashboard({
  returns,
  vaccines,
  tasks,
  hospitalizations,
  onReturnConfirmation,
  onVaccinationConfirmation,
  onTaskToggle,
}: {
  returns: ReturnQueueItem[];
  vaccines: VaccineQueueItem[];
  tasks: ClinicalTask[];
  hospitalizations: ClinicalHospitalization[];
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
  const overdueMedications = hospitalizations
    .filter((item) => item.status === "Internado")
    .flatMap((item) =>
      (item.clinical_hospitalization_medications || [])
        .filter(
          (medication) =>
            medication.status === "Pendente" &&
            new Date(medication.scheduled_at) < new Date(),
        )
        .map((medication) => ({
          ...medication,
          petId: item.pet_id,
          petName: item.pets?.nome || "Paciente",
        })),
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

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
        {overdueMedications.length > 0 && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle size={19} />
              {overdueMedications.length} medicamento(s) atrasado(s)
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {overdueMedications.slice(0, 6).map((medication) => (
                <Link
                  key={medication.id}
                  href={`/pets/${medication.petId}`}
                  className="rounded-lg bg-white p-3 text-sm shadow-sm transition hover:ring-1 hover:ring-rose-300"
                >
                  <strong>{medication.petName}</strong> ·{" "}
                  {medication.medication} {medication.dose}
                  <p className="text-xs text-rose-700">
                    Previsto para{" "}
                    {new Date(medication.scheduled_at).toLocaleString("pt-BR")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
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
  warning = false,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${warning ? "border-red-200 bg-red-50/50" : ""}`}
    >
      <div
        className={`rounded-xl p-3 ${warning ? "bg-red-100 text-red-700" : "bg-purple-50 text-[#8A0EEA]"}`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className={`text-2xl font-bold ${warning ? "text-red-700" : ""}`}>
          {value}
        </p>
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

function normalizeSearchText(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
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
