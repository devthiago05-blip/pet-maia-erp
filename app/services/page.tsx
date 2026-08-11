"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { GroomingPlanModal } from "@/components/services/GroomingPlanModal";
import { GroomingPlanTable } from "@/components/services/GroomingPlanTable";
import { ServiceModal } from "@/components/services/ServiceModal";
import { ServiceTable } from "@/components/services/ServiceTable";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import {
  createGroomingPlan,
  createService,
  deleteGroomingPlan,
  deleteService,
  fetchGroomingPlans,
  fetchServices,
  updateGroomingPlan,
  updateService,
} from "@/services/services";
import type {
  GroomingPlan,
  NewGroomingPlanInput,
  NewServiceInput,
  Service,
} from "@/types/domain";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [plans, setPlans] = useState<GroomingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadServices() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await fetchServices();

    if (error) {
      console.error(error);
      setLoadError("Não foi possível carregar os serviços.");
      setServices([]);
      setLoading(false);
      return;
    }

    setServices(data || []);
    setLoading(false);
  }

  async function loadPlans() {
    const { data, error } = await fetchGroomingPlans();

    if (error) {
      console.error(error);
      setLoadError("Não foi possível carregar os planos.");
      setPlans([]);
      return;
    }

    setPlans(data || []);
  }

  useMountEffect(() => {
    loadServices();
    loadPlans();
  });

  async function handleCreateService(newService: NewServiceInput) {
    const { error } = await createService(newService);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar serviço");
      return;
    }

    await loadServices();
    toast.success("Serviço salvo com sucesso!");
  }

  async function handleUpdateService(service: Service) {
    const { error } = await updateService(service);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar serviço");
      return;
    }

    await loadServices();
    toast.success("Serviço atualizado com sucesso!");
  }

  async function handleDeleteService(id: number) {
    const { error } = await deleteService(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir serviço");
      return;
    }

    setServices((currentServices) =>
      currentServices.filter((service) => service.id !== id),
    );
    toast.success("Serviço excluído com sucesso!");
  }

  async function handleCreatePlan(newPlan: NewGroomingPlanInput) {
    const { error } = await createGroomingPlan(newPlan);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar plano");
      return;
    }

    await loadPlans();
    toast.success("Plano salvo com sucesso!");
  }

  async function handleUpdatePlan(plan: GroomingPlan) {
    const { error } = await updateGroomingPlan(plan);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar plano");
      return;
    }

    await loadPlans();
    toast.success("Plano atualizado com sucesso!");
  }

  async function handleDeletePlan(id: number) {
    const { error } = await deleteGroomingPlan(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir plano");
      return;
    }

    setPlans((currentPlans) => currentPlans.filter((plan) => plan.id !== id));
    toast.success("Plano excluído com sucesso!");
  }

  function handlePrintServices() {
    window.print();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Serviços
              </h1>
              <p className="text-slate-500">
                Gerencie serviços e preços por porte
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handlePrintServices}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50"
              >
                <Printer size={18} />
                Imprimir
              </button>

              <Link
                href="/services/insumos"
                className="inline-flex items-center justify-center rounded-xl border border-[#8A0EEA]/20 bg-purple-50 px-4 py-2 font-medium text-[#8A0EEA] hover:bg-purple-100"
              >
                Insumos do banho e tosa
              </Link>

              <ServiceModal
                triggerLabel="Novo Serviço"
                title="Novo Serviço"
                onSave={(service) => handleCreateService(service)}
              />
            </div>
          </div>

          {loadError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
              Carregando serviços...
            </div>
          ) : (
            <>
              <ServiceTable
                services={services}
                onUpdate={handleUpdateService}
                onDelete={handleDeleteService}
              />

              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Planos mensais
                    </h2>
                    <p className="text-sm text-slate-500">
                      Configure valor, quantidade de banhos e benefícios grátis
                      do mês.
                    </p>
                  </div>

                  <GroomingPlanModal
                    triggerLabel="Novo plano"
                    title="Novo plano mensal"
                    onSave={(plan) =>
                      handleCreatePlan(plan as NewGroomingPlanInput)
                    }
                  />
                </div>

                <GroomingPlanTable
                  plans={plans}
                  onUpdate={handleUpdatePlan}
                  onDelete={handleDeletePlan}
                />
              </section>
            </>
          )}
        </div>

        <ServicesPrintView services={services} plans={plans} />
      </main>
    </div>
  );
}

function ServicesPrintView({
  services,
  plans,
}: {
  services: Service[];
  plans: GroomingPlan[];
}) {
  const printedAt = new Date().toLocaleString("pt-BR");

  return (
    <section className="document-print-area hidden bg-white p-8 print:block">
      <div className="mb-6 border-b-2 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          PET MAIA ERP
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Serviços cadastrados
        </h1>
        <p className="mt-1 text-sm text-slate-500">Impresso em {printedAt}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Serviço</th>
            <th className="border p-2">Pequeno</th>
            <th className="border p-2">Médio</th>
            <th className="border p-2">Grande</th>
          </tr>
        </thead>
        <tbody>
          {services.length === 0 ? (
            <tr>
              <td className="border p-4 text-center" colSpan={4}>
                Nenhum serviço cadastrado.
              </td>
            </tr>
          ) : (
            services.map((service) => (
              <tr key={service.id}>
                <td className="border p-2">{service.nome}</td>
                <td className="border p-2">
                  {formatCurrency(service.preco_pequeno)}
                </td>
                <td className="border p-2">
                  {formatCurrency(service.preco_medio)}
                </td>
                <td className="border p-2">
                  {formatCurrency(service.preco_grande)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2 className="mb-3 mt-8 text-xl font-bold text-slate-900">
        Planos mensais
      </h2>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Plano</th>
            <th className="border p-2">Valor mensal</th>
            <th className="border p-2">Banhos/mês</th>
            <th className="border p-2">Benefícios grátis</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {plans.length === 0 ? (
            <tr>
              <td className="border p-4 text-center" colSpan={5}>
                Nenhum plano cadastrado.
              </td>
            </tr>
          ) : (
            plans.map((plan) => (
              <tr key={plan.id}>
                <td className="border p-2">{plan.name}</td>
                <td className="border p-2">
                  {formatCurrency(plan.monthly_price)}
                </td>
                <td className="border p-2">{plan.baths_per_month}</td>
                <td className="border p-2">
                  {plan.free_benefits?.join(", ") || "-"}
                </td>
                <td className="border p-2">
                  {plan.active ? "Ativo" : "Inativo"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
