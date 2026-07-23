"use client";

import { Printer } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ServiceModal } from "@/components/services/ServiceModal";
import { ServiceTable } from "@/components/services/ServiceTable";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
} from "@/services/services";
import type { NewServiceInput, Service } from "@/types/domain";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
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

  useMountEffect(() => {
    loadServices();
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
            <ServiceTable
              services={services}
              onUpdate={handleUpdateService}
              onDelete={handleDeleteService}
            />
          )}
        </div>

        <ServicesPrintView services={services} />
      </main>
    </div>
  );
}

function ServicesPrintView({ services }: { services: Service[] }) {
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
    </section>
  );
}
