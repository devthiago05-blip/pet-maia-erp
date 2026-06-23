import type { Appointment } from "@/types/domain";

interface AppointmentCardProps {
  appointment: Appointment;
  onFinish: (appointment: Appointment) => void;
  onCancel: (id: number) => void;
}

export function AppointmentCard({
  appointment,
  onFinish,
  onCancel,
}: AppointmentCardProps) {
  const petName = appointment.pets?.nome || "Pet não informado";
  const tutorName = "Tutor não informado";

  return (
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
      </div>

      {appointment.status === "Agendado" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Cancelar
          </button>
        </div>
      )}
    </article>
  );
}
