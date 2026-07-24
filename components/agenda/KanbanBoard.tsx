"use client";

import { useMemo, useState } from "react";

import { AppointmentCard } from "@/components/agenda/AppointmentCard";
import type { Appointment } from "@/types/domain";

interface KanbanBoardProps {
  appointments: Appointment[];
  onFinish: (appointment: Appointment) => void;
  onViewReceipt: (appointment: Appointment) => void;
  onConfirm: (appointment: Appointment) => void;
  onCancel: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (appointment: Appointment) => void;
  onReschedule: (id: number, hora: string) => void;
}

const dayStartHour = 7;
const dayEndHour = 20;
const slotIntervalMinutes = 30;

function formatTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hours * 60 + minutes;
}

function createTimeSlots(appointments: Appointment[]) {
  const slots = new Set<string>();

  for (
    let minutes = dayStartHour * 60;
    minutes <= dayEndHour * 60;
    minutes += slotIntervalMinutes
  ) {
    slots.add(formatTime(minutes));
  }

  appointments.forEach((appointment) => {
    if (appointment.hora) {
      slots.add(appointment.hora.slice(0, 5));
    }
  });

  return Array.from(slots).sort((first, second) => {
    return timeToMinutes(first) - timeToMinutes(second);
  });
}

function getStatusClasses(status: Appointment["status"]) {
  if (status === "Finalizado") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Cancelado") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Pendente") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

export function KanbanBoard({
  appointments,
  onFinish,
  onViewReceipt,
  onConfirm,
  onCancel,
  onDelete,
  onEdit,
  onReschedule,
}: KanbanBoardProps) {
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<
    number | null
  >(null);
  const [activeSlot, setActiveSlot] = useState("");

  const timeSlots = useMemo(
    () => createTimeSlots(appointments),
    [appointments],
  );

  const appointmentsByTime = useMemo(() => {
    return appointments.reduce<Record<string, Appointment[]>>(
      (groupedAppointments, appointment) => {
        const time = appointment.hora.slice(0, 5);

        if (!groupedAppointments[time]) {
          groupedAppointments[time] = [];
        }

        groupedAppointments[time].push(appointment);

        return groupedAppointments;
      },
      {},
    );
  }, [appointments]);

  const statusTotals = useMemo(() => {
    return appointments.reduce(
      (totals, appointment) => {
        totals[appointment.status] += 1;
        return totals;
      },
      {
        Pendente: 0,
        Agendado: 0,
        Finalizado: 0,
        Cancelado: 0,
      },
    );
  }, [appointments]);

  function handleDrop(time: string) {
    const appointment = appointments.find(
      (currentAppointment) => currentAppointment.id === draggedAppointmentId,
    );

    setActiveSlot("");
    setDraggedAppointmentId(null);

    if (!appointment || appointment.hora.slice(0, 5) === time) {
      return;
    }

    onReschedule(appointment.id, time);
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum agendamento encontrado para este dia.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(statusTotals).map(([status, total]) => (
          <div
            key={status}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
          >
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                status as Appointment["status"],
              )}`}
            >
              {status}
            </span>

            <strong className="text-2xl text-slate-800">{total}</strong>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="pb-24 md:max-h-[72vh] md:overflow-y-auto md:pb-0">
          {timeSlots.map((time) => {
            const appointmentsInSlot = (appointmentsByTime[time] || []).sort(
              (first, second) => first.id - second.id,
            );
            const isActiveSlot = activeSlot === time;

            return (
              <div
                key={time}
                onDragOver={(event) => {
                  event.preventDefault();
                  setActiveSlot(time);
                }}
                onDragLeave={() => setActiveSlot("")}
                onDrop={() => handleDrop(time)}
                className={`grid min-h-[104px] grid-cols-[76px_1fr] border-b border-slate-100 transition last:border-b-0 sm:grid-cols-[96px_1fr] ${
                  isActiveSlot ? "bg-purple-50" : "bg-white"
                }`}
              >
                <div className="border-r border-slate-100 bg-slate-50 p-3 text-sm font-bold text-slate-700 sm:p-4">
                  {time}
                </div>

                <div className="min-w-0 p-3 sm:p-4">
                  {appointmentsInSlot.length > 0 ? (
                    <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                      {appointmentsInSlot.map((appointment) => {
                        const canDrag =
                          appointment.status === "Pendente" ||
                          appointment.status === "Agendado";

                        return (
                          <div
                            key={appointment.id}
                            draggable={canDrag}
                            onDragStart={() =>
                              setDraggedAppointmentId(appointment.id)
                            }
                            onDragEnd={() => {
                              setDraggedAppointmentId(null);
                              setActiveSlot("");
                            }}
                            className={
                              canDrag
                                ? "cursor-grab active:cursor-grabbing"
                                : ""
                            }
                            title={
                              canDrag
                                ? "Arraste para outro horario"
                                : "Edite o agendamento para alterar este horario"
                            }
                          >
                            <AppointmentCard
                              appointment={appointment}
                              onFinish={onFinish}
                              onViewReceipt={onViewReceipt}
                              onConfirm={onConfirm}
                              onCancel={onCancel}
                              onDelete={onDelete}
                              onEdit={onEdit}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex min-h-16 items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-sm text-slate-400">
                      Solte um agendamento aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
