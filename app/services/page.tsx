"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ServiceModal } from "@/components/services/ServiceModal";
import { ServiceTable } from "@/components/services/ServiceTable";
import { useMountEffect } from "@/hooks/useMountEffect";
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

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Serviços
              </h1>
              <p className="text-slate-500">
                Gerencie serviços e preços por porte
              </p>
            </div>

            <ServiceModal
              triggerLabel="Novo Serviço"
              title="Novo Serviço"
              onSave={(service) => handleCreateService(service)}
            />
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
      </main>
    </div>
  );
}
