"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppointmentReceiptModal } from "@/components/agenda/AppointmentReceiptModal";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { useAccess } from "@/components/auth/AccessContext";
import { PatientAlertsPanel } from "@/components/clinic/PatientAlertsPanel";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  AppointmentHistory,
  calculateDaysSinceDate,
  calculateDaysUntilDate,
  ClinicalDocuments,
  ClinicalHistory,
  createTutorWhatsAppLink,
  ExamHistory,
  extractReceiptObservations,
  FinancialHistory,
  getTodayDateString,
  normalizeText,
  ParasitePreventionHistory,
  PetAlerts,
  PetData,
  PetQuickStats,
  PetSummary,
  VaccinationHistory,
} from "@/components/pets/PetPageSections";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  createAppointment,
  fetchAppointmentsByPet,
  fetchAppointmentServicesByAppointmentId,
} from "@/services/appointments";
import {
  createClinicalConsent,
  createClinicalDocument,
  createClinicalPatientAlert,
  createPetParasitePrevention,
  createPetVaccination,
  deleteClinicalDocument,
  deleteClinicalExam,
  deleteClinicalPrescription,
  deletePetParasitePrevention,
  deletePetVaccination,
  fetchClinicalConsentsByPet,
  fetchClinicalDocumentsByPet,
  fetchClinicalExamsByPet,
  fetchClinicalPatientAlerts,
  fetchClinicalRecordsByPet,
  fetchPetParasitePreventions,
  fetchPetVaccinations,
  saveClinicalExam,
  saveClinicalPrescription,
  saveClinicalRecord,
  setClinicalPatientAlertActive,
  updateClinicalPatientAlert,
  updateClinicalPrescriptionDocument,
} from "@/services/clinical";
import {
  fetchFinancialEntriesByAppointmentId,
  fetchFinancialEntriesByPet,
} from "@/services/financial";
import { fetchPetById } from "@/services/pets";
import { fetchServices } from "@/services/services";
import { fetchClinicSettings } from "@/services/settings";
import type {
  Appointment,
  ClinicalConsent,
  ClinicalConsentInput,
  ClinicalDocument,
  ClinicalDocumentInput,
  ClinicalExam,
  ClinicalExamInput,
  ClinicalPatientAlert,
  ClinicalPatientAlertInput,
  ClinicalRecord,
  ClinicSettings,
  CompletedAppointmentService,
  FinancialEntry,
  NewAppointmentInput,
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetParasitePreventionInput,
  NewPetVaccinationInput,
  Pet,
  PetParasitePrevention,
  PetVaccination,
  Service,
  Tutor,
} from "@/types/domain";

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "historico", label: "Histórico" },
  { id: "clinica", label: "Clínica" },
  { id: "exames", label: "Exames" },
  { id: "documentos", label: "Documentos" },
  { id: "vacinas", label: "Vacinas" },
  { id: "preventivos", label: "Antiparasitários" },
  { id: "banhos", label: "Banhos" },
  { id: "financeiro", label: "Financeiro" },
];

export default function PetPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAccess();
  const [tab, setTab] = useState("dados");
  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [clinicalAlerts, setClinicalAlerts] = useState<ClinicalPatientAlert[]>(
    [],
  );
  const [clinicalError, setClinicalError] = useState("");
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [vaccinationError, setVaccinationError] = useState("");
  const [parasitePreventions, setParasitePreventions] = useState<
    PetParasitePrevention[]
  >([]);
  const [parasitePreventionError, setParasitePreventionError] = useState("");
  const [exams, setExams] = useState<ClinicalExam[]>([]);
  const [examError, setExamError] = useState("");
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [consents, setConsents] = useState<ClinicalConsent[]>([]);
  const [documentError, setDocumentError] = useState("");
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(
    [],
  );
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(
    null,
  );
  const [completedReceipt, setCompletedReceipt] = useState<{
    appointment: Appointment;
    valor: number;
    formaPagamento: string;
    services: CompletedAppointmentService[];
    observacoes?: string;
  } | null>(null);
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

      const [
        appointmentsResponse,
        financialResponse,
        clinicalResponse,
        clinicalAlertsResponse,
        vaccinationsResponse,
        parasitePreventionsResponse,
        examsResponse,
        documentsResponse,
        consentsResponse,
        clinicSettingsResponse,
      ] = await Promise.all([
        fetchAppointmentsByPet(petId),
        fetchFinancialEntriesByPet(petId),
        fetchClinicalRecordsByPet(petId),
        fetchClinicalPatientAlerts(petId),
        fetchPetVaccinations(petId),
        fetchPetParasitePreventions(petId),
        fetchClinicalExamsByPet(petId),
        fetchClinicalDocumentsByPet(petId),
        fetchClinicalConsentsByPet(petId),
        fetchClinicSettings(),
      ]);

      if (appointmentsResponse.error) {
        console.error(appointmentsResponse.error);
      }

      if (financialResponse.error) {
        console.error(financialResponse.error);
      }

      if (clinicalResponse.error) {
        console.error(clinicalResponse.error);
        setClinicalError(
          "Execute os scripts 006 e 008 do módulo clínico para habilitar o prontuário.",
        );
      } else {
        setClinicalRecords(clinicalResponse.data || []);
      }

      if (clinicalAlertsResponse.error) {
        console.error(clinicalAlertsResponse.error);
      } else {
        setClinicalAlerts(clinicalAlertsResponse.data || []);
      }

      if (vaccinationsResponse.error) {
        console.error(vaccinationsResponse.error);
        setVaccinationError(
          "Execute o script 009_clinical_vaccines.sql para habilitar as vacinas.",
        );
      } else {
        setVaccinations(vaccinationsResponse.data || []);
      }

      if (parasitePreventionsResponse.error) {
        console.error(parasitePreventionsResponse.error);
        setParasitePreventionError(
          "Não foi possível carregar os antiparasitários.",
        );
      } else {
        setParasitePreventions(parasitePreventionsResponse.data || []);
      }

      if (examsResponse.error) {
        console.error(examsResponse.error);
        setExamError(
          "Execute o script 011_clinical_exams.sql para habilitar os exames.",
        );
      } else {
        setExams(examsResponse.data || []);
      }

      if (documentsResponse.error) {
        console.error(documentsResponse.error);
        setDocumentError(
          "Execute o script 014_clinical_documents.sql para habilitar os documentos.",
        );
      } else {
        setDocuments(documentsResponse.data || []);
      }
      if (consentsResponse.error) {
        console.error(consentsResponse.error);
      } else {
        setConsents(consentsResponse.data || []);
      }
      if (clinicSettingsResponse.error) {
        console.error(clinicSettingsResponse.error);
      } else {
        setClinicSettings(clinicSettingsResponse.data as ClinicSettings);
      }

      setPet(data);
      setAppointments(appointmentsResponse.data || []);
      setFinancialEntries(financialResponse.data || []);
      setLoading(false);
    }

    async function loadAvailableServices() {
      const { data, error: servicesError } = await fetchServices();

      if (servicesError) {
        console.error(servicesError);
        toast.error("Não foi possível carregar os serviços.");
        return;
      }

      setServices(data || []);
    }

    loadPet();
    loadAvailableServices();
  });
  const groomingAppointments = appointments.filter((appointment) => {
    const service = normalizeText(appointment.servico);
    return ["banho", "tosa", "hidratacao", "unhas", "ouvido"].some((term) =>
      service.includes(term),
    );
  });
  const todayDate = getTodayDateString();

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "Finalizado",
  );

  const lastAppointment = [...completedAppointments].sort((a, b) =>
    `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`),
  )[0];

  const nextAppointment = appointments
    .filter(
      (appointment) =>
        appointment.status === "Agendado" && appointment.data >= todayDate,
    )
    .sort((a, b) =>
      `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`),
    )[0];

  const totalPaid = financialEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento === "Pago",
    )
    .reduce((sum, entry) => sum + Number(entry.valor || 0), 0);

  const pendingValue = financialEntries
    .filter(
      (entry) => entry.tipo === "Receita" && entry.status_pagamento !== "Pago",
    )
    .reduce((sum, entry) => sum + Number(entry.valor || 0), 0);

  const nextVaccine = vaccinations
    .filter((vaccination) => vaccination.next_dose_date)
    .sort((a, b) =>
      String(a.next_dose_date).localeCompare(String(b.next_dose_date)),
    )[0];
  const lastBathAppointment = groomingAppointments
    .filter((appointment) => appointment.status === "Finalizado")
    .sort((a, b) =>
      `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`),
    )[0];

  const daysSinceLastBath = calculateDaysSinceDate(lastBathAppointment?.data);

  const daysUntilNextVaccine = calculateDaysUntilDate(
    nextVaccine?.next_dose_date,
  );
  const appointmentTutors: Tutor[] = pet?.tutor_id
    ? [
        {
          id: pet.tutor_id,
          nome: pet.tutors?.nome || "Tutor não informado",
          telefone: pet.tutors?.telefone,
          email: pet.tutors?.email,
          endereco: pet.tutors?.endereco,
        },
      ]
    : [];

  const appointmentPets = pet ? [pet] : [];
  const tutorWhatsAppLink = pet
    ? createTutorWhatsAppLink(pet.tutors?.telefone, pet.nome)
    : "";
  async function handleViewReceipt(appointment: Appointment) {
    if (!pet) {
      return;
    }

    const [appointmentServicesResponse, financialResponse] = await Promise.all([
      fetchAppointmentServicesByAppointmentId(appointment.id),
      fetchFinancialEntriesByAppointmentId(appointment.id),
    ]);

    if (appointmentServicesResponse.error) {
      console.error(appointmentServicesResponse.error);
      toast.error("Não foi possível carregar os serviços do recibo.");
      return;
    }

    if (financialResponse.error) {
      console.error(financialResponse.error);
      toast.error("Não foi possível carregar o financeiro do recibo.");
      return;
    }

    const linkedFinancialEntry = (financialResponse.data?.[0] ||
      null) as FinancialEntry | null;

    const fallbackFinancialEntry =
      financialEntries.find(
        (entry) =>
          entry.origem === "appointment" &&
          Number(entry.referencia_id) === Number(appointment.id),
      ) || null;

    const financialEntry = linkedFinancialEntry || fallbackFinancialEntry;

    if (!financialEntry) {
      toast.error(
        "Este atendimento está finalizado, mas não possui recibo financeiro salvo.",
      );
      return;
    }

    const receiptServices: CompletedAppointmentService[] =
      appointmentServicesResponse.data?.map((service) => ({
        serviceName: service.service_name,
        price: Number(service.price || 0),
      })) || [];

    setCompletedReceipt({
      appointment: {
        ...appointment,
        pets: {
          nome: pet.nome,
          porte: pet.porte,
          tutors: pet.tutors,
        },
      },
      valor: Number(financialEntry.valor || 0),
      formaPagamento: financialEntry.forma_pagamento || "PIX",
      services: receiptServices,
      observacoes: extractReceiptObservations(
        financialEntry.descricao,
        pet.nome,
      ),
    });
  }
  async function handleCreateAppointmentFromPet(
    novoAgendamento: NewAppointmentInput,
  ): Promise<boolean> {
    if (!pet) {
      toast.error("Pet não encontrado");
      return false;
    }

    const { error } = await createAppointment(novoAgendamento, pet.id);

    if (error) {
      console.error(error);
      toast.error("Erro ao criar agendamento");
      return false;
    }

    const { data, error: reloadError } = await fetchAppointmentsByPet(pet.id);

    if (reloadError) {
      console.error(reloadError);
      toast.warning("Agendamento criado, mas o histórico não foi atualizado.");
    } else {
      setAppointments(data || []);
    }

    toast.success("Agendamento criado com sucesso!");
    return true;
  }
  async function handleCreateClinicalAlert(input: ClinicalPatientAlertInput) {
    const { data, error: createError } =
      await createClinicalPatientAlert(input);
    if (createError || !data) {
      toast.error(createError?.message || "Não foi possível salvar o alerta.");
      return false;
    }
    setClinicalAlerts((current) => [data, ...current]);
    toast.success("Alerta clínico criado!");
    return true;
  }

  async function handleUpdateClinicalAlert(
    id: number,
    input: ClinicalPatientAlertInput,
  ) {
    const { data, error: updateError } = await updateClinicalPatientAlert(
      id,
      input,
    );
    if (updateError || !data) {
      toast.error(
        updateError?.message || "Não foi possível atualizar o alerta.",
      );
      return false;
    }
    setClinicalAlerts((current) =>
      current.map((alert) => (alert.id === id ? data : alert)),
    );
    toast.success("Alerta clínico atualizado!");
    return true;
  }

  async function handleClinicalAlertActiveChange(id: number, active: boolean) {
    const { data, error: updateError } = await setClinicalPatientAlertActive(
      id,
      active,
    );
    if (updateError || !data) {
      toast.error("Não foi possível alterar o alerta.");
      return false;
    }
    setClinicalAlerts((current) =>
      current.map((alert) => (alert.id === id ? data : alert)),
    );
    toast.success(
      active ? "Alerta reativado!" : "Alerta marcado como inativo.",
    );
    return true;
  }

  async function handleCreateClinicalRecord(record: NewClinicalRecordInput) {
    const { error: createError } = await saveClinicalRecord(record);

    if (createError) {
      toast.error(createError.message);
      throw createError;
    }

    const { data, error: reloadError } = await fetchClinicalRecordsByPet(
      record.petId,
    );

    if (reloadError) {
      toast.error("Consulta salva, mas o histórico não pôde ser atualizado");
      return;
    }

    setClinicalRecords(data || []);
    setClinicalError("");
    toast.success(
      record.id ? "Consulta atualizada!" : "Consulta adicionada ao prontuário!",
    );
  }

  async function handleCreatePrescription(
    prescription: NewClinicalPrescriptionInput,
  ) {
    const { error: createError } = await saveClinicalPrescription(prescription);

    if (createError) {
      toast.error(createError.message);
      throw createError;
    }

    if (!pet) {
      return;
    }

    const { data, error: reloadError } = await fetchClinicalRecordsByPet(
      pet.id,
    );

    if (reloadError) {
      toast.error("Prescrição salva, mas o prontuário não foi atualizado");
      return;
    }

    setClinicalRecords(data || []);
    toast.success(
      prescription.id ? "Prescrição atualizada!" : "Prescrição adicionada!",
    );
  }

  async function handleDeletePrescription(id: number) {
    const { error: deleteError } = await deleteClinicalPrescription(id);

    if (deleteError) {
      toast.error(deleteError.message);
      throw deleteError;
    }

    if (!pet) return;

    const { data, error: reloadError } = await fetchClinicalRecordsByPet(
      pet.id,
    );

    if (reloadError) {
      toast.error("Item excluído, mas o prontuário não pôde ser atualizado");
      return;
    }

    setClinicalRecords(data || []);
    toast.success("Item removido da receita");
  }

  async function refreshClinicalRecords() {
    if (!pet) return;

    const { data, error: reloadError } = await fetchClinicalRecordsByPet(
      pet.id,
    );

    if (reloadError) {
      toast.error("O prontuário não pôde ser atualizado");
      return;
    }

    setClinicalRecords(data || []);
  }

  async function handleUpdatePrescriptionDocument(
    id: number,
    generalInstructions: string,
    status?: "rascunho" | "emitida" | "cancelada",
  ) {
    const { error: updateError } = await updateClinicalPrescriptionDocument({
      id,
      generalInstructions,
      status,
    });

    if (updateError) {
      toast.error(updateError.message);
      throw updateError;
    }

    if (!pet) return;

    const { data, error: reloadError } = await fetchClinicalRecordsByPet(
      pet.id,
    );

    if (reloadError) {
      toast.error(
        "Receita atualizada, mas o prontuário não pôde ser recarregado",
      );
      return;
    }

    setClinicalRecords(data || []);
    toast.success(
      status === "emitida" ? "Receita emitida" : "Receita atualizada",
    );
  }

  async function handleCreateVaccination(vaccination: NewPetVaccinationInput) {
    const { error: createError } = await createPetVaccination(vaccination);

    if (createError) {
      toast.error(createError.message);
      throw createError;
    }

    const { data, error: reloadError } = await fetchPetVaccinations(
      vaccination.petId,
    );

    if (reloadError) {
      toast.error("Vacina salva, mas o histórico não foi atualizado");
      return;
    }

    setVaccinations(data || []);
    setVaccinationError("");
    toast.success("Vacina registrada!");
  }

  async function handleCreateParasitePrevention(
    input: NewPetParasitePreventionInput,
  ) {
    const { error: createError } = await createPetParasitePrevention(input);
    if (createError) {
      toast.error(createError.message);
      throw createError;
    }
    const { data, error: reloadError } = await fetchPetParasitePreventions(
      input.petId,
    );
    if (reloadError) {
      toast.error("Preventivo salvo, mas o histórico não foi atualizado.");
      return;
    }
    setParasitePreventions(data || []);
    setParasitePreventionError("");
    toast.success("Preventivo registrado!");
  }

  async function handleSaveExam(input: ClinicalExamInput) {
    const { error: saveError } = await saveClinicalExam(input);

    if (saveError) {
      toast.error(saveError.message);
      throw saveError;
    }

    const { data, error: reloadError } = await fetchClinicalExamsByPet(
      input.petId,
    );

    if (reloadError) {
      toast.error("Exame salvo, mas o histórico não foi atualizado");
      return;
    }

    setExams(data || []);
    setExamError("");
    toast.success(input.id ? "Exame atualizado!" : "Exame solicitado!");
  }

  async function handleCreateDocument(input: ClinicalDocumentInput) {
    const { error: createError } = await createClinicalDocument(input);

    if (createError) {
      toast.error(createError.message);
      throw createError;
    }

    const { data, error: reloadError } = await fetchClinicalDocumentsByPet(
      input.petId,
    );

    if (reloadError) {
      toast.error("Documento salvo, mas a lista não foi atualizada");
      return;
    }

    setDocuments(data || []);
    setDocumentError("");
    toast.success("Documento clínico salvo!");
  }

  async function handleCreateConsent(input: ClinicalConsentInput) {
    const { error: createError } = await createClinicalConsent(input);
    if (createError) {
      toast.error(createError.message);
      throw createError;
    }
    const { data, error: reloadError } = await fetchClinicalConsentsByPet(
      input.petId,
    );
    if (reloadError) {
      toast.error("Consentimento salvo, mas a lista não foi atualizada");
      return;
    }
    setConsents(data || []);
    toast.success("Consentimento assinado e guardado!");
  }

  async function handleDeleteVaccination(id: number) {
    const { error: deleteError } = await deletePetVaccination(id);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    setVaccinations((current) => current.filter((item) => item.id !== id));
    toast.success("Vacina excluída.");
  }

  async function handleDeleteParasitePrevention(id: number) {
    const { error: deleteError } = await deletePetParasitePrevention(id);
    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }
    setParasitePreventions((current) =>
      current.filter((item) => item.id !== id),
    );
    toast.success("Preventivo excluído.");
  }

  async function handleDeleteExam(id: number) {
    const { error: deleteError } = await deleteClinicalExam(id);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    setExams((current) => current.filter((item) => item.id !== id));
    toast.success("Exame excluído.");
  }

  async function handleDeleteDocument(id: number) {
    const { error: deleteError } = await deleteClinicalDocument(id);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    setDocuments((current) => current.filter((item) => item.id !== id));
    toast.success("Documento excluído.");
  }

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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                    Ficha do Pet
                  </h1>
                  <p className="text-slate-500">Informações do paciente</p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {tutorWhatsAppLink ? (
                    <a
                      href={tutorWhatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 font-medium text-green-700 hover:bg-green-100 sm:w-auto"
                    >
                      Chamar tutor
                    </a>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-xl border bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400 sm:w-auto">
                      Tutor sem telefone
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setAppointmentModalOpen(true)}
                    className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white hover:bg-[#7600d1] sm:w-auto"
                  >
                    Novo agendamento
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <PetSummary pet={pet} />

                <div className="min-w-0 lg:col-span-2">
                  <PetQuickStats
                    lastAppointment={lastAppointment}
                    nextAppointment={nextAppointment}
                    totalPaid={totalPaid}
                    pendingValue={pendingValue}
                    nextVaccine={nextVaccine}
                  />
                  <PatientAlertsPanel
                    petId={pet.id}
                    alerts={clinicalAlerts}
                    onCreate={handleCreateClinicalAlert}
                    onUpdate={handleUpdateClinicalAlert}
                    onActiveChange={handleClinicalAlertActiveChange}
                  />
                  <PetAlerts
                    lastBathAppointment={lastBathAppointment}
                    daysSinceLastBath={daysSinceLastBath}
                    pendingValue={pendingValue}
                    nextAppointment={nextAppointment}
                    nextVaccine={nextVaccine}
                    daysUntilNextVaccine={daysUntilNextVaccine}
                    onSchedule={() => setAppointmentModalOpen(true)}
                    onShowFinancial={() => setTab("financeiro")}
                    onShowVaccines={() => setTab("vacinas")}
                    onShowHistory={() => setTab("historico")}
                  />

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
                      financialEntries={financialEntries}
                      onViewReceipt={handleViewReceipt}
                    />
                  )}
                  {tab === "clinica" && (
                    <ClinicalHistory
                      pet={pet}
                      records={clinicalRecords}
                      error={clinicalError}
                      professionalName={profile?.nome || ""}
                      clinicSettings={clinicSettings}
                      vaccinations={vaccinations}
                      exams={exams}
                      documents={documents}
                      onSave={handleCreateClinicalRecord}
                      onPrescriptionSave={handleCreatePrescription}
                      onPrescriptionDelete={handleDeletePrescription}
                      onPrescriptionDocumentUpdate={
                        handleUpdatePrescriptionDocument
                      }
                      onPrescriptionDocumentChanged={refreshClinicalRecords}
                    />
                  )}
                  {tab === "vacinas" && (
                    <VaccinationHistory
                      pet={pet}
                      vaccinations={vaccinations}
                      error={vaccinationError}
                      professionalName={profile?.nome || ""}
                      onSave={handleCreateVaccination}
                      onDelete={handleDeleteVaccination}
                    />
                  )}
                  {tab === "preventivos" && (
                    <ParasitePreventionHistory
                      pet={pet}
                      preventions={parasitePreventions}
                      error={parasitePreventionError}
                      professionalName={profile?.nome || ""}
                      onSave={handleCreateParasitePrevention}
                      onDelete={handleDeleteParasitePrevention}
                    />
                  )}
                  {tab === "exames" && (
                    <ExamHistory
                      pet={pet}
                      exams={exams}
                      error={examError}
                      professionalName={profile?.nome || ""}
                      onSave={handleSaveExam}
                      onDelete={handleDeleteExam}
                    />
                  )}
                  {tab === "documentos" && (
                    <ClinicalDocuments
                      pet={pet}
                      documents={documents}
                      consents={consents}
                      error={documentError}
                      professionalName={profile?.nome || ""}
                      professionalCrmv={profile?.crmv || ""}
                      onSave={handleCreateDocument}
                      onConsentSave={handleCreateConsent}
                      onDelete={handleDeleteDocument}
                    />
                  )}
                  {tab === "banhos" && (
                    <AppointmentHistory
                      title="Banhos e Tosas"
                      appointments={groomingAppointments}
                      financialEntries={financialEntries}
                      onViewReceipt={handleViewReceipt}
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
        {completedReceipt && (
          <AppointmentReceiptModal
            appointment={completedReceipt.appointment}
            clinicSettings={clinicSettings}
            valor={completedReceipt.valor}
            formaPagamento={completedReceipt.formaPagamento}
            services={completedReceipt.services}
            observacoes={completedReceipt.observacoes}
            onClose={() => setCompletedReceipt(null)}
          />
        )}
        {pet && (
          <NewAppointmentModal
            tutors={appointmentTutors}
            pets={appointmentPets}
            services={services}
            onSave={handleCreateAppointmentFromPet}
            open={appointmentModalOpen}
            onOpenChange={setAppointmentModalOpen}
            defaultTutorId={pet.tutor_id ? String(pet.tutor_id) : ""}
            defaultPetId={String(pet.id)}
            hideTrigger
          />
        )}
      </main>
    </div>
  );
}


