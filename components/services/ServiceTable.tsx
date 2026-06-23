"use client";

import { useState } from "react";

import { ServiceModal } from "@/components/services/ServiceModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency } from "@/lib/formatters";
import type { Service } from "@/types/domain";

interface ServiceTableProps {
  services: Service[];
  onDelete: (id: number) => void;
  onUpdate: (service: Service) => void;
}

export function ServiceTable({
  services,
  onDelete,
  onUpdate,
}: ServiceTableProps) {
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  function handleConfirmDelete() {
    if (!serviceToDelete) {
      return;
    }

    onDelete(serviceToDelete.id);
    setServiceToDelete(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Serviço</th>
                <th className="p-3 text-left sm:p-4">Pequeno</th>
                <th className="p-3 text-left sm:p-4">Médio</th>
                <th className="p-3 text-left sm:p-4">Grande</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-wrap gap-3">
                        <ServiceModal
                          service={service}
                          triggerLabel="Editar"
                          title="Editar Serviço"
                          onSave={(updatedService) =>
                            onUpdate(updatedService as Service)
                          }
                        />

                        <button
                          type="button"
                          onClick={() => setServiceToDelete(service)}
                          className="text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(serviceToDelete)}
        title="Excluir serviço"
        description={`Deseja excluir ${serviceToDelete?.nome}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setServiceToDelete(null)}
      />
    </>
  );
}
