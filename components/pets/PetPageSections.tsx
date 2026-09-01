"use client";

import { useState } from "react";

import { ClinicalConsentPanel } from "@/components/clinic/ClinicalConsentPanel";
import { ClinicalDocumentModal } from "@/components/clinic/ClinicalDocumentModal";
import { ExamAttachments } from "@/components/clinic/ExamAttachments";
import { ExamModal } from "@/components/clinic/ExamModal";
import { NewClinicalRecordModal } from "@/components/clinic/NewClinicalRecordModal";
import { ParasitePreventionModal } from "@/components/clinic/ParasitePreventionModal";
import { PrescriptionGroups } from "@/components/clinic/PrescriptionGroups";
import { VaccinationModal } from "@/components/clinic/VaccinationModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type {
  Appointment,
  ClinicalConsent,
  ClinicalConsentInput,
  ClinicalDocument,
  ClinicalDocumentInput,
  ClinicalExam,
  ClinicalExamInput,
  ClinicalRecord,
  ClinicSettings,
  FinancialEntry,
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetParasitePreventionInput,
  NewPetVaccinationInput,
  Pet,
  PetParasitePrevention,
  PetVaccination,
} from "@/types/domain";

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value?: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function calculateDaysSinceDate(value?: string | null) {
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

export function calculateDaysUntilDate(value?: string | null) {
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

export function createTutorWhatsAppLink(phone?: string | null, petName?: string) {
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

export function extractReceiptObservations(description?: string, petName?: string) {
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
export function ClinicalHistory({
  pet,
  records,
  error,
  professionalName,
  clinicSettings,
  vaccinations,
  exams,
  documents,
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
  vaccinations: PetVaccination[];
  exams: ClinicalExam[];
  documents: ClinicalDocument[];
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
            previousRecord={records[0]}
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
          <ClinicalTimeline
            records={records}
            vaccinations={vaccinations}
            exams={exams}
            documents={documents}
          />
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
                    {record.heart_rate && (
                      <span className="rounded-lg bg-slate-100 px-3 py-1">
                        FC {record.heart_rate} bpm
                      </span>
                    )}
                    {record.respiratory_rate && (
                      <span className="rounded-lg bg-slate-100 px-3 py-1">
                        FR {record.respiratory_rate} mpm
                      </span>
                    )}
                    {record.pain_score != null && (
                      <span
                        className={`rounded-lg px-3 py-1 ${record.pain_score >= 7 ? "bg-red-100 text-red-700" : record.pain_score >= 4 ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        Dor {record.pain_score}/10
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
                <ClinicalText
                  label="Mucosas e hidratação"
                  value={
                    [record.mucous_membranes, record.hydration_status]
                      .filter(Boolean)
                      .join(" · ") || undefined
                  }
                />
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

type ClinicalTimelineItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  tone: "purple" | "emerald" | "amber" | "sky" | "slate";
};

function ClinicalTimeline({
  records,
  vaccinations,
  exams,
  documents,
}: {
  records: ClinicalRecord[];
  vaccinations: PetVaccination[];
  exams: ClinicalExam[];
  documents: ClinicalDocument[];
}) {
  const items: ClinicalTimelineItem[] = [
    ...records.map((record) => ({
      id: `record-${record.id}`,
      date: record.consultation_date,
      type: "Consulta",
      title: record.main_complaint || "Consulta clinica",
      description: [
        record.professional_name,
        record.diagnosis ? `Diagnostico: ${record.diagnosis}` : "",
        record.return_date ? `Retorno: ${formatDate(record.return_date)}` : "",
      ]
        .filter(Boolean)
        .join(" - "),
      tone: "purple" as const,
    })),
    ...records.flatMap((record) =>
      (record.clinical_prescription_documents || []).map((document) => ({
        id: `prescription-document-${document.id}`,
        date: document.issued_at || document.issue_date,
        type: "Receita",
        title:
          document.status === "rascunho"
            ? "Receita em rascunho"
            : document.status === "cancelada"
              ? "Receita cancelada"
              : "Receita emitida",
        description: `${document.clinical_prescriptions?.length || 0} ${
          document.clinical_prescriptions?.length === 1 ? "item" : "itens"
        } - ${document.professional_name}`,
        tone:
          document.status === "emitida"
            ? ("emerald" as const)
            : ("amber" as const),
      })),
    ),
    ...vaccinations.map((vaccination) => ({
      id: `vaccination-${vaccination.id}`,
      date: vaccination.application_date,
      type: "Vacina",
      title: vaccination.vaccine_name,
      description: [
        vaccination.professional_name,
        vaccination.next_dose_date
          ? `Proxima dose: ${formatDate(vaccination.next_dose_date)}`
          : "",
      ]
        .filter(Boolean)
        .join(" - "),
      tone: "emerald" as const,
    })),
    ...exams.map((exam) => ({
      id: `exam-${exam.id}`,
      date: exam.request_date,
      type: "Exame",
      title: exam.exam_name,
      description: [exam.status, exam.laboratory, exam.professional_name]
        .filter(Boolean)
        .join(" - "),
      tone: "sky" as const,
    })),
    ...documents.map((document) => ({
      id: `document-${document.id}`,
      date: document.issue_date,
      type: "Documento",
      title: document.title,
      description: `${document.document_type} - ${document.professional_name}`,
      tone: "slate" as const,
    })),
  ]
    .filter((item) => item.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border-b bg-slate-50 p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h4 className="font-bold">Linha do tempo clinica</h4>
          <p className="text-sm text-slate-500">
            Ultimos eventos clinicos reunidos em ordem cronologica.
          </p>
        </div>
        <span className="text-xs text-slate-400">{items.length} eventos</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[92px_1fr] gap-3">
            <div className="pt-1 text-right text-xs text-slate-500">
              {formatDate(item.date)}
            </div>
            <article className="relative rounded-xl border bg-white p-3 shadow-sm before:absolute before:top-4 before:-left-[19px] before:h-2 before:w-2 before:rounded-full before:bg-[#8A0EEA]">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getTimelineToneClass(
                    item.tone,
                  )}`}
                >
                  {item.type}
                </span>
                <h5 className="font-semibold text-slate-800">{item.title}</h5>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {item.description}
                </p>
              )}
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}

function getTimelineToneClass(tone: ClinicalTimelineItem["tone"]) {
  const classes = {
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-[#8A0EEA]",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return classes[tone];
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

export function VaccinationHistory({
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
          <div className="grid gap-2 sm:flex">
            {vaccinations.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl border border-[#8A0EEA] px-4 py-2 text-sm font-medium text-[#8A0EEA]"
              >
                Imprimir carteirinha
              </button>
            )}
            <VaccinationWhatsAppButton pet={pet} vaccinations={vaccinations} />
            <VaccinationModal
              petId={pet.id}
              species={pet.especie}
              defaultProfessionalName={professionalName}
              onSave={onSave}
            />
          </div>
        )}
      </div>

      {!error && (
        <VaccinationProtocolStatus pet={pet} vaccinations={vaccinations} />
      )}

      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : vaccinations.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhuma vacina registrada.
        </p>
      ) : (
        <div className="p-4 sm:p-6">
          <div className="grid gap-3 md:hidden">
            {vaccinations.map((vaccination) => (
              <VaccinationCard
                key={vaccination.id}
                vaccination={vaccination}
                onDelete={onDelete}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
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
        </div>
      )}
      {vaccinations.length > 0 && (
        <VaccinationPrintCard pet={pet} vaccinations={vaccinations} />
      )}
    </section>
  );
}

function VaccinationCard({
  vaccination,
  onDelete,
}: {
  vaccination: PetVaccination;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <article className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{vaccination.vaccine_name}</p>
          <p className="text-sm text-slate-500">
            Aplicada em {formatDate(vaccination.application_date)}
          </p>
        </div>
        <VaccineDateStatus date={vaccination.next_dose_date} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Próxima dose</p>
          <p className="font-semibold">
            {formatDate(vaccination.next_dose_date)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Lote</p>
          <p className="font-semibold">{vaccination.batch_number || "-"}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Profissional</p>
          <p className="font-semibold">{vaccination.professional_name}</p>
        </div>
      </div>
      {vaccination.notes && (
        <p className="mt-3 text-sm text-slate-600">{vaccination.notes}</p>
      )}
      <div className="mt-3">
        <ClinicalDeleteButton
          itemName={vaccination.vaccine_name}
          onDelete={() => onDelete(vaccination.id)}
        />
      </div>
    </article>
  );
}

function VaccinationProtocolStatus({
  pet,
  vaccinations,
}: {
  pet: Pet;
  vaccinations: PetVaccination[];
}) {
  const species = normalizeText(pet.especie || "");
  const isCat = species.includes("gat") || species.includes("felin");
  const protocols = isCat
    ? [
        { label: "Múltipla felina", terms: ["v3", "v4", "v5", "felina"] },
        { label: "Antirrábica", terms: ["raiva", "antirr"] },
      ]
    : [
        { label: "Polivalente canina", terms: ["v8", "v10", "polivalente"] },
        { label: "Antirrábica", terms: ["raiva", "antirr"] },
      ];

  return (
    <div className="border-b bg-slate-50 p-4 sm:p-6">
      <p className="text-sm font-semibold">Protocolo preventivo essencial</p>
      <p className="text-xs text-slate-500">
        Apoio à conferência; valide o protocolo individual com o veterinário.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {protocols.map((protocol) => {
          const record = vaccinations.find((item) =>
            protocol.terms.some((term) =>
              normalizeText(item.vaccine_name).includes(term),
            ),
          );
          const days = calculateDaysUntilDate(record?.next_dose_date);
          const overdue = days !== null && days < 0;

          return (
            <div
              key={protocol.label}
              className={`rounded-xl border bg-white p-3 text-sm ${
                !record || overdue ? "border-amber-300" : "border-emerald-200"
              }`}
            >
              <p className="font-semibold">{protocol.label}</p>
              <p
                className={
                  !record || overdue ? "text-amber-700" : "text-emerald-700"
                }
              >
                {!record
                  ? "Sem registro — avaliar"
                  : overdue
                    ? `Dose vencida em ${formatDate(record.next_dose_date)}`
                    : record.next_dose_date
                      ? `Próxima: ${formatDate(record.next_dose_date)}`
                      : "Aplicação registrada"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VaccineDateStatus({ date }: { date?: string }) {
  const days = calculateDaysUntilDate(date);
  if (days === null)
    return (
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
        Sem próxima dose
      </span>
    );
  if (days < 0)
    return (
      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">
        Vencida
      </span>
    );
  if (days <= 30)
    return (
      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
        Em {days} dia(s)
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
      Em dia
    </span>
  );
}

function VaccinationWhatsAppButton({
  pet,
  vaccinations,
}: {
  pet: Pet;
  vaccinations: PetVaccination[];
}) {
  const next = vaccinations
    .filter((item) => item.next_dose_date)
    .sort((a, b) =>
      (a.next_dose_date || "").localeCompare(b.next_dose_date || ""),
    )[0];
  const phone = pet.tutors?.telefone?.replace(/\D/g, "");
  if (!phone || !next?.next_dose_date) return null;
  const normalized = phone.startsWith("55") ? phone : `55${phone}`;
  const message = `Olá! Aqui é da Pet Maia. A próxima dose de ${next.vaccine_name} de ${pet.nome} está prevista para ${formatDate(next.next_dose_date)}. Podemos confirmar?`;

  return (
    <a
      href={`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white"
    >
      Lembrar pelo WhatsApp
    </a>
  );
}

function VaccinationPrintCard({
  pet,
  vaccinations,
}: {
  pet: Pet;
  vaccinations: PetVaccination[];
}) {
  return (
    <section className="document-print-area hidden bg-white p-8 print:block">
      <h1 className="text-2xl font-bold">Carteirinha de vacinação</h1>
      <p className="mt-2">
        Pet Maia · Paciente: <strong>{pet.nome}</strong> · Tutor:{" "}
        <strong>{pet.tutors?.nome || "-"}</strong>
      </p>
      <p>
        {pet.especie} · {pet.raca || "Raça não informada"}
      </p>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2 text-left">Vacina</th>
            <th className="border p-2 text-left">Aplicação</th>
            <th className="border p-2 text-left">Próxima dose</th>
            <th className="border p-2 text-left">Fabricante / lote</th>
            <th className="border p-2 text-left">Profissional</th>
          </tr>
        </thead>
        <tbody>
          {vaccinations.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.vaccine_name}</td>
              <td className="border p-2">
                {formatDate(item.application_date)}
              </td>
              <td className="border p-2">{formatDate(item.next_dose_date)}</td>
              <td className="border p-2">
                {[item.manufacturer, item.batch_number]
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </td>
              <td className="border p-2">{item.professional_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6 text-xs text-slate-500">
        Documento de acompanhamento. O protocolo deve ser validado pelo
        médico-veterinário responsável.
      </p>
    </section>
  );
}

export function ParasitePreventionHistory({
  pet,
  preventions,
  error,
  professionalName,
  onSave,
  onDelete,
}: {
  pet: Pet;
  preventions: PetParasitePrevention[];
  error: string;
  professionalName: string;
  onSave: (input: NewPetParasitePreventionInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const next = [...preventions]
    .filter((item) => item.next_application_date)
    .sort((a, b) =>
      (a.next_application_date || "").localeCompare(
        b.next_application_date || "",
      ),
    )[0];
  const phone = pet.tutors?.telefone?.replace(/\D/g, "");
  const normalizedPhone = phone
    ? phone.startsWith("55")
      ? phone
      : `55${phone}`
    : "";
  const message = next?.next_application_date
    ? `Olá! Aqui é da Pet Maia. A próxima aplicação de ${next.product_name} de ${pet.nome} está prevista para ${formatDate(next.next_application_date)}. Podemos confirmar?`
    : "";

  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h3 className="text-lg font-bold">Controle antiparasitário</h3>
          <p className="text-sm text-slate-500">
            Vermífugos, pulgas, carrapatos e próximas aplicações de {pet.nome}
          </p>
        </div>
        {!error && (
          <div className="grid gap-2 sm:flex">
            {normalizedPhone && message && (
              <a
                href={`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Lembrar pelo WhatsApp
              </a>
            )}
            <ParasitePreventionModal
              petId={pet.id}
              defaultProfessionalName={professionalName}
              onSave={onSave}
            />
          </div>
        )}
      </div>
      {error ? (
        <p className="p-6 text-sm text-amber-700">{error}</p>
      ) : preventions.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          Nenhum antiparasitário registrado.
        </p>
      ) : (
        <div className="grid gap-3 p-4 sm:p-6 lg:grid-cols-2">
          {preventions.map((prevention) => (
            <article key={prevention.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase text-[#8A0EEA]">
                    {prevention.prevention_type}
                  </span>
                  <p className="truncate font-bold">
                    {prevention.product_name}
                  </p>
                </div>
                <VaccineDateStatus date={prevention.next_application_date} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <PreventionInfo
                  label="Aplicação"
                  value={formatDate(prevention.application_date)}
                />
                <PreventionInfo
                  label="Próxima"
                  value={formatDate(prevention.next_application_date)}
                />
                <PreventionInfo label="Dose" value={prevention.dose || "-"} />
                <PreventionInfo
                  label="Peso"
                  value={
                    prevention.weight_kg ? `${prevention.weight_kg} kg` : "-"
                  }
                />
                <div className="col-span-2">
                  <PreventionInfo
                    label="Profissional"
                    value={prevention.professional_name}
                  />
                </div>
              </div>
              {prevention.notes && (
                <p className="mt-3 text-sm text-slate-600">
                  {prevention.notes}
                </p>
              )}
              <div className="mt-3">
                <ClinicalDeleteButton
                  itemName={prevention.product_name}
                  onDelete={() => onDelete(prevention.id)}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PreventionInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}

export function ExamHistory({
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

export function ClinicalDocuments({
  pet,
  documents,
  consents,
  error,
  professionalName,
  professionalCrmv,
  onSave,
  onConsentSave,
  onDelete,
}: {
  pet: Pet;
  documents: ClinicalDocument[];
  consents: ClinicalConsent[];
  error: string;
  professionalName: string;
  professionalCrmv: string;
  onSave: (input: ClinicalDocumentInput) => Promise<void>;
  onConsentSave: (input: ClinicalConsentInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <ClinicalConsentPanel
        pet={pet}
        consents={consents}
        professionalName={professionalName}
        onSave={onConsentSave}
      />
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

export function PetSummary({ pet }: { pet: Pet }) {
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

export function PetData({ pet }: { pet: Pet }) {
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

export function AppointmentHistory({
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

export function FinancialHistory({ entries }: { entries: FinancialEntry[] }) {
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
export function PetQuickStats({
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
export function PetAlerts({
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

