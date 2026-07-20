"use client";

import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  formatAppointmentObservation,
  getAppointmentPetDisplayName,
} from "@/lib/appointment-observation";
import type { Appointment } from "@/types/domain";

interface AppointmentTableProps {
  appointments: Appointment[];
  onDelete: (id: number) => void;
  onFinish: (appointment: Appointment) => void;
  onViewReceipt: (appointment: Appointment) => void;
  onConfirm: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentTable({
  appointments,
  onDelete,
  onFinish,
  onViewReceipt,
  onConfirm,
  onEdit,
}: AppointmentTableProps) {
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);

  function renderActions(appointment: Appointment, mobile = false) {
    const buttonClass = mobile
      ? "inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold"
      : "text-sm font-medium";

    return (
      <div className={mobile ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-3"}>
        {appointment.status === "Pendente" && (
          <>
            <button
              type="button"
              onClick={() => onConfirm(appointment)}
              className={`${buttonClass} ${mobile ? "bg-emerald-50 text-emerald-700" : "text-green-600"}`}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className={`${buttonClass} ${mobile ? "bg-blue-50 text-blue-700" : "text-blue-600"}`}
            >
              Editar
            </button>
          </>
        )}

        {appointment.status === "Agendado" && (
          <>
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className={`${buttonClass} ${mobile ? "bg-blue-50 text-blue-700" : "text-blue-600"}`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => onFinish(appointment)}
              className={`${buttonClass} ${mobile ? "bg-emerald-50 text-emerald-700" : "text-green-600"}`}
            >
              Finalizar
            </button>
          </>
        )}

        {appointment.status === "Finalizado" && (
          <button
            type="button"
            onClick={() => onViewReceipt(appointment)}
            className={`${buttonClass} ${mobile ? "bg-purple-50 text-[#8A0EEA]" : "text-[#8A0EEA]"}`}
          >
            Ver recibo
          </button>
        )}

        <button
          type="button"
          onClick={() => setAppointmentToDelete(appointment)}
          className={`${buttonClass} ${mobile ? "bg-red-50 text-red-600" : "text-red-600"}`}
        >
          Excluir
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 md:hidden">
        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum agendamento encontrado.
          </div>
        ) : (
          appointments.map((appointment) => {
            const observation = formatAppointmentObservation(appointment);

            return (
              <article
                key={appointment.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-[#8A0EEA]">
                      {appointment.hora}
                    </p>
                    <h3 className="mt-1 truncate font-bold text-slate-900">
                      {getAppointmentPetDisplayName(appointment)}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      appointment.status === "Finalizado"
                        ? "bg-green-100 text-green-700"
                        : appointment.status === "Cancelado"
                          ? "bg-red-100 text-red-700"
                          : appointment.status === "Pendente"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>

                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  {appointment.servico}
                </p>

                {observation && observation !== "-" && (
                  <p className="mt-3 whitespace-pre-line text-sm text-slate-500">
                    {observation}
                  </p>
                )}

                <div className="mt-4 border-t border-slate-100 pt-3">
                  {renderActions(appointment, true)}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
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
                    {getAppointmentPetDisplayName(appointment)}
                  </td>

                  <td className="p-3 sm:p-4">{appointment.servico}</td>

                  <td className="max-w-72 whitespace-pre-line p-3 text-sm text-slate-500 sm:p-4">
                    {formatAppointmentObservation(appointment)}
                  </td>

                  <td className="p-3 sm:p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        appointment.status === "Finalizado"
                          ? "bg-green-100 text-green-700"
                          : appointment.status === "Cancelado"
                            ? "bg-red-100 text-red-700"
                            : appointment.status === "Pendente"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>

                  <td className="p-3 sm:p-4">
                    {renderActions(appointment)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(appointmentToDelete)}
        title="Excluir agendamento"
        description={`Deseja realmente excluir o agendamento de ${
          appointmentToDelete
            ? getAppointmentPetDisplayName(appointmentToDelete, "este pet")
            : "este pet"
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
