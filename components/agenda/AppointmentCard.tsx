import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { buildAppointmentObservation } from "@/lib/appointment-observation";
import type { Appointment } from "@/types/domain";

interface AppointmentCardProps {
  appointment: Appointment;
  onFinish: (appointment: Appointment) => void;
  onViewReceipt: (appointment: Appointment) => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (appointment: Appointment) => void;
}

export function AppointmentCard({
  appointment,
  onFinish,
  onViewReceipt,
  onConfirm,
  onCancel,
  onDelete,
  onEdit,
}: AppointmentCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const petName = appointment.pets?.nome || "Pet nao informado";
  const tutorName = appointment.pets?.tutors?.nome || "Tutor nao informado";
  const observation = buildAppointmentObservation(appointment);

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-[#8A0EEA]/10 px-3 py-1 text-sm font-semibold text-[#8A0EEA]">
            {appointment.hora}
          </span>

          <span className="text-xs text-slate-400">{appointment.data}</span>
        </div>

        <div className="space-y-1">
          <h3 className="truncate text-base font-bold text-slate-800">
            {petName}
          </h3>

          <p className="truncate text-sm text-slate-500">{tutorName}</p>

          <p className="truncate text-sm font-medium text-slate-700">
            {appointment.servico}
          </p>

          {observation && (
            <p className="line-clamp-3 whitespace-pre-line rounded-xl bg-slate-50 p-2 text-xs text-slate-500">
              {observation}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {appointment.status === "Pendente" && (
            <>
              <button
                type="button"
                onClick={() => onConfirm(appointment.id)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Confirmar
              </button>

              <button
                type="button"
                onClick={() => onEdit(appointment)}
                className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => onCancel(appointment.id)}
                className="rounded-xl bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
              >
                Cancelar
              </button>
            </>
          )}

          {appointment.status === "Agendado" && (
            <>
              <button
                type="button"
                onClick={() => onEdit(appointment)}
                className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => onFinish(appointment)}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Finalizar
              </button>

              <button
                type="button"
                onClick={() => onCancel(appointment.id)}
                className="rounded-xl bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100"
              >
                Cancelar
              </button>
            </>
          )}

          {appointment.status === "Finalizado" && (
            <button
              type="button"
              onClick={() => onViewReceipt(appointment)}
              className="rounded-xl bg-[#8A0EEA] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#7600d1]"
            >
              Ver recibo
            </button>
          )}

          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Excluir
          </button>
        </div>
      </article>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        title="Excluir agendamento"
        description={`Deseja excluir o agendamento de ${petName}? Essa acao nao podera ser desfeita.`}
        confirmText="Excluir"
        onCancel={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          onDelete(appointment.id);
          setDeleteDialogOpen(false);
        }}
      />
    </>
  );
}
