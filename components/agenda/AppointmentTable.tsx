interface Appointment {
  id: number;
  pet: string;
  servico: string;
  data: string;
  hora: string;
  status: string;
}

interface AppointmentTableProps {
  appointments: Appointment[];

  onDelete: (id: number) => void;

  onComplete: (id: number) => void;
}

export function AppointmentTable({
  appointments,
  onDelete,
  onComplete,
}: AppointmentTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

      <table className="w-full">

        <thead className="bg-slate-50">

          <tr>
            <th className="text-left p-4">
              Hora
            </th>

            <th className="text-left p-4">
              Pet
            </th>

            <th className="text-left p-4">
              Serviço
            </th>

            <th className="text-left p-4">
              Status
            </th>
            <th className="text-left p-4">
              Ações
            </th>
          </tr>

        </thead>

        <tbody>

          {appointments.map(
            (appointment) => (
              <tr
                key={appointment.id}
                className="border-t"
              >
                <td className="p-4">
                  {appointment.hora}
                </td>

                <td className="p-4">
                  {appointment.pet}
                </td>

                <td className="p-4">
                  {appointment.servico}
                </td>

                <td className="p-4">
  <span
    className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                <td className="p-4">
  <div className="flex gap-3">

    <button
      onClick={() =>
        onComplete(
          appointment.id
        )
      }
      className="text-green-600"
    >
      Concluir
    </button>

    <button
      onClick={() => {
        const confirmar =
          window.confirm(
            "Excluir agendamento?"
          );

        if (confirmar) {
          onDelete(
            appointment.id
          );
        }
      }}
      className="text-red-600"
    >
      Excluir
    </button>

  </div>
</td>
              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}