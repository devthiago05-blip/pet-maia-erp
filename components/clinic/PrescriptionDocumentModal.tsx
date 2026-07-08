"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { formatDate } from "@/lib/formatters";
import type { ClinicalPrescription, ClinicalRecord, Pet } from "@/types/domain";

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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 print:hidden">
              <h2 className="text-xl font-bold">Receita veterinária</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar receita"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="receipt-print-area space-y-6 p-5 sm:p-8">
              <div className="border-b pb-5 text-center">
                <BrandLogo className="mx-auto max-w-[250px]" />
                <p className="mt-2 font-semibold">Receita veterinária</p>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <strong>Paciente:</strong> {pet.nome}
                </p>
                <p>
                  <strong>Espécie:</strong> {pet.especie || "-"}
                </p>
                <p>
                  <strong>Raça:</strong> {pet.raca || "-"}
                </p>
                <p>
                  <strong>Tutor:</strong> {pet.tutors?.nome || "-"}
                </p>
                <p>
                  <strong>Data:</strong> {formatDate(record.consultation_date)}
                </p>
                <p>
                  <strong>Profissional:</strong> {record.professional_name}
                </p>
                {record.professional_crmv && (
                  <p>
                    <strong>CRMV:</strong> {record.professional_crmv}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                  <div key={prescription.id} className="border-b pb-4">
                    <p className="font-bold">
                      {index + 1}. {prescription.medication}
                    </p>
                    <p className="mt-1">
                      {prescription.dosage} · {prescription.frequency}
                      {prescription.duration
                        ? ` · ${prescription.duration}`
                        : ""}
                    </p>
                    {prescription.instructions && (
                      <p className="mt-2 whitespace-pre-wrap text-sm">
                        {prescription.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-12 text-center">
                <div className="mx-auto w-64 border-t pt-2 text-sm">
                  {record.professional_name}
                  {record.professional_crmv
                    ? ` · CRMV ${record.professional_crmv}`
                    : ""}
                </div>
              </div>
            </div>

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
