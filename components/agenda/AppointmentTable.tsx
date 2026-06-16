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
}

export function AppointmentTable({
  appointments,
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
                  {appointment.status}
                </td>
              </tr>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}