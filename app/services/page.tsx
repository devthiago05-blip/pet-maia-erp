"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { fetchServices } from "@/services/services";
import type { Service } from "@/types/domain";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  async function loadServices() {
    const { data, error } = await fetchServices();

    if (error) {
      console.error(error);
      return;
    }

    setServices(data || []);
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

          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[640px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left sm:p-4">Serviço</th>
                    <th className="p-3 text-left sm:p-4">Pequeno</th>
                    <th className="p-3 text-left sm:p-4">Médio</th>
                    <th className="p-3 text-left sm:p-4">Grande</th>
                  </tr>
                </thead>

                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-t">
                      <td className="p-3 sm:p-4">{service.nome}</td>
                      <td className="p-3 sm:p-4">R$ {service.preco_pequeno}</td>
                      <td className="p-3 sm:p-4">R$ {service.preco_medio}</td>
                      <td className="p-3 sm:p-4">R$ {service.preco_grande}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
