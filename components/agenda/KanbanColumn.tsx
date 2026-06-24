import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import type { Appointment, AppointmentStatus } from "@/types/domain";

interface KanbanColumnProps {
  title: string;
  status: AppointmentStatus;
  appointments: Appointment[];
  onFinish: (appointment: Appointment) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
}

export function KanbanColumn({
  title,
  status,
  appointments,
  onFinish,
  onCancel,
  onDelete,
}: KanbanColumnProps) {
  const filteredAppointments = appointments.filter(
    (appointment) => appointment.status === status,
  );

  return (
    <section className="min-w-[280px] flex-1 rounded-3xl border border-slate-200 bg-slate-100 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-slate-800">{title}</h2>

        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-600">
          {filteredAppointments.length}
        </span>
      </div>

      <div className="space-y-3">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onFinish={onFinish}
              onCancel={onCancel}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
            Nenhum agendamento
          </div>
        )}
      </div>
    </section>
  );
}
