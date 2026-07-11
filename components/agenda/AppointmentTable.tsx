"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type { Appointment } from "@/types/domain";

interface AppointmentTableProps {
  appointments: Appointment[];
  onDelete: (id: number) => void;
  onFinish: (appointment: Appointment) => void;
  onViewReceipt: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentTable({
  appointments,
  onDelete,
  onFinish,
  onViewReceipt,
  onEdit,
}: AppointmentTableProps) {
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left sm:p-4">Hora</th>
              <th className="p-3 text-left sm:p-4">Pet</th>
              <th className="p-3 text-left sm:p-4">Serviço</th>
              <th className="p-3 text-left sm:p-4">Observação</th>
              <th className="p-3 text-left sm:p-4">Status</th>
              <th className="p-3 text-left sm:p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.id} className="border-t">
                  <td className="p-3 sm:p-4">{appointment.hora}</td>

                  <td className="p-3 sm:p-4">
                    {appointment.pets?.nome || "-"}
                  </td>

                  <td className="p-3 sm:p-4">{appointment.servico}</td>

                  <td className="max-w-72 p-3 text-sm text-slate-500 sm:p-4">
                    {appointment.observacao || "-"}
                  </td>

                  <td className="p-3 sm:p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        appointment.status === "Finalizado"
                          ? "bg-green-100 text-green-700"
                          : appointment.status === "Cancelado"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-3">
                      {appointment.status === "Agendado" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(appointment)}
                            className="text-blue-600"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onFinish(appointment)}
                            className="text-green-600"
                          >
                            Finalizar
                          </button>
                        </>
                      )}

                      {appointment.status === "Finalizado" && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(appointment)}
                          className="text-[#8A0EEA]"
                        >
                          Ver recibo
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAppointmentToDelete(appointment)}
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

      <ConfirmationDialog
        isOpen={Boolean(appointmentToDelete)}
        title="Excluir agendamento"
        description={`Deseja realmente excluir o agendamento de ${
          appointmentToDelete?.pets?.nome || "este pet"
        }? Essa ação não poderá ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onCancel={() => setAppointmentToDelete(null)}
        onConfirm={() => {
          if (!appointmentToDelete) {
            return;
          }

          onDelete(appointmentToDelete.id);
          setAppointmentToDelete(null);
        }}
      />
    </div>
  );
}
