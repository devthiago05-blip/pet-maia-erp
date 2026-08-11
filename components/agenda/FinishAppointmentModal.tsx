"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  CompletedAppointmentService,
  GroomingPlanSubscription,
  Service,
} from "@/types/domain";

interface FinishAppointmentModalProps {
  pet: string;
  porte?: string;
  servico: string;
  services: Service[];
  previousServicePrices?: Record<string, number>;
  planSubscription?: GroomingPlanSubscription | null;
  onClose: () => void;
  onSave: (dados: {
    valor: number;
    formaPagamento: string;
    servicoDescricao: string;
    observacoes?: string;
    services: CompletedAppointmentService[];
    planUsage?: {
      subscriptionId: number;
      benefitNames: string[];
      useBath: boolean;
    };
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

function getSuggestedServicePrice(
  service: Service,
  porte: string | undefined,
  previousServicePrices: Record<string, number>,
) {
  const previousPrice = previousServicePrices[normalizeText(service.nome)];

  if (Number.isFinite(previousPrice) && previousPrice > 0) {
    return previousPrice;
  }

  return getServicePriceByPetSize(service, porte);
}

function getCurrentMonthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const toDateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

  return {
    end: toDateString(end),
    label: start.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    }),
    start: toDateString(start),
  };
}

function getPlanMonthlyUsages(subscription?: GroomingPlanSubscription | null) {
  if (!subscription) {
    return [];
  }

  const range = getCurrentMonthRange();

  return (subscription.grooming_plan_usage || []).filter((usage) => {
    return usage.usage_date >= range.start && usage.usage_date <= range.end;
  });
}

function getPlanSummary(subscription?: GroomingPlanSubscription | null) {
  const monthlyUsages = getPlanMonthlyUsages(subscription);
  const bathsUsed = monthlyUsages
    .filter((usage) => usage.usage_type === "Banho")
    .reduce((total, usage) => total + Number(usage.quantity || 0), 0);
  const benefitsUsed = monthlyUsages
    .filter((usage) => usage.usage_type === "Benefício")
    .reduce((total, usage) => total + Number(usage.quantity || 0), 0);
  const bathsTotal = Number(subscription?.baths_per_month || 0);
  const benefitsTotal = subscription?.free_benefits?.length || 0;

  return {
    bathsRemaining: Math.max(bathsTotal - bathsUsed, 0),
    bathsTotal,
    bathsUsed,
    benefitsRemaining: Math.max(benefitsTotal - benefitsUsed, 0),
    benefitsTotal,
    benefitsUsed,
  };
}

function normalizeBenefitForMatch(value: string) {
  return normalizeText(value).replace(/^\d+\s*/, "").trim();
}

function isBathService(service: Service) {
  return normalizeText(service.nome).includes("banho");
}

function serviceMatchesBenefit(service: Service, benefit: string) {
  const serviceName = normalizeText(service.nome);
  const benefitName = normalizeBenefitForMatch(benefit);

  return (
    Boolean(serviceName && benefitName) &&
    (serviceName.includes(benefitName) || benefitName.includes(serviceName))
  );
}

function isServiceCoveredByPlan(
  service: Service,
  usePlan: boolean,
  selectedPlanBenefits: string[],
) {
  if (!usePlan) {
    return false;
  }

  return (
    isBathService(service) ||
    selectedPlanBenefits.some((benefit) => serviceMatchesBenefit(service, benefit))
  );
}

export function FinishAppointmentModal({
  pet,
  porte,
  servico,
  services,
  previousServicePrices = {},
  planSubscription,
  onClose,
  onSave,
}: FinishAppointmentModalProps) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [servicePrices, setServicePrices] = useState<Record<number, string>>(
    {},
  );
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [usePlan, setUsePlan] = useState(false);
  const [selectedPlanBenefits, setSelectedPlanBenefits] = useState<string[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const isGiftPayment = formaPagamento === "Brinde";
  const planSummary = useMemo(
    () => getPlanSummary(planSubscription),
    [planSubscription],
  );
  const hasBathBalance = planSummary.bathsRemaining > 0;
  const currentMonth = getCurrentMonthRange();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const scheduledServiceNames = new Set(
        servico
          .split("+")
          .map((serviceName) => normalizeText(serviceName))
          .filter(Boolean),
      );

      const initialSelectedIds = services
        .filter((service) =>
          scheduledServiceNames.has(normalizeText(service.nome)),
        )
        .map((service) => service.id);
      const initialSelectedServices = services.filter((service) =>
        initialSelectedIds.includes(service.id),
      );

      const initialPrices = services.reduce<Record<number, string>>(
        (prices, service) => {
          prices[service.id] = String(
            getSuggestedServicePrice(service, porte, previousServicePrices),
          );
          return prices;
        },
        {},
      );

      setSelectedServiceIds(initialSelectedIds);
      setServicePrices(initialPrices);
      setUsePlan(Boolean(planSubscription && hasBathBalance));
      setSelectedPlanBenefits(
        planSubscription?.free_benefits?.filter((benefit) =>
          initialSelectedServices.some((service) =>
            serviceMatchesBenefit(service, benefit),
          ),
        ) || [],
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [services, servico, porte, previousServicePrices, planSubscription, hasBathBalance]);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [selectedServiceIds, services],
  );

  const servicesTotal = useMemo(
    () =>
      selectedServices.reduce((sum, service) => {
        if (isServiceCoveredByPlan(service, usePlan, selectedPlanBenefits)) {
          return sum;
        }

        const customPrice = Number(servicePrices[service.id] || 0);
        return sum + customPrice;
      }, 0),
    [selectedServices, servicePrices, usePlan, selectedPlanBenefits],
  );
  const total = isGiftPayment ? 0 : servicesTotal;
  const isPlanPayment = usePlan && total === 0 && !isGiftPayment;
  const usesPlanBath = usePlan && selectedServices.some(isBathService);

  const hasValidSize = ["pequeno", "medio", "grande"].includes(
    normalizeText(porte || ""),
  );

  function handleToggleService(service: Service) {
    setSelectedServiceIds((currentIds) => {
      if (currentIds.includes(service.id)) {
        return currentIds.filter((id) => id !== service.id);
      }

      setServicePrices((currentPrices) => ({
        ...currentPrices,
        [service.id]:
          currentPrices[service.id] ??
          String(
            getSuggestedServicePrice(service, porte, previousServicePrices),
          ),
      }));

      return [...currentIds, service.id];
    });
  }

  function handleServicePriceChange(serviceId: number, value: string) {
    setServicePrices((currentPrices) => ({
      ...currentPrices,
      [serviceId]: value,
    }));
  }

  function handleTogglePlanBenefit(benefit: string) {
    setSelectedPlanBenefits((currentBenefits) => {
      if (currentBenefits.includes(benefit)) {
        return currentBenefits.filter((currentBenefit) => currentBenefit !== benefit);
      }

      return [...currentBenefits, benefit];
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

    const hasInvalidPrice =
      !isGiftPayment &&
      selectedServices.some((service) => {
        if (isServiceCoveredByPlan(service, usePlan, selectedPlanBenefits)) {
          return false;
        }

        const price = Number(servicePrices[service.id]);
        return (
          !servicePrices[service.id]?.trim() ||
          !Number.isFinite(price) ||
          price < 0
        );
      });

    if (hasInvalidPrice) {
      toast.error("Informe valores válidos para os serviços selecionados");
      return;
    }

    if (!isGiftPayment && !isPlanPayment && total <= 0) {
      toast.error("O valor total precisa ser maior que zero");
      return;
    }

    const completedServices = selectedServices.map((service) => ({
      serviceName: service.nome,
      price:
        isGiftPayment ||
        isServiceCoveredByPlan(service, usePlan, selectedPlanBenefits)
          ? 0
          : Number(servicePrices[service.id] || 0),
    }));

    const servicoDescricao = completedServices
      .map((service) => service.serviceName)
      .join(" + ");
    const finalPaymentMethod = isPlanPayment ? "Plano mensal" : formaPagamento;
    const planObservation =
      usePlan && planSubscription
        ? [
            `Plano mensal usado: ${planSubscription.grooming_plans?.name || "Plano"}`,
            selectedPlanBenefits.length > 0
              ? `Benefícios: ${selectedPlanBenefits.join(", ")}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ")
        : "";
    const finalObservations = [observacoes.trim(), planObservation]
      .filter(Boolean)
      .join("\n");

    setSaving(true);

    await onSave({
      valor: total,
      formaPagamento: finalPaymentMethod,
      servicoDescricao,
      observacoes: finalObservations || undefined,
      services: completedServices,
      planUsage:
        usePlan && planSubscription && (usesPlanBath || selectedPlanBenefits.length > 0)
          ? {
              subscriptionId: planSubscription.id,
              benefitNames: selectedPlanBenefits,
              useBath: usesPlanBath,
            }
          : undefined,
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

          {Object.keys(previousServicePrices).length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Valor sugerido pelo último atendimento deste pet. Você pode
              alterar antes de finalizar.
            </div>
          )}

          {planSubscription && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-bold text-emerald-900">
                    Plano ativo:{" "}
                    {planSubscription.grooming_plans?.name || "Plano mensal"}
                  </h3>
                  <p className="mt-1 text-sm text-emerald-800">
                    {currentMonth.label}: {planSummary.bathsUsed}/
                    {planSummary.bathsTotal} banho(s) usados · restam{" "}
                    {planSummary.bathsRemaining}. Benefícios:{" "}
                    {planSummary.benefitsUsed}/{planSummary.benefitsTotal}{" "}
                    usados · restam {planSummary.benefitsRemaining}.
                  </p>
                </div>

                <label className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-800">
                  <input
                    type="checkbox"
                    checked={usePlan}
                    disabled={!hasBathBalance}
                    onChange={(event) => setUsePlan(event.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Usar plano mensal
                </label>
              </div>

              {!hasBathBalance && (
                <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Este plano não tem saldo de banho disponível neste mês.
                </div>
              )}

              {usePlan && planSubscription.free_benefits?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-emerald-900">
                    Benefícios gratuitos usados neste atendimento
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {planSubscription.free_benefits.map((benefit) => (
                      <label
                        key={benefit}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold ${
                          selectedPlanBenefits.includes(benefit)
                            ? "border-emerald-500 bg-white text-emerald-800"
                            : "border-emerald-200 bg-emerald-100/70 text-emerald-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlanBenefits.includes(benefit)}
                          onChange={() => handleTogglePlanBenefit(benefit)}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        {benefit}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {!hasValidSize && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
              O pet precisa ter porte Pequeno, Médio ou Grande cadastrado para o
              sistema calcular o valor automaticamente.
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3">
              <h3 className="font-bold text-slate-800">Serviços realizados</h3>

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
                  const checked = selectedServiceIds.includes(service.id);
                  const coveredByPlan = isServiceCoveredByPlan(
                    service,
                    usePlan,
                    selectedPlanBenefits,
                  );

                  return (
                    <div
                      key={service.id}
                      className={`flex flex-col gap-3 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:justify-between ${
                        checked
                          ? "border-[#8A0EEA] bg-[#8A0EEA]/5"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleService(service)}
                          className="mt-1 h-4 w-4 accent-[#8A0EEA]"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {service.nome}
                          </p>

                          {coveredByPlan && (
                            <p className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              Coberto pelo plano
                            </p>
                          )}

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

                      <label className="grid w-full gap-1 text-sm font-medium text-slate-700 sm:w-40">
                        Valor cobrado
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            isGiftPayment || coveredByPlan
                              ? "0"
                              : servicePrices[service.id] || ""
                          }
                          onChange={(event) =>
                            handleServicePriceChange(
                              service.id,
                              event.target.value,
                            )
                          }
                          disabled={!checked || isGiftPayment || coveredByPlan}
                          className="w-full rounded-xl border p-3 font-normal disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </label>
                    </div>
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
              <option>Brinde</option>
            </select>
          </label>

          {isGiftPayment && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Brinde selecionado: o atendimento será finalizado com valor R$
              0,00 e não ficará pendente para receber.
            </div>
          )}

          {isPlanPayment && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Plano mensal selecionado: o atendimento será finalizado com
              valor R$ 0,00, o uso será abatido do plano e o financeiro ficará
              como pago.
            </div>
          )}

          {usePlan && !isPlanPayment && !isGiftPayment && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              O plano vai abater banho ou benefícios selecionados. O valor
              restante será lançado na forma de pagamento escolhida acima.
            </div>
          )}

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
