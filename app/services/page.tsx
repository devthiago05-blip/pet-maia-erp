"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function ServicesPage() {
console.log("PÁGINA SERVICES CARREGOU");

  const [services, setServices] =
    useState<any[]>([]);

async function loadServices() {

  console.log("ENTROU LOAD SERVICES");

  const response = await supabase
    .from("services")
    .select("*");

  console.log("RESPOSTA COMPLETA:");
  console.log(response);

  setServices(response.data || []);
}

useEffect(() => {
  loadServices();
}, []);

return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-slate-50 min-h-screen">
        <Header />

        <div className="p-8">

          <h1 className="text-3xl font-bold text-[#8A0EEA] mb-6">
            Serviços
          </h1>

          <div className="bg-white rounded-2xl border overflow-hidden">

            <table className="w-full">

              <thead className="bg-slate-50">

                <tr>
                  <th className="text-left p-4">
                    Serviço
                  </th>

                  <th className="text-left p-4">
                    Pequeno
                  </th>

                  <th className="text-left p-4">
                    Médio
                  </th>

                  <th className="text-left p-4">
                    Grande
                  </th>
                </tr>

              </thead>

              <tbody>

                {services.map(
                  (service) => (

                    <tr
                      key={service.id}
                      className="border-t"
                    >

                      <td className="p-4">
                        {service.nome}
                      </td>

                      <td className="p-4">
                        R$ {service.preco_pequeno}
                      </td>

                      <td className="p-4">
                        R$ {service.preco_medio}
                      </td>

                      <td className="p-4">
                        R$ {service.preco_grande}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  );
}