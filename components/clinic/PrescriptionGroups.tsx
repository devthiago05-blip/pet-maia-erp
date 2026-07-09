"use client";

import { AlertTriangle, FileCheck2, FileClock } from "lucide-react";

import { formatDate } from "@/lib/formatters";
import type {
  ClinicalPrescription,
  ClinicalPrescriptionDocument,
  ClinicalRecord,
  ClinicSettings,
  NewClinicalPrescriptionInput,
  Pet,
} from "@/types/domain";

import { PrescriptionDeleteButton } from "./PrescriptionDeleteButton";
import { PrescriptionDocumentModal } from "./PrescriptionDocumentModal";
import { PrescriptionModal } from "./PrescriptionModal";
import { PrescriptionShareButton } from "./PrescriptionShareButton";

const prescriptionTypeLabels = {
  simples: "Simples",
  controle_especial: "Controle especial",
  antimicrobiano: "Antimicrobiano",
};

export function PrescriptionGroups({
  pet,
  record,
  clinicSettings,
  onSaveItem,
  onDeleteItem,
  onUpdateDocument,
}: {
  pet: Pet;
  record: ClinicalRecord;
  clinicSettings: ClinicSettings | null;
  onSaveItem: (input: NewClinicalPrescriptionInput) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onUpdateDocument: (
    id: number,
    generalInstructions: string,
    status?: "rascunho" | "emitida" | "cancelada",
  ) => Promise<void>;
}) {
  const documents = [...(record.clinical_prescription_documents || [])].sort(
    (a, b) => b.created_at.localeCompare(a.created_at),
  );
  const linkedItemIds = new Set(
    documents.flatMap((document) =>
      (document.clinical_prescriptions || []).map((item) => item.id),
    ),
  );
  const legacyItems = (record.clinical_prescriptions || []).filter(
    (item) => !linkedItemIds.has(item.id),
  );
  const hasItems = documents.length > 0 || legacyItems.length > 0;

  return (
    <section className="rounded-lg border bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-semibold">Receituário</h4>
          <p className="mt-1 text-xs text-slate-500">
            Adicione itens ao rascunho e emita quando estiver completo.
          </p>
        </div>
        <PrescriptionModal clinicalRecordId={record.id} onSave={onSaveItem} />
      </div>

      {hasItems ? (
        <div className="mt-4 space-y-4">
          {documents.map((document) => (
            <PrescriptionDocumentCard
              key={document.id}
              document={document}
              pet={pet}
              record={record}
              clinicSettings={clinicSettings}
              onSaveItem={onSaveItem}
              onDeleteItem={onDeleteItem}
              onUpdateDocument={onUpdateDocument}
            />
          ))}

          {legacyItems.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <p className="text-xs font-semibold text-amber-700">
                Itens antigos ainda não agrupados
              </p>
              <div className="mt-3 divide-y">
                {legacyItems.map((item) => (
                  <PrescriptionItem
                    key={item.id}
                    item={item}
                    recordId={record.id}
                    onSave={onSaveItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          Nenhuma receita registrada nesta consulta.
        </p>
      )}
    </section>
  );
}

function PrescriptionDocumentCard({
  document,
  pet,
  record,
  clinicSettings,
  onSaveItem,
  onDeleteItem,
  onUpdateDocument,
}: {
  document: ClinicalPrescriptionDocument;
  pet: Pet;
  record: ClinicalRecord;
  clinicSettings: ClinicSettings | null;
  onSaveItem: (input: NewClinicalPrescriptionInput) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onUpdateDocument: (
    id: number,
    generalInstructions: string,
    status?: "rascunho" | "emitida" | "cancelada",
  ) => Promise<void>;
}) {
  const items = document.clinical_prescriptions || [];
  const isDraft = document.status === "rascunho";
  const prescriptionTypes = Array.from(
    new Set(items.map((item) => item.prescription_type)),
  );
  const pendingChecks = getPrescriptionDocumentPendingChecks(document, items);

  return (
    <article className="overflow-hidden rounded-lg border bg-white">
      <header className="flex flex-col gap-3 border-b bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`rounded-lg p-2 ${isDraft ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {isDraft ? <FileClock size={18} /> : <FileCheck2 size={18} />}
          </span>
          <div>
            <p className="font-semibold">
              Receita de {formatDate(document.issue_date)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isDraft
                ? "Rascunho em edição"
                : document.status === "cancelada"
                  ? "Receita cancelada"
                  : "Receita emitida"}
              {` · ${items.length} ${items.length === 1 ? "item" : "itens"}`}
            </p>
            {prescriptionTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {prescriptionTypes.map((type) => (
                  <span
                    key={type}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      type === "simples"
                        ? "bg-slate-200 text-slate-700"
                        : "bg-purple-100 text-[#8A0EEA]"
                    }`}
                  >
                    {prescriptionTypeLabels[type]}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {items.length > 0 && document.status !== "cancelada" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {document.status === "emitida" && (
              <PrescriptionShareButton document={document} />
            )}
            <PrescriptionDocumentModal
              pet={pet}
              record={record}
              document={document}
              prescriptions={items}
              clinicSettings={clinicSettings}
              onUpdateDocument={onUpdateDocument}
            />
          </div>
        )}
      </header>

      {items.length > 0 ? (
        <div className="divide-y">
          {items.map((item) => (
            <PrescriptionItem
              key={item.id}
              item={item}
              recordId={record.id}
              onSave={onSaveItem}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      ) : (
        <p className="p-4 text-sm text-slate-500">
          O rascunho ainda não possui itens.
        </p>
      )}

      {pendingChecks.length > 0 && (
        <div className="border-t border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold">Pendencias para revisar</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
                {pendingChecks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {document.general_instructions && (
        <div className="border-t bg-purple-50/50 p-4 text-sm">
          <span className="font-semibold">Instruções gerais: </span>
          <span className="whitespace-pre-wrap text-slate-600">
            {document.general_instructions}
          </span>
        </div>
      )}
    </article>
  );
}

function getPrescriptionDocumentPendingChecks(
  document: ClinicalPrescriptionDocument,
  items: ClinicalPrescription[],
) {
  const checks = new Set<string>();

  if (items.length === 0) {
    checks.add("Inclua pelo menos um item antes de emitir.");
  }

  if (document.status === "emitida" && !document.professional_crmv?.trim()) {
    checks.add("Receita emitida sem CRMV salvo no historico.");
  }

  if (
    document.status === "emitida" &&
    document.professional_crmv?.trim() &&
    !document.professional_crmv_state?.trim()
  ) {
    checks.add("UF do CRMV nao foi salva no historico da emissao.");
  }

  items.forEach((item) => {
    if (
      item.prescription_type !== "simples" &&
      (item.quantity == null || !item.quantity_unit?.trim())
    ) {
      checks.add(
        "Receitas especiais ou antimicrobianas devem ter quantidade estruturada.",
      );
    }

    if (item.item_type === "manipulado") {
      const hasFormulaComponents =
        item.prescription_formula_components?.some(
          (component) =>
            component.component_name?.trim() && component.concentration?.trim(),
        ) || false;

      if (!item.composition?.trim() && !hasFormulaComponents) {
        checks.add("Formula manipulada sem composicao estruturada.");
      }
    }

    if (!item.administration_route?.trim()) {
      checks.add("Existe item sem via de administracao.");
    }
  });

  return Array.from(checks);
}

function PrescriptionItem({
  item,
  recordId,
  onSave,
  onDelete,
}: {
  item: ClinicalPrescription;
  recordId: number;
  onSave: (input: NewClinicalPrescriptionInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  return (
    <div className="p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold break-words">{item.medication}</p>
          <p className="mt-1 text-slate-600">
            {[item.dosage, item.frequency, item.duration]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PrescriptionModal
            clinicalRecordId={recordId}
            prescription={item}
            onSave={onSave}
          />
          <PrescriptionDeleteButton
            medication={item.medication}
            onDelete={() => onDelete(item.id)}
          />
        </div>
      </div>
      {item.instructions && (
        <p className="mt-2 whitespace-pre-wrap text-slate-500">
          {item.instructions}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        {item.item_type === "manipulado" ? "Manipulado" : "Industrializado"}
        {item.administration_route ? ` · Via ${item.administration_route}` : ""}
        {item.quantity && item.quantity_unit
          ? ` · ${item.quantity} ${item.quantity_unit}`
          : ""}
      </p>
    </div>
  );
}
