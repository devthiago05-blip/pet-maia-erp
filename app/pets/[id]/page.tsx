"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppointmentReceiptModal } from "@/components/agenda/AppointmentReceiptModal";
import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { useAccess } from "@/components/auth/AccessContext";
import { ClinicalDocumentModal } from "@/components/clinic/ClinicalDocumentModal";
import { ExamAttachments } from "@/components/clinic/ExamAttachments";
import { ExamModal } from "@/components/clinic/ExamModal";
import { NewClinicalRecordModal } from "@/components/clinic/NewClinicalRecordModal";
import { PrescriptionGroups } from "@/components/clinic/PrescriptionGroups";
import { VaccinationModal } from "@/components/clinic/VaccinationModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  createAppointment,
  fetchAppointmentsByPet,
  fetchAppointmentServicesByAppointmentId,
} from "@/services/appointments";
import {
  createClinicalDocument,
  createPetVaccination,
  deleteClinicalDocument,
  deleteClinicalExam,
  deleteClinicalPrescription,
  deletePetVaccination,
  fetchClinicalDocumentsByPet,
  fetchClinicalExamsByPet,
  fetchClinicalRecordsByPet,
  fetchPetVaccinations,
  saveClinicalExam,
  saveClinicalPrescription,
  saveClinicalRecord,
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
  ClinicalDocument,
  ClinicalDocumentInput,
  ClinicalExam,
  ClinicalExamInput,
  ClinicalRecord,
  ClinicSettings,
  CompletedAppointmentService,
  FinancialEntry,
  NewAppointmentInput,
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetVaccinationInput,
  Pet,
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
  { id: "banhos", label: "Banhos" },
  { id: "financeiro", label: "Financeiro" },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function parseDateOnly(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function calculateDaysSinceDate(value?: string | null) {
  const date = parseDateOnly(value);

  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  const differenceInMs = today.getTime() - date.getTime();

  return Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
}

function calculateDaysUntilDate(value?: string | null) {
  const date = parseDateOnly(value);

  if (!date) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  date.setHours(0, 0, 0, 0);

  const differenceInMs = date.getTime() - today.getTime();

  return Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));
}
function createTutorWhatsAppLink(phone?: string | null, petName?: string) {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalizedPhone = digits.startsWith("55") ? digits : `55${digits}`;

  const message = `Olá, tudo bem? Aqui é da Pet Maia Banho & Tosa. Gostaria de falar sobre o atendimento do ${petName || "pet"}.`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
function extractReceiptObservations(description?: string, petName?: string) {
  if (!description?.includes("| Obs:")) {
    return undefined;
  }

  const observationPart = description.split("| Obs:")[1]?.trim();

  if (!observationPart) {
    return undefined;
  }

  if (!petName) {
    return observationPart;
  }

  return observationPart.replace(new RegExp(` - ${petName}$`, "i"), "").trim();
}

export default function PetPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAccess();
  const [tab, setTab] = useState("dados");
  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [clinicalRecords, setClinicalRecords] = useState<ClinicalRecord[]>([]);
  const [clinicalError, setClinicalError] = useState("");
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [vaccinationError, setVaccinationError] = useState("");
  const [exams, setExams] = useState<ClinicalExam[]>([]);
  const [examError, setExamError] = useState("");
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
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
        vaccinationsResponse,
        examsResponse,
        documentsResponse,
        clinicSettingsResponse,
      ] = await Promise.all([
        fetchAppointmentsByPet(petId),
        fetchFinancialEntriesByPet(petId),
        fetchClinicalRecordsByPet(petId),
        fetchPetVaccinations(petId),
        fetchClinicalExamsByPet(petId),
        fetchClinicalDocumentsByPet(petId),
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

      if (vaccinationsResponse.error) {
        console.error(vaccinationsResponse.error);
        setVaccinationError(
          "Execute o script 009_clinical_vaccines.sql para habilitar as vacinas.",
        );
      } else {
        setVaccinations(vaccinationsResponse.data || []);
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

  async function handleDeleteVaccination(id: number) {
    const { error: deleteError } = await deletePetVaccination(id);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    setVaccinations((current) => current.filter((item) => item.id !== id));
    toast.success("Vacina excluída.");
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
                      error={documentError}
                      professionalName={profile?.nome || ""}
                      professionalCrmv={profile?.crmv || ""}
                      onSave={handleCreateDocument}
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

function ClinicalHistory({
  pet,
  records,
  error,
  professionalName,
  clinicSettings,
  onSave,
  onPrescriptionSave,
  onPrescriptionDelete,
  onPrescriptionDocumentUpdate,
  onPrescriptionDocumentChanged,
}: {
  pet: Pet;
  records: ClinicalRecord[];
  error: string;
  professionalName: string;
  clinicSettings: ClinicSettings | null;
  onSave: (record: NewClinicalRecordInput) => Promise<void>;
  onPrescriptionSave: (
    prescription: NewClinicalPrescriptionInput,
  ) => Promise<void>;
  onPrescriptionDelete: (id: number) => Promise<void>;
  onPrescriptionDocumentUpdate: (
    id: number,
    generalInstructions: string,
    status?: "rascunho" | "emitida" | "cancelada",
  ) => Promise<void>;
  onPrescriptionDocumentChanged: () => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-lg font-bold">Prontuário clínico</h3>
          <p className="text-sm text-slate-500">
            Consultas e evolução de {pet.nome}
          </p>
        </div>
        {!error && (
          <NewClinicalRecordModal
            petId={pet.id}
            defaultProfessionalName={professionalName}
            onSave={onSave}
          />
        )}
      </div>

      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : records.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhuma consulta clínica registrada.
        </p>
      ) : (
        <div>
          <WeightEvolution records={records} />
          <div className="divide-y">
            {records.map((record) => (
              <article key={record.id} className="space-y-4 p-4 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold">
                      Consulta de {formatDate(record.consultation_date)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {record.professional_name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <NewClinicalRecordModal
                      petId={pet.id}
                      record={record}
                      defaultProfessionalName={professionalName}
                      onSave={onSave}
                    />
                    {record.weight_kg && (
                      <span className="rounded-lg bg-slate-100 px-3 py-1">
                        {record.weight_kg} kg
                      </span>
                    )}
                    {record.temperature_c && (
                      <span className="rounded-lg bg-slate-100 px-3 py-1">
                        {record.temperature_c} °C
                      </span>
                    )}
                    {record.return_date && (
                      <span className="rounded-lg bg-purple-50 px-3 py-1 text-[#8A0EEA]">
                        Retorno: {formatDate(record.return_date)}
                      </span>
                    )}
                  </div>
                </div>
                <ClinicalText
                  label="Queixa principal"
                  value={record.main_complaint}
                />
                <ClinicalText label="Anamnese" value={record.anamnesis} />
                <ClinicalText label="Alergias" value={record.allergies} />
                <ClinicalText
                  label="Medicamentos em uso"
                  value={record.current_medications}
                />
                <ClinicalText label="Diagnóstico" value={record.diagnosis} />
                <ClinicalText
                  label="Conduta e orientações"
                  value={record.conduct}
                />
                <PrescriptionGroups
                  pet={pet}
                  record={record}
                  clinicSettings={clinicSettings}
                  onSaveItem={onPrescriptionSave}
                  onDeleteItem={onPrescriptionDelete}
                  onUpdateDocument={onPrescriptionDocumentUpdate}
                  onDocumentChanged={onPrescriptionDocumentChanged}
                />
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function WeightEvolution({ records }: { records: ClinicalRecord[] }) {
  const entries = records
    .filter((record) => Number(record.weight_kg) > 0)
    .slice()
    .sort((a, b) => a.consultation_date.localeCompare(b.consultation_date))
    .slice(-8);

  if (entries.length < 2) {
    return null;
  }

  const maxWeight = Math.max(
    ...entries.map((record) => Number(record.weight_kg)),
  );

  return (
    <div className="border-b bg-slate-50 p-4 sm:p-6">
      <h4 className="text-sm font-semibold">Evolução de peso</h4>
      <div className="mt-4 flex h-40 items-end gap-2 sm:gap-4">
        {entries.map((record) => {
          const weight = Number(record.weight_kg);
          const height = Math.max((weight / maxWeight) * 100, 8);

          return (
            <div
              key={record.id}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-xs font-semibold">{weight} kg</span>
              <div
                className="w-full max-w-12 rounded-t bg-[#8A0EEA]"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-slate-500 sm:text-xs">
                {formatDate(record.consultation_date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClinicalText({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

function VaccinationHistory({
  pet,
  vaccinations,
  error,
  professionalName,
  onSave,
  onDelete,
}: {
  pet: Pet;
  vaccinations: PetVaccination[];
  error: string;
  professionalName: string;
  onSave: (vaccination: NewPetVaccinationInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-lg font-bold">Carteira de vacinação</h3>
          <p className="text-sm text-slate-500">
            Aplicações e próximas doses de {pet.nome}
          </p>
        </div>
        {!error && (
          <VaccinationModal
            petId={pet.id}
            defaultProfessionalName={professionalName}
            onSave={onSave}
          />
        )}
      </div>

      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : vaccinations.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhuma vacina registrada.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Vacina</th>
                <th className="p-4 text-left">Aplicação</th>
                <th className="p-4 text-left">Próxima dose</th>
                <th className="p-4 text-left">Fabricante / lote</th>
                <th className="p-4 text-left">Profissional</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((vaccination) => (
                <tr key={vaccination.id} className="border-t">
                  <td className="p-4">
                    <p className="font-medium">{vaccination.vaccine_name}</p>
                    {vaccination.notes && (
                      <p className="mt-1 max-w-xs text-xs text-slate-500">
                        {vaccination.notes}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    {formatDate(vaccination.application_date)}
                  </td>
                  <td className="p-4">
                    {formatDate(vaccination.next_dose_date)}
                  </td>
                  <td className="p-4">
                    {[vaccination.manufacturer, vaccination.batch_number]
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </td>
                  <td className="p-4">{vaccination.professional_name}</td>
                  <td className="p-4">
                    <ClinicalDeleteButton
                      itemName={vaccination.vaccine_name}
                      onDelete={() => onDelete(vaccination.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ExamHistory({
  pet,
  exams,
  error,
  professionalName,
  onSave,
  onDelete,
}: {
  pet: Pet;
  exams: ClinicalExam[];
  error: string;
  professionalName: string;
  onSave: (input: ClinicalExamInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-lg font-bold">Exames clínicos</h3>
          <p className="text-sm text-slate-500">
            Solicitações e resultados de {pet.nome}
          </p>
        </div>
        {!error && (
          <ExamModal
            petId={pet.id}
            defaultProfessionalName={professionalName}
            onSave={onSave}
          />
        )}
      </div>

      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : exams.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhum exame registrado.
        </p>
      ) : (
        <div className="divide-y">
          {exams.map((exam) => (
            <article key={exam.id} className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-bold">{exam.exam_name}</h4>
                  <p className="text-sm text-slate-500">
                    Solicitado em {formatDate(exam.request_date)} por{" "}
                    {exam.professional_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium">
                    {exam.status}
                  </span>
                  <ExamModal
                    petId={pet.id}
                    exam={exam}
                    defaultProfessionalName={professionalName}
                    onSave={onSave}
                  />
                  <ClinicalDeleteButton
                    itemName={exam.exam_name}
                    onDelete={() => onDelete(exam.id)}
                  />
                </div>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p>
                  <strong>Coleta:</strong> {formatDate(exam.collection_date)}
                </p>
                <p>
                  <strong>Resultado:</strong> {formatDate(exam.result_date)}
                </p>
                <p>
                  <strong>Laboratório:</strong> {exam.laboratory || "-"}
                </p>
              </div>
              <ClinicalText label="Resultado" value={exam.result} />
              <ClinicalText label="Observações" value={exam.notes} />
              <ExamAttachments petId={pet.id} examId={exam.id} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ClinicalDocuments({
  pet,
  documents,
  error,
  professionalName,
  professionalCrmv,
  onSave,
  onDelete,
}: {
  pet: Pet;
  documents: ClinicalDocument[];
  error: string;
  professionalName: string;
  professionalCrmv: string;
  onSave: (input: ClinicalDocumentInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-lg font-bold">Documentos clínicos</h3>
          <p className="text-sm text-slate-500">
            Atestados, declarações e orientações de {pet.nome}
          </p>
        </div>
        {!error && (
          <ClinicalDocumentModal
            pet={pet}
            defaultProfessionalName={professionalName}
            defaultProfessionalCrmv={professionalCrmv}
            onSave={onSave}
          />
        )}
      </div>

      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : documents.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhum documento emitido.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Tipo</th>
                <th className="p-4 text-left">Título</th>
                <th className="p-4 text-left">Profissional</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} className="border-t">
                  <td className="p-4">{formatDate(document.issue_date)}</td>
                  <td className="p-4">{document.document_type}</td>
                  <td className="p-4">{document.title}</td>
                  <td className="p-4">{document.professional_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <ClinicalDocumentModal
                        pet={pet}
                        document={document}
                        defaultProfessionalName={professionalName}
                      />
                      <ClinicalDeleteButton
                        itemName={document.title}
                        onDelete={() => onDelete(document.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ClinicalDeleteButton({
  itemName,
  onDelete,
}: {
  itemName: string;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:text-red-700"
      >
        Excluir
      </button>
      <ConfirmationDialog
        isOpen={open}
        title="Excluir registro clínico"
        description={`Deseja excluir ${itemName}? Essa ação não poderá ser desfeita.`}
        confirmText="Excluir"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          void onDelete();
          setOpen(false);
        }}
      />
    </>
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
  financialEntries = [],
  onViewReceipt,
}: {
  title: string;
  appointments: Appointment[];
  financialEntries?: FinancialEntry[];
  onViewReceipt?: (appointment: Appointment) => void;
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
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                  <td className="p-4">
                    {appointment.status === "Finalizado" &&
                    financialEntries.some(
                      (entry) =>
                        entry.origem === "appointment" &&
                        Number(entry.referencia_id) === Number(appointment.id),
                    ) &&
                    onViewReceipt ? (
                      <button
                        type="button"
                        onClick={() => onViewReceipt(appointment)}
                        className="font-medium text-[#8A0EEA] hover:underline"
                      >
                        Ver recibo
                      </button>
                    ) : appointment.status === "Finalizado" ? (
                      <span className="text-sm text-slate-400">Sem recibo</span>
                    ) : (
                      "-"
                    )}
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
function PetQuickStats({
  lastAppointment,
  nextAppointment,
  totalPaid,
  pendingValue,
  nextVaccine,
}: {
  lastAppointment?: Appointment;
  nextAppointment?: Appointment;
  totalPaid: number;
  pendingValue: number;
  nextVaccine?: PetVaccination;
}) {
  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <PetStatCard
        label="Último atendimento"
        value={
          lastAppointment
            ? `${formatDate(lastAppointment.data)} às ${lastAppointment.hora}`
            : "Sem registro"
        }
        detail={lastAppointment?.servico || "Nenhum atendimento finalizado"}
      />

      <PetStatCard
        label="Próximo agendamento"
        value={
          nextAppointment
            ? `${formatDate(nextAppointment.data)} às ${nextAppointment.hora}`
            : "Nenhum"
        }
        detail={nextAppointment?.servico || "Sem agendamento futuro"}
      />

      <PetStatCard
        label="Total recebido"
        value={formatCurrency(totalPaid)}
        detail="Receitas pagas"
      />

      <PetStatCard
        label="Valor pendente"
        value={formatCurrency(pendingValue)}
        detail="Receitas em aberto"
      />

      <PetStatCard
        label="Próxima vacina"
        value={
          nextVaccine?.next_dose_date
            ? formatDate(nextVaccine.next_dose_date)
            : "Nenhuma"
        }
        detail={nextVaccine?.vaccine_name || "Sem próxima dose"}
      />
    </section>
  );
}

function PetStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-[#8A0EEA]">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
function PetAlerts({
  lastBathAppointment,
  daysSinceLastBath,
  pendingValue,
  nextAppointment,
  nextVaccine,
  daysUntilNextVaccine,
  onSchedule,
  onShowFinancial,
  onShowVaccines,
  onShowHistory,
}: {
  lastBathAppointment?: Appointment;
  daysSinceLastBath: number | null;
  pendingValue: number;
  nextAppointment?: Appointment;
  nextVaccine?: PetVaccination;
  daysUntilNextVaccine: number | null;
  onSchedule: () => void;
  onShowFinancial: () => void;
  onShowVaccines: () => void;
  onShowHistory: () => void;
}) {
  const bathIsOverdue =
    !lastBathAppointment ||
    daysSinceLastBath === null ||
    daysSinceLastBath > 30;

  const hasPendingValue = pendingValue > 0;
  const hasNextAppointment = Boolean(nextAppointment);

  const vaccineNeedsAttention =
    Boolean(nextVaccine?.next_dose_date) &&
    daysUntilNextVaccine !== null &&
    daysUntilNextVaccine <= 30;

  const hasAnyAlert =
    bathIsOverdue ||
    hasPendingValue ||
    hasNextAppointment ||
    vaccineNeedsAttention;

  if (!hasAnyAlert) {
    return (
      <section className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4">
        <p className="font-semibold text-green-700">Tudo certo no momento</p>
        <p className="mt-1 text-sm text-green-700">
          Nenhum alerta importante encontrado para este pet.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6 space-y-3 rounded-xl border bg-white p-4 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-800">Alertas inteligentes</h3>
        <p className="text-sm text-slate-500">
          Pontos importantes para acompanhar este pet.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {bathIsOverdue && (
          <PetAlertCard
            title="Banho atrasado"
            description={
              lastBathAppointment && daysSinceLastBath !== null
                ? `Último banho há ${daysSinceLastBath} dias.`
                : "Nenhum banho finalizado registrado."
            }
            actionLabel="Agendar banho"
            onAction={onSchedule}
          />
        )}

        {hasPendingValue && (
          <PetAlertCard
            title="Valor pendente"
            description={`Existe ${formatCurrency(
              pendingValue,
            )} em aberto para este pet.`}
            actionLabel="Ver financeiro"
            onAction={onShowFinancial}
          />
        )}

        {hasNextAppointment && nextAppointment && (
          <PetAlertCard
            title="Agendamento futuro"
            description={`${nextAppointment.servico} em ${formatDate(
              nextAppointment.data,
            )} às ${nextAppointment.hora}.`}
            actionLabel="Ver histórico"
            onAction={onShowHistory}
          />
        )}

        {vaccineNeedsAttention && nextVaccine && (
          <PetAlertCard
            title={
              daysUntilNextVaccine !== null && daysUntilNextVaccine < 0
                ? "Vacina vencida"
                : "Vacina próxima"
            }
            description={
              daysUntilNextVaccine !== null && daysUntilNextVaccine < 0
                ? `${nextVaccine.vaccine_name} venceu há ${Math.abs(
                    daysUntilNextVaccine,
                  )} dias.`
                : `${nextVaccine.vaccine_name} vence em ${
                    daysUntilNextVaccine === 0
                      ? "hoje"
                      : `${daysUntilNextVaccine} dias`
                  }.`
            }
            actionLabel="Ver vacinas"
            onAction={onShowVaccines}
          />
        )}
      </div>
    </section>
  );
}

function PetAlertCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
      <p className="font-semibold text-amber-800">{title}</p>
      <p className="mt-1 text-sm text-amber-700">{description}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-xl bg-[#8A0EEA] px-3 py-2 text-sm font-semibold text-white hover:bg-[#7600d1]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
