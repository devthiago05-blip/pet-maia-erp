"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewServiceInput, Service } from "@/types/domain";

interface ServiceModalProps {
  service?: Service | null;
  triggerLabel: string;
  title: string;
  onSave: (service: NewServiceInput | Service) => void;
}

export function ServiceModal({
  service,
  triggerLabel,
  title,
  onSave,
}: ServiceModalProps) {
  const [open, setOpen] = useState(Boolean(service));
  const [nome, setNome] = useState(service?.nome || "");
  const [precoPequeno, setPrecoPequeno] = useState(
    String(service?.preco_pequeno || ""),
  );
  const [precoMedio, setPrecoMedio] = useState(
    String(service?.preco_medio || ""),
  );
  const [precoGrande, setPrecoGrande] = useState(
    String(service?.preco_grande || ""),
  );

  function resetForm() {
    if (service) {
      return;
    }

    setNome("");
    setPrecoPequeno("");
    setPrecoMedio("");
    setPrecoGrande("");
  }

  function handleSave() {
    const precoPequenoNumber = Number(precoPequeno);
    const precoMedioNumber = Number(precoMedio);
    const precoGrandeNumber = Number(precoGrande);

    if (!nome.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }

    if (
      !Number.isFinite(precoPequenoNumber) ||
      !Number.isFinite(precoMedioNumber) ||
      !Number.isFinite(precoGrandeNumber)
    ) {
      toast.error("Informe preços válidos");
      return;
    }

    onSave({
      ...(service ? { id: service.id } : {}),
      nome,
      preco_pequeno: precoPequenoNumber,
      preco_medio: precoMedioNumber,
      preco_grande: precoGrandeNumber,
    } as NewServiceInput | Service);

    setOpen(false);
    resetForm();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          service
            ? "text-blue-600"
            : "w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        }
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-xl font-bold">{title}</h2>

            <div className="space-y-4">
              <input
                placeholder="Nome do serviço"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço pequeno"
                value={precoPequeno}
                onChange={(event) => setPrecoPequeno(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço médio"
                value={precoMedio}
                onChange={(event) => setPrecoMedio(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Preço grande"
                value={precoGrande}
                onChange={(event) => setPrecoGrande(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border py-2 sm:flex-1"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white sm:flex-1"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
