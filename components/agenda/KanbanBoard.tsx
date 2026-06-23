import { KanbanColumn } from "@/components/agenda/KanbanColumn";
import type { Appointment } from "@/types/domain";

interface KanbanBoardProps {
  appointments: Appointment[];
  onFinish: (appointment: Appointment) => void;
  onCancel: (id: number) => void;
}

export function KanbanBoard({
  appointments,
  onFinish,
  onCancel,
}: KanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[900px] gap-4">
        <KanbanColumn
          title="Agendados"
          status="Agendado"
          appointments={appointments}
          onFinish={onFinish}
          onCancel={onCancel}
        />

        <KanbanColumn
          title="Finalizados"
          status="Finalizado"
          appointments={appointments}
          onFinish={onFinish}
          onCancel={onCancel}
        />

        <KanbanColumn
          title="Cancelados"
          status="Cancelado"
          appointments={appointments}
          onFinish={onFinish}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}