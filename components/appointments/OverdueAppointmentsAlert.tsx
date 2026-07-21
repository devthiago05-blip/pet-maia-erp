"use client";

import { CalendarClock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import {
  deleteAppointment,
  rescheduleAppointment,
} from "@/services/appointments";
import { fetchOverdueOpenAppointments } from "@/services/dashboard";
import type { Appointment } from "@/types/domain";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export function OverdueAppointmentsAlert() {
  const { canAccess } = useAccess();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState(() =>
    formatDateInput(new Date()),
  );
  const [processing, setProcessing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const activeAppointment = appointments[0] || null;

  useEffect(() => {
    if (!canAccess("agenda")) {
      return;
    }

    let active = true;

    async function loadOverdueAppointments() {
      const { data, error } = await fetchOverdueOpenAppointments();

      if (!active) {
        return;
      }

      if (error) {
        console.error(error);
        return;
      }

      setAppointments(data || []);
    }

    loadOverdueAppointments();

    return () => {
      active = false;
    };
  }, [canAccess]);

  function removeAppointment(id: number) {
    setAppointments((current) => current.filter((item) => item.id !== id));
    setConfirmDelete(false);
    setRescheduleDate(formatDateInput(new Date()));
  }

  function handleReviewLater() {
    if (!activeAppointment) {
      return;
    }

    if (appointments.length > 1) {
      removeAppointment(activeAppointment.id);
      return;
    }

    setDismissed(true);
  }

  async function handleReschedule() {
    if (!activeAppointment) {
      return;
    }

    const today = formatDateInput(new Date());
    if (!rescheduleDate || rescheduleDate < today) {
      toast.error("Escolha uma data de hoje em diante");
      return;
    }

    setProcessing(true);
    const { error } = await rescheduleAppointment(
      activeAppointment.id,
      rescheduleDate,
    );
    setProcessing(false);

    if (error) {
      console.error(error);
      toast.error("Não foi possível reagendar o atendimento");
      return;
    }

    toast.success(
      `Agendamento de ${activeAppointment.pets?.nome || "pet"} reagendado`,
    );
    removeAppointment(activeAppointment.id);
  }

  async function handleDelete() {
    if (!activeAppointment) {
      return;
    }

    setProcessing(true);
    const { error } = await deleteAppointment(activeAppointment.id);
    setProcessing(false);

    if (error) {
      console.error(error);
      toast.error("Não foi possível excluir o agendamento");
      return;
    }

    toast.success("Agendamento antigo excluído");
    removeAppointment(activeAppointment.id);
  }

  if (!canAccess("agenda") || dismissed || !activeAppointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <section className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <CalendarClock size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              Agendamento não encerrado
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {activeAppointment.pets?.nome || "Pet não informado"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeAppointment.servico} · {formatDateLabel(activeAppointment.data)}
              {" às "}
              {activeAppointment.hora || "--:--"}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Este atendimento ficou aberto em um dia anterior. Deseja reagendar ou
          excluir o agendamento?
        </p>

        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
          Nova data
          <input
            type="date"
            min={formatDateInput(new Date())}
            value={rescheduleDate}
            onChange={(event) => setRescheduleDate(event.target.value)}
            className="w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>

        {appointments.length > 1 && (
          <p className="mt-3 text-xs font-medium text-slate-500">
            Existem mais {appointments.length - 1} agendamento(s) antigo(s) para
            revisar.
          </p>
        )}

        {confirmDelete ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">
              Confirma a exclusão permanente deste agendamento?
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={processing}
                className="rounded-xl border bg-white px-4 py-2 font-semibold text-slate-700 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50"
              >
                <Trash2 size={17} />
                {processing ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={handleReviewLater}
              disabled={processing}
              className="rounded-xl border px-4 py-3 font-semibold text-slate-600 disabled:opacity-50"
            >
              {appointments.length > 1 ? "Ver próximo" : "Agora não"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={processing}
              className="rounded-xl border border-red-200 px-4 py-3 font-bold text-red-600 disabled:opacity-50"
            >
              Excluir
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              disabled={processing}
              className="rounded-xl bg-violet-700 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {processing ? "Reagendando..." : "Reagendar"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
