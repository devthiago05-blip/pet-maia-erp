"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { ClinicalDocumentModal } from "@/components/clinic/ClinicalDocumentModal";
import { ExamModal } from "@/components/clinic/ExamModal";
import { NewClinicalRecordModal } from "@/components/clinic/NewClinicalRecordModal";
import { PrescriptionDocumentModal } from "@/components/clinic/PrescriptionDocumentModal";
import { PrescriptionModal } from "@/components/clinic/PrescriptionModal";
import { VaccinationModal } from "@/components/clinic/VaccinationModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { fetchAppointmentsByPet } from "@/services/appointments";
import {
  createClinicalDocument,
  createClinicalPrescription,
  createClinicalRecord,
  createPetVaccination,
  fetchClinicalDocumentsByPet,
  fetchClinicalExamsByPet,
  fetchClinicalRecordsByPet,
  fetchPetVaccinations,
  saveClinicalExam,
} from "@/services/clinical";
import { fetchFinancialEntriesByPet } from "@/services/financial";
import { fetchPetById } from "@/services/pets";
import type {
  Appointment,
  ClinicalDocument,
  ClinicalDocumentInput,
  ClinicalExam,
  ClinicalExamInput,
  ClinicalRecord,
  FinancialEntry,
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetVaccinationInput,
  Pet,
  PetVaccination,
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

export default function PetPage() {
  const params = useParams<{ id: string }>();
  const { profile } = useAccess();
  const [tab, setTab] = useState("dados");
  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
      ] = await Promise.all([
        fetchAppointmentsByPet(petId),
        fetchFinancialEntriesByPet(data.nome),
        fetchClinicalRecordsByPet(petId),
        fetchPetVaccinations(petId),
        fetchClinicalExamsByPet(petId),
        fetchClinicalDocumentsByPet(petId),
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

      setPet(data);
      setAppointments(appointmentsResponse.data || []);
      setFinancialEntries(financialResponse.data || []);
      setLoading(false);
    }

    loadPet();
  });

  const groomingAppointments = appointments.filter((appointment) => {
    const service = normalizeText(appointment.servico);
    return ["banho", "tosa", "hidratacao", "unhas", "ouvido"].some((term) =>
      service.includes(term),
    );
  });

  async function handleCreateClinicalRecord(record: NewClinicalRecordInput) {
    const { error: createError } = await createClinicalRecord(record);

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
    toast.success("Consulta adicionada ao prontuário!");
  }

  async function handleCreatePrescription(
    prescription: NewClinicalPrescriptionInput,
  ) {
    const { error: createError } =
      await createClinicalPrescription(prescription);

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
    toast.success("Prescrição adicionada!");
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
                  {tab === "clinica" && (
                    <ClinicalHistory
                      pet={pet}
                      records={clinicalRecords}
                      error={clinicalError}
                      professionalName={profile?.nome || ""}
                      onSave={handleCreateClinicalRecord}
                      onPrescriptionSave={handleCreatePrescription}
                    />
                  )}
                  {tab === "vacinas" && (
                    <VaccinationHistory
                      pet={pet}
                      vaccinations={vaccinations}
                      error={vaccinationError}
                      professionalName={profile?.nome || ""}
                      onSave={handleCreateVaccination}
                    />
                  )}
                  {tab === "exames" && (
                    <ExamHistory
                      pet={pet}
                      exams={exams}
                      error={examError}
                      professionalName={profile?.nome || ""}
                      onSave={handleSaveExam}
                    />
                  )}
                  {tab === "documentos" && (
                    <ClinicalDocuments
                      pet={pet}
                      documents={documents}
                      error={documentError}
                      professionalName={profile?.nome || ""}
                      onSave={handleCreateDocument}
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

function ClinicalHistory({
  pet,
  records,
  error,
  professionalName,
  onSave,
  onPrescriptionSave,
}: {
  pet: Pet;
  records: ClinicalRecord[];
  error: string;
  professionalName: string;
  onSave: (record: NewClinicalRecordInput) => Promise<void>;
  onPrescriptionSave: (
    prescription: NewClinicalPrescriptionInput,
  ) => Promise<void>;
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
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="font-semibold">Prescrições</h4>
                  <PrescriptionModal
                    clinicalRecordId={record.id}
                    onSave={onPrescriptionSave}
                  />
                </div>
                {record.clinical_prescriptions?.length ? (
                  <div className="mt-3 space-y-3">
                    <div className="divide-y rounded-xl border bg-white">
                      {record.clinical_prescriptions.map((prescription) => (
                        <div key={prescription.id} className="p-3 text-sm">
                          <p className="font-semibold">
                            {prescription.medication}
                          </p>
                          <p className="text-slate-600">
                            {prescription.dosage} · {prescription.frequency}
                            {prescription.duration
                              ? ` · ${prescription.duration}`
                              : ""}
                          </p>
                          {prescription.instructions && (
                            <p className="mt-1 whitespace-pre-wrap text-slate-500">
                              {prescription.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <PrescriptionDocumentModal
                      pet={pet}
                      record={record}
                      prescriptions={record.clinical_prescriptions}
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Nenhuma prescrição registrada.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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
}: {
  pet: Pet;
  vaccinations: PetVaccination[];
  error: string;
  professionalName: string;
  onSave: (vaccination: NewPetVaccinationInput) => Promise<void>;
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
}: {
  pet: Pet;
  exams: ClinicalExam[];
  error: string;
  professionalName: string;
  onSave: (input: ClinicalExamInput) => Promise<void>;
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
  onSave,
}: {
  pet: Pet;
  documents: ClinicalDocument[];
  error: string;
  professionalName: string;
  onSave: (input: ClinicalDocumentInput) => Promise<void>;
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
                    <ClinicalDocumentModal
                      pet={pet}
                      document={document}
                      defaultProfessionalName={professionalName}
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
