"use client";

import { Printer, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import { fetchSharedPrescription } from "@/services/clinical";

interface SharedPrescription {
  clinic?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  document: {
    id: number;
    issue_date: string;
    general_instructions?: string;
    status: string;
    issued_at?: string;
  };
  professional: {
    name: string;
    crmv?: string;
    crmv_state?: string;
    mapa_registration?: string;
    signature_text?: string;
  };
  pet: {
    id: number;
    name: string;
    species?: string;
    breed?: string;
    sex?: string;
    age?: string;
    tutor_name?: string;
    tutor_address?: string;
  };
  items: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
    item_type: string;
    prescription_type: string;
    pharmacy_type?: string;
    administration_route?: string;
    quantity?: number;
    quantity_unit?: string;
    pharmaceutical_form?: string;
    composition?: string;
    components?: Array<{
      name: string;
      concentration: string;
      unit?: string;
    }>;
  }>;
}

const pharmacyLabels: Record<string, string> = {
  veterinaria: "Farmácia veterinária",
  humana: "Farmácia humana",
  manipulacao: "Farmácia de manipulação",
};

export default function SharedPrescriptionPage() {
  const params = useParams<{ token: string }>();
  const [prescription, setPrescription] = useState<SharedPrescription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useMountEffect(() => {
    async function loadPrescription() {
      const { data, error } = await fetchSharedPrescription(params.token);
      if (error || !data) {
        setNotFound(true);
      } else {
        setPrescription(data as SharedPrescription);
      }
      setLoading(false);
    }

    loadPrescription();
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <p className="text-sm text-slate-500">Carregando receita...</p>
      </main>
    );
  }

  if (notFound || !prescription) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md rounded-lg border bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-slate-800">
            Receita indisponível
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            O link é inválido, foi desativado ou a receita ainda não foi
            emitida.
          </p>
        </div>
      </main>
    );
  }

  const { clinic, document, professional, pet, items } = prescription;
  const documentTitle = items.some(
    (item) => item.prescription_type === "controle_especial",
  )
    ? "Receita de Controle Especial"
    : items.some((item) => item.prescription_type === "antimicrobiano")
      ? "Receita de Antimicrobiano"
      : "Receita Simples";

  return (
    <main className="min-h-screen bg-slate-100 px-2 py-4 sm:px-4 sm:py-8">
      <div className="mx-auto mb-4 flex w-full max-w-[794px] items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <ShieldCheck size={18} />
          Documento emitido pela Clínica Veterinária Pet Maia
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-[#8A0EEA] px-4 py-2 text-sm font-medium text-white"
        >
          <Printer size={17} />
          Imprimir
        </button>
      </div>

      <article className="receipt-print-area mx-auto min-h-[1050px] w-full max-w-[794px] bg-white p-5 text-slate-900 shadow-sm sm:p-10 print:shadow-none">
        <header>
          <div className="flex items-start justify-between gap-6">
            <div>
              <BrandLogo className="max-w-[190px]" />
              <p className="mt-3 text-xs font-semibold text-[#8A0EEA]">
                {clinic?.name || "Clínica Veterinária Pet Maia"}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                CRMV {professional.crmv || "não informado"}
                {professional.crmv_state ? ` ${professional.crmv_state}` : ""}
              </p>
            </div>
            <div className="text-right text-[10px] leading-5 text-slate-500">
              <p>{clinic?.city || ""}</p>
              <p>{clinic?.phone || ""}</p>
            </div>
          </div>
          <div className="mt-5 h-0.5 bg-[#8A0EEA]" />
          <h1 className="mt-4 text-xs font-bold">{documentTitle}</h1>
        </header>

        <section className="mt-4 space-y-3 text-center text-[10px] sm:text-xs">
          <div className="rounded-lg border border-slate-700 px-4 py-3">
            <h2 className="font-bold uppercase">Animal</h2>
            <p className="mt-2">
              ID: {pet.id} · {pet.name} · {pet.species || "Não informado"} ·{" "}
              {pet.breed || "Raça não informada"}
            </p>
            <p>
              {pet.sex || "Sexo não informado"} ·{" "}
              {pet.age || "Idade não informada"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 px-4 py-3">
            <h2 className="font-bold uppercase">Responsável</h2>
            <p className="mt-2">{pet.tutor_name || "Não informado"}</p>
            <p>{pet.tutor_address || "Endereço não informado"}</p>
          </div>
        </section>

        <section className="mt-8 space-y-10">
          {items.map((item, index) => (
            <div
              key={`${item.medication}-${index}`}
              className="break-inside-avoid"
            >
              <p className="text-[10px] font-bold uppercase">
                {item.administration_route
                  ? `Uso ${item.administration_route}`
                  : "Uso veterinário"}
              </p>
              <div className="mt-2 flex items-end gap-2 text-xs font-bold uppercase sm:text-sm">
                <span>{index + 1}.</span>
                <span>{item.medication}</span>
                <span className="mb-1 min-w-6 flex-1 border-b border-dotted border-slate-400" />
                {item.quantity != null && item.quantity_unit && (
                  <span className="border px-2 py-0.5 text-[9px] font-medium">
                    {item.quantity} {item.quantity_unit}
                  </span>
                )}
              </div>
              {item.components?.length ? (
                <div className="mt-2 pl-5 text-[10px] leading-5 sm:text-xs">
                  {item.components.map((component, componentIndex) => (
                    <p key={`${component.name}-${componentIndex}`}>
                      {component.name} {component.concentration}{" "}
                      {component.unit}
                    </p>
                  ))}
                </div>
              ) : item.composition ? (
                <p className="mt-2 pl-5 text-[10px] whitespace-pre-wrap sm:text-xs">
                  {item.composition}
                </p>
              ) : null}
              <p className="mt-2 pl-5 text-[9px] text-slate-500 sm:text-[10px]">
                {pharmacyLabels[item.pharmacy_type || ""] || ""}
                {item.pharmaceutical_form
                  ? ` · ${item.pharmaceutical_form}`
                  : ""}
              </p>
              <p className="mt-3 pl-5 text-[10px] leading-5 font-medium uppercase sm:text-xs">
                {[item.dosage, item.frequency, item.duration, item.instructions]
                  .filter(Boolean)
                  .join(". ")}
                .
              </p>
            </div>
          ))}
        </section>

        {document.general_instructions && (
          <section className="mt-10 break-inside-avoid">
            <h2 className="border-b border-slate-400 pb-2 text-[10px] font-bold uppercase sm:text-xs">
              Instruções gerais do tratamento
            </h2>
            <p className="mt-3 text-[10px] leading-5 whitespace-pre-wrap uppercase sm:text-xs">
              {document.general_instructions}
            </p>
          </section>
        )}

        <footer className="mt-20 break-inside-avoid text-center">
          <p className="text-xs">{formatDate(document.issue_date)}</p>
          <div className="mx-auto mt-14 max-w-sm border-t pt-3">
            <p className="text-xs text-slate-500">Assinado eletronicamente</p>
            <p className="mt-1 text-sm font-bold">
              {professional.signature_text || professional.name}
            </p>
            <p className="text-xs">
              CRMV {professional.crmv || "não informado"}
              {professional.crmv_state ? ` ${professional.crmv_state}` : ""}
            </p>
            {professional.mapa_registration && (
              <p className="text-xs">MAPA {professional.mapa_registration}</p>
            )}
          </div>
        </footer>
      </article>
    </main>
  );
}
