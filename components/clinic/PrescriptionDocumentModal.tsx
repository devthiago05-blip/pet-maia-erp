"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import type {
  ClinicalPrescription,
  ClinicalPrescriptionDocument,
  ClinicalRecord,
  ClinicSettings,
  Pet,
  PrescriptionPharmacyType,
  PrescriptionType,
} from "@/types/domain";

const manipulatedPattern = /manipulad|f[oó]rmula magistral/i;

const prescriptionTypeLabels: Record<PrescriptionType, string> = {
  simples: "Receita Simples",
  controle_especial: "Receita de Controle Especial",
  antimicrobiano: "Receita de Antimicrobiano",
};

const pharmacyLabels: Record<PrescriptionPharmacyType, string> = {
  veterinaria: "Farmácia veterinária",
  humana: "Farmácia humana",
  manipulacao: "Farmácia de manipulação",
};

function isManipulated(prescription: ClinicalPrescription) {
  return (
    prescription.item_type === "manipulado" ||
    manipulatedPattern.test(
      `${prescription.medication} ${prescription.instructions || ""}`,
    )
  );
}

function formatQuantity(value?: number) {
  if (value == null) return "";
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
    value,
  );
}

function buildAdministrationInstruction(prescription: ClinicalPrescription) {
  return [
    prescription.dosage,
    prescription.frequency,
    prescription.duration,
    prescription.instructions,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\.+$/g, "");
}

function formatLongDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function PrescriptionList({
  prescriptions,
  startAt = 0,
}: {
  prescriptions: ClinicalPrescription[];
  startAt?: number;
}) {
  return (
    <ol className="space-y-10">
      {prescriptions.map((prescription, index) => {
        const administration = buildAdministrationInstruction(prescription);

        return (
          <li key={prescription.id} className="break-inside-avoid">
            <p className="text-[10px] font-bold uppercase">
              {prescription.administration_route
                ? `Uso ${prescription.administration_route}`
                : "Uso veterinário"}
            </p>
            <div className="mt-2 flex items-end gap-2 text-xs font-bold sm:text-sm">
              <span className="shrink-0">{startAt + index + 1}.</span>
              <span className="uppercase">{prescription.medication}</span>
              <span className="mb-1 min-w-6 flex-1 border-b border-dotted border-slate-400" />
              {prescription.quantity != null && prescription.quantity_unit && (
                <span className="shrink-0 border px-2 py-0.5 text-[9px] font-medium uppercase">
                  {formatQuantity(prescription.quantity)}{" "}
                  {prescription.quantity_unit}
                </span>
              )}
            </div>
            {prescription.composition && (
              <p className="mt-2 pl-5 text-[10px] leading-5 whitespace-pre-wrap sm:text-xs">
                {prescription.composition}
              </p>
            )}
            {(prescription.pharmacy_type ||
              prescription.pharmaceutical_form) && (
              <p className="mt-2 pl-5 text-[9px] text-slate-500 sm:text-[10px]">
                {prescription.pharmacy_type
                  ? pharmacyLabels[prescription.pharmacy_type]
                  : ""}
                {prescription.pharmacy_type && prescription.pharmaceutical_form
                  ? " · "
                  : ""}
                {prescription.pharmaceutical_form || ""}
              </p>
            )}
            {administration && (
              <p className="mt-3 pl-5 text-[10px] leading-5 font-medium whitespace-pre-wrap uppercase sm:text-xs">
                {administration}.
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PrescriptionDocumentModal({
  pet,
  record,
  prescriptions,
  clinicSettings,
  document,
  onUpdateDocument,
}: {
  pet: Pet;
  record: ClinicalRecord;
  prescriptions: ClinicalPrescription[];
  clinicSettings?: ClinicSettings | null;
  document?: ClinicalPrescriptionDocument;
  onUpdateDocument?: (
    id: number,
    generalInstructions: string,
    status?: "rascunho" | "emitida" | "cancelada",
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [generalInstructions, setGeneralInstructions] = useState(
    document?.general_instructions || "",
  );
  const [issuing, setIssuing] = useState(false);
  const regularPrescriptions = prescriptions.filter(
    (prescription) => !isManipulated(prescription),
  );
  const manipulatedPrescriptions = prescriptions.filter(isManipulated);
  const consultationDate = formatLongDate(
    document?.issue_date || record.consultation_date,
  );
  const documentType =
    prescriptions.find(
      (prescription) => prescription.prescription_type !== "simples",
    )?.prescription_type || "simples";
  const clinicName = clinicSettings?.nome || "Clínica Veterinária Pet Maia";
  const clinicCity = clinicSettings?.pix_city || "Fortaleza";

  async function handlePrint() {
    if (document?.status === "rascunho" && onUpdateDocument) {
      setIssuing(true);
      try {
        await onUpdateDocument(document.id, generalInstructions, "emitida");
      } catch {
        return;
      } finally {
        setIssuing(false);
      }
    }

    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium"
      >
        {document?.status === "rascunho"
          ? "Revisar e emitir"
          : "Visualizar receita"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white sm:max-h-[calc(100dvh-2rem)]">
            <div className="flex items-center justify-between border-b p-4 print:hidden">
              <h2 className="text-lg font-bold sm:text-xl">
                Receita veterinária
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar receita"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {document?.status === "rascunho" && (
              <div className="border-b bg-slate-50 p-4 print:hidden">
                <label className="grid gap-2 text-sm font-medium">
                  Instruções gerais do tratamento
                  <textarea
                    rows={3}
                    value={generalInstructions}
                    onChange={(event) =>
                      setGeneralInstructions(event.target.value)
                    }
                    placeholder="Orientações válidas para toda a receita"
                    className="resize-y rounded-lg border bg-white p-3 font-normal"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  A emissão encerra este rascunho. Novos itens formarão uma nova
                  receita.
                </p>
              </div>
            )}

            <article className="receipt-print-area mx-auto min-h-[980px] w-full max-w-[794px] bg-white p-5 text-slate-900 sm:p-10">
              <header>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-base font-bold text-[#8A0EEA] sm:text-lg">
                      {clinicName}
                    </p>
                    <p className="mt-1 text-xs font-medium sm:text-sm">
                      {record.professional_crmv
                        ? `CRMV ${record.professional_crmv}`
                        : "Atendimento veterinário"}
                    </p>
                  </div>
                  <p className="max-w-[45%] text-right text-xs leading-5 font-medium sm:text-sm">
                    {clinicCity}
                  </p>
                </div>
                <div className="mt-5 h-0.5 w-full bg-[#8A0EEA]" />
                <h1 className="mt-4 text-xs font-bold sm:text-sm">
                  {prescriptionTypeLabels[documentType]}
                </h1>
              </header>

              <section className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-700 px-4 py-3 text-center">
                  <h2 className="text-[10px] font-bold uppercase sm:text-xs">
                    Animal
                  </h2>
                  <dl className="mx-auto mt-2 grid max-w-sm grid-cols-[auto_1fr] gap-x-2 text-left text-[10px] leading-4 sm:text-xs">
                    <dt className="font-semibold">Nome:</dt>
                    <dd>{pet.nome}</dd>
                    <dt className="font-semibold">Espécie:</dt>
                    <dd>{pet.especie || "Não informado"}</dd>
                    <dt className="font-semibold">Raça:</dt>
                    <dd>{pet.raca || "Não informada"}</dd>
                    <dt className="font-semibold">Sexo:</dt>
                    <dd>{pet.sexo || "Não informado"}</dd>
                    <dt className="font-semibold">Idade:</dt>
                    <dd>{pet.idade || "Não informada"}</dd>
                    {record.weight_kg != null && (
                      <>
                        <dt className="font-semibold">Peso:</dt>
                        <dd>{record.weight_kg} kg</dd>
                      </>
                    )}
                  </dl>
                </div>

                <div className="rounded-lg border border-slate-700 px-4 py-3 text-center">
                  <h2 className="text-[10px] font-bold uppercase sm:text-xs">
                    Responsável
                  </h2>
                  <dl className="mx-auto mt-2 grid max-w-sm grid-cols-[auto_1fr] gap-x-2 text-left text-[10px] leading-4 sm:text-xs">
                    <dt className="font-semibold">Nome:</dt>
                    <dd>{pet.tutors?.nome || "Não informado"}</dd>
                    <dt className="font-semibold">Endereço:</dt>
                    <dd className="break-words">
                      {pet.tutors?.endereco || "Não informado"}
                    </dd>
                  </dl>
                </div>
              </section>

              <section className="mt-8">
                <h2 className="border-b border-slate-400 pb-2 text-[10px] font-bold tracking-wide uppercase sm:text-xs">
                  Medicamentos e orientações
                </h2>

                <div className="mt-6">
                  {regularPrescriptions.length > 0 && (
                    <PrescriptionList prescriptions={regularPrescriptions} />
                  )}

                  {manipulatedPrescriptions.length > 0 && (
                    <div
                      className={regularPrescriptions.length > 0 ? "mt-8" : ""}
                    >
                      <h3 className="mb-5 text-sm font-bold tracking-wide text-[#8A0EEA] uppercase">
                        Para manipular:
                      </h3>
                      <PrescriptionList
                        prescriptions={manipulatedPrescriptions}
                        startAt={regularPrescriptions.length}
                      />
                    </div>
                  )}
                </div>

                {(generalInstructions || document?.general_instructions) && (
                  <div className="mt-10 break-inside-avoid">
                    <h3 className="border-b border-slate-400 pb-2 text-[10px] font-bold tracking-wide uppercase sm:text-xs">
                      Instruções gerais do tratamento
                    </h3>
                    <p className="mt-3 text-[10px] leading-5 whitespace-pre-wrap uppercase sm:text-xs">
                      {generalInstructions || document?.general_instructions}
                    </p>
                  </div>
                )}
              </section>

              <footer className="mt-20 break-inside-avoid text-center">
                <p className="text-xs sm:text-sm">{consultationDate}</p>
                <div className="mx-auto mt-14 w-full max-w-sm border-t border-slate-700 pt-3">
                  <p className="text-xs text-slate-500">
                    Assinado eletronicamente
                  </p>
                  <p className="mt-1 text-sm font-bold">
                    {record.professional_name}
                  </p>
                  {record.professional_crmv && (
                    <p className="text-xs font-medium">
                      CRMV {record.professional_crmv}
                    </p>
                  )}
                </div>
              </footer>
            </article>

            <div className="grid gap-3 border-t p-4 print:hidden sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={issuing}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-50"
              >
                <Printer size={18} />
                {issuing
                  ? "Emitindo..."
                  : document?.status === "rascunho"
                    ? "Emitir e imprimir"
                    : "Imprimir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
