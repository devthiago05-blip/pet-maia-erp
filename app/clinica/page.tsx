"use client";

import {
  AlertTriangle,
  CalendarClock,
  Printer,
  Search,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { ClinicalCatalogManager } from "@/components/clinic/ClinicalCatalogManager";
import { ClinicalDocumentTemplateManager } from "@/components/clinic/ClinicalDocumentTemplateManager";
import { ClinicalTasksPanel } from "@/components/clinic/ClinicalTasksPanel";
import {
  addDays,
  ClinicDocumentWorkspace,
  ClinicPrintView,
  ClinicSummary,
  DailyVetDashboard,
  differenceInDays,
  getDateOnly,
  normalizeSearchText,
  parseDateOnly,
  PatientCard,
  type PatientFilter,
  PatientFilterBar,
  VaccineAlertsQueue,
  WeeklyReturnsQueue,
} from "@/components/clinic/ClinicPageSections";
import { HospitalizationPanel } from "@/components/clinic/HospitalizationPanel";
import { LaboratoryExamPanel } from "@/components/clinic/LaboratoryExamPanel";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
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


