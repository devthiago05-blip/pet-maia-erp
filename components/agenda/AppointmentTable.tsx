import type { Appointment } from "@/types/domain";

interface AppointmentTableProps {
  appointments: Appointment[];
  onDelete: (id: number) => void;
  onFinish: (appointment: Appointment) => void;
}

export function AppointmentTable({
  appointments,
  onDelete,
  onFinish,
}: AppointmentTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="w-full overflow-x-auto">
        <table className="min-w-[760px] w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left sm:p-4">Hora</th>
              <th className="p-3 text-left sm:p-4">Pet</th>
              <th className="p-3 text-left sm:p-4">Serviço</th>
              <th className="p-3 text-left sm:p-4">Status</th>
              <th className="p-3 text-left sm:p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id} className="border-t">
                <td className="p-3 sm:p-4">{appointment.hora}</td>
                <td className="p-3 sm:p-4">{appointment.pets?.nome || "-"}</td>
                <td className="p-3 sm:p-4">{appointment.servico}</td>
                <td className="p-3 sm:p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      appointment.status === "Concluído"
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
                    <button
                      onClick={() => onFinish(appointment)}
                      className="text-green-600"
                    >
                      Concluir
                    </button>

                    <button
                      onClick={() => {
                        const confirmar = window.confirm(
                          "Excluir agendamento?",
                        );

                        if (confirmar) {
                          onDelete(appointment.id);
                        }
                      }}
                      className="text-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
