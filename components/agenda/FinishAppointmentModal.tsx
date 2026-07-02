"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { Service } from "@/types/domain";

interface FinishAppointmentModalProps {
  pet: string;
  porte?: string;
  servico: string;
  services: Service[];
  onClose: () => void;
  onSave: (dados: {
    valor: number;
    formaPagamento: string;
    servicoDescricao: string;
    observacoes?: string;
  }) => Promise<void> | void;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getServicePriceByPetSize(service: Service, porte?: string) {
  const normalizedSize = normalizeText(porte || "");

  if (normalizedSize === "pequeno") {
    return Number(service.preco_pequeno || 0);
  }

  if (normalizedSize === "medio") {
    return Number(service.preco_medio || 0);
  }

  if (normalizedSize === "grande") {
    return Number(service.preco_grande || 0);
  }

  return 0;
}

export function FinishAppointmentModal({
  pet,
  porte,
  servico,
  services,
  onClose,
  onSave,
}: FinishAppointmentModalProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const scheduledServiceNames = new Set(
      servico
        .split("+")
        .map((serviceName) => normalizeText(serviceName))
        .filter(Boolean),
    );

    const initialSelectedIds = services
      .filter((service) => scheduledServiceNames.has(normalizeText(service.nome)))
      .map((service) => service.id);

    setSelectedServiceIds(initialSelectedIds);
  }, [services, servico]);

  const selectedServices = useMemo(
    () =>
      services.filter((service) =>
        selectedServiceIds.includes(service.id),
      ),
    [selectedServiceIds, services],
  );

  const total = useMemo(
    () =>
      selectedServices.reduce(
        (sum, service) => sum + getServicePriceByPetSize(service, porte),
        0,
      ),
    [porte, selectedServices],
  );

  const hasValidSize = ["pequeno", "medio", "grande"].includes(
    normalizeText(porte || ""),
  );

  function handleToggleService(serviceId: number) {
    setSelectedServiceIds((currentIds) => {
      if (currentIds.includes(serviceId)) {
        return currentIds.filter((id) => id !== serviceId);
      }

      return [...currentIds, serviceId];
    });
  }

  async function handleSave() {
    if (!hasValidSize) {
      toast.error("Informe o porte do pet para calcular os valores");
      return;
    }

    if (selectedServices.length === 0) {
      toast.error("Selecione pelo menos um serviço realizado");
      return;
    }

    if (total <= 0) {
      toast.error("O valor total precisa ser maior que zero");
      return;
    }

    const servicoDescricao = selectedServices
      .map((service) => service.nome)
      .join(" + ");

    setSaving(true);

    await onSave({
      valor: total,
      formaPagamento,
      servicoDescricao,
      observacoes: observacoes.trim() || undefined,
    });

    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-appointment-title"
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2
            id="finish-appointment-title"
            className="text-xl font-bold text-slate-900"
          >
            Finalizar atendimento
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Selecione os serviços realizados. Os valores serão calculados pelo
            porte do pet.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl bg-slate-100 p-3 text-sm sm:grid-cols-3">
            <p>
              <strong>Pet:</strong> {pet}
            </p>

            <p>
              <strong>Porte:</strong> {porte || "Não informado"}
            </p>

            <p>
              <strong>Serviço agendado:</strong> {servico}
            </p>
          </div>

          {!hasValidSize && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
              O pet precisa ter porte Pequeno, Médio ou Grande cadastrado para o
              sistema calcular o valor automaticamente.
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3">
              <h3 className="font-bold text-slate-800">
                Serviços realizados
              </h3>

              <p className="text-sm text-slate-500">
                Selecione os serviços cadastrados que foram realizados neste
                atendimento.
              </p>
            </div>

            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                  Nenhum serviço cadastrado encontrado
                </div>
              ) : (
                services.map((service) => {
                  const price = getServicePriceByPetSize(service, porte);
                  const checked = selectedServiceIds.includes(service.id);

                  return (
                    <label
                      key={service.id}
                      className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:justify-between ${
                        checked
                          ? "border-[#8A0EEA] bg-[#8A0EEA]/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleService(service.id)}
                          className="mt-1 h-4 w-4 accent-[#8A0EEA]"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {service.nome}
                          </p>

                          <p className="text-xs text-slate-500">
                            Pequeno:{" "}
                            {Number(service.preco_pequeno || 0).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}{" "}
                            · Médio:{" "}
                            {Number(service.preco_medio || 0).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}{" "}
                            · Grande:{" "}
                            {Number(service.preco_grande || 0).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <strong className="text-right text-[#8A0EEA]">
                        {price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Forma de pagamento
            <select
              value={formaPagamento}
              onChange={(event) => setFormaPagamento(event.target.value)}
              className="w-full rounded-xl border p-3 font-normal"
            >
              <option>PIX</option>
              <option>Dinheiro</option>
              <option>Cartão</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Observações
            <textarea
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              rows={3}
              placeholder="Exemplo: desconto aplicado, hidratação cortesia, pet sensível..."
              className="w-full resize-none rounded-xl border p-3 font-normal"
            />
          </label>

          <div className="rounded-2xl bg-[#8A0EEA]/10 p-4">
            <p className="text-sm font-medium text-[#8A0EEA]">Valor total</p>

            <p className="text-2xl font-bold text-[#8A0EEA]">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full rounded-xl border px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white transition hover:bg-[#7600d1] disabled:opacity-60 sm:w-auto"
            >
              {saving ? "Finalizando..." : "Finalizar atendimento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}