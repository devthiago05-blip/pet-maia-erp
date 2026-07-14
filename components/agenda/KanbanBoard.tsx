import { KanbanColumn } from "@/components/agenda/KanbanColumn";
import type { Appointment } from "@/types/domain";

interface KanbanBoardProps {
  appointments: Appointment[];
  onFinish: (appointment: Appointment) => void;
  onViewReceipt: (appointment: Appointment) => void;
  onConfirm: (id: number) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (appointment: Appointment) => void;
}

export function KanbanBoard({
  appointments,
  onFinish,
  onViewReceipt,
  onConfirm,
  onCancel,
  onDelete,
  onEdit,
}: KanbanBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[1180px] gap-4">
        <KanbanColumn
          title="Pendentes"
          status="Pendente"
          appointments={appointments}
          onFinish={onFinish}
          onViewReceipt={onViewReceipt}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
          onEdit={onEdit}
        />

        <KanbanColumn
          title="Agendados"
          status="Agendado"
          appointments={appointments}
          onFinish={onFinish}
          onViewReceipt={onViewReceipt}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
          onEdit={onEdit}
        />

        <KanbanColumn
          title="Finalizados"
          status="Finalizado"
          appointments={appointments}
          onFinish={onFinish}
          onViewReceipt={onViewReceipt}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
          onEdit={onEdit}
        />

        <KanbanColumn
          title="Cancelados"
          status="Cancelado"
          appointments={appointments}
          onFinish={onFinish}
          onViewReceipt={onViewReceipt}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
