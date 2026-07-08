"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import type { ClinicalPrescription, ClinicalRecord, Pet } from "@/types/domain";

const manipulatedPattern = /manipulad|f[oó]rmula magistral/i;

function isManipulated(prescription: ClinicalPrescription) {
  return manipulatedPattern.test(
    `${prescription.medication} ${prescription.instructions || ""}`,
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
    <ol className="space-y-6">
      {prescriptions.map((prescription, index) => {
        const administration = buildAdministrationInstruction(prescription);

        return (
          <li
            key={prescription.id}
            className="break-inside-avoid border-b border-dashed border-slate-300 pb-5 last:border-0"
          >
            <div className="flex items-baseline gap-2 text-sm font-bold uppercase sm:text-base">
              <span className="shrink-0 text-[#8A0EEA]">
                {startAt + index + 1}.
              </span>
              <span>{prescription.medication}</span>
            </div>
            {administration && (
              <p className="mt-2 pl-6 text-xs leading-5 font-semibold whitespace-pre-wrap uppercase sm:text-sm">
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
}: {
  pet: Pet;
  record: ClinicalRecord;
  prescriptions: ClinicalPrescription[];
}) {
  const [open, setOpen] = useState(false);
  const regularPrescriptions = prescriptions.filter(
    (prescription) => !isManipulated(prescription),
  );
  const manipulatedPrescriptions = prescriptions.filter(isManipulated);
  const consultationDate = formatLongDate(record.consultation_date);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium"
      >
        Imprimir receita
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

            <article className="receipt-print-area min-h-[980px] bg-white p-5 text-slate-900 sm:p-10">
              <header>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-base font-bold text-[#8A0EEA] sm:text-lg">
                      Clínica Veterinária Pet Maia
                    </p>
                    <p className="mt-1 text-xs font-medium sm:text-sm">
                      {record.professional_crmv
                        ? `CRMV ${record.professional_crmv}`
                        : "Atendimento veterinário"}
                    </p>
                  </div>
                  <p className="max-w-[45%] text-right text-xs leading-5 font-medium sm:text-sm">
                    {consultationDate}
                  </p>
                </div>
                <div className="mt-5 h-1 w-full bg-[#8A0EEA]" />
                <h1 className="mt-7 text-center text-xl font-bold sm:text-2xl">
                  Receita Simples
                </h1>
              </header>

              <section className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="border border-slate-300 p-4">
                  <h2 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-[#8A0EEA] uppercase">
                    Animal
                  </h2>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs leading-5 sm:text-sm">
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

                <div className="border border-slate-300 p-4">
                  <h2 className="border-b border-slate-200 pb-2 text-xs font-bold tracking-wide text-[#8A0EEA] uppercase">
                    Responsável
                  </h2>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs leading-5 sm:text-sm">
                    <dt className="font-semibold">Nome:</dt>
                    <dd>{pet.tutors?.nome || "Não informado"}</dd>
                    <dt className="font-semibold">Endereço:</dt>
                    <dd className="break-words">
                      {pet.tutors?.endereco || "Não informado"}
                    </dd>
                  </dl>
                </div>
              </section>

              <section className="mt-9">
                <h2 className="border-b-2 border-[#8A0EEA] pb-2 text-xs font-bold tracking-wide uppercase sm:text-sm">
                  Instruções gerais do tratamento
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
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-2 text-white"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
