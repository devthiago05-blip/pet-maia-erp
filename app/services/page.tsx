"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency } from "@/lib/formatters";
import { fetchServices } from "@/services/services";
import type { Service } from "@/types/domain";

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

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="p-4 sm:p-6 lg:p-8">
          <h1 className="mb-6 text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
            Serviços
          </h1>

          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
              Carregando serviços...
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-white">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left sm:p-4">Serviço</th>
                      <th className="p-3 text-left sm:p-4">Pequeno</th>
                      <th className="p-3 text-left sm:p-4">Médio</th>
                      <th className="p-3 text-left sm:p-4">Grande</th>
                    </tr>
                  </thead>

                  <tbody>
                    {services.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-6 text-center text-sm text-slate-500"
                        >
                          Nenhum serviço cadastrado.
                        </td>
                      </tr>
                    ) : (
                      services.map((service) => (
                        <tr key={service.id} className="border-t">
                          <td className="p-3 sm:p-4">{service.nome}</td>
                          <td className="p-3 sm:p-4">
                            {formatCurrency(service.preco_pequeno)}
                          </td>
                          <td className="p-3 sm:p-4">
                            {formatCurrency(service.preco_medio)}
                          </td>
                          <td className="p-3 sm:p-4">
                            {formatCurrency(service.preco_grande)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
