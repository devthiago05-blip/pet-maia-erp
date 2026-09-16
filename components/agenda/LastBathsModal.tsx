"use client";

import { MessageCircle, PawPrint, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { Appointment, Pet } from "@/types/domain";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

interface LastBathsModalProps {
  appointments: Appointment[];
  pets: Pet[];
  onClose: () => void;
}

interface LastBathRow {
  daysWithoutVisit: number | null;
  lastAppointment: Appointment | null;
  pet: Pet;
  phone: string;
  tutor: string;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "Sem registro";
  }

  return value.split("-").reverse().join("/");
}

function getDaysSince(date: string, today = getTodayDateString()) {
  const start = parseLocalDate(date);
  const end = parseLocalDate(today);

  if (!start || !end) {
    return null;
  }

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS));
}

function isBathAppointment(appointment: Appointment, today = getTodayDateString()) {
  if (appointment.status === "Cancelado" || appointment.data > today) {
    return false;
  }

  const service = normalizeText(appointment.servico);

  return service.includes("banho") || service.includes("tosa");
}

function sortAppointmentsByLatest(first: Appointment, second: Appointment) {
  const dateComparison = second.data.localeCompare(first.data);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  const timeComparison = (second.hora || "").localeCompare(first.hora || "");

  if (timeComparison !== 0) {
    return timeComparison;
  }

  return second.id - first.id;
}

function formatDaysLabel(days: number | null) {
  if (days === null) {
    return "Nunca";
  }

  return days === 1 ? "1 dia" : `${days} dias`;
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone || "-";
}

function getWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return "";
  }

  const number = digits.startsWith("55") ? digits : `55${digits}`;

  return `https://wa.me/${number}`;
}

function createLastBathRows(pets: Pet[], appointments: Appointment[]) {
  const today = getTodayDateString();
  const bathAppointments = appointments
    .filter((appointment) => appointment.pet_id && isBathAppointment(appointment, today))
    .sort(sortAppointmentsByLatest);
  const appointmentsByPet = new Map<number, Appointment>();

  bathAppointments.forEach((appointment) => {
    if (!appointment.pet_id || appointmentsByPet.has(appointment.pet_id)) {
      return;
    }

    appointmentsByPet.set(appointment.pet_id, appointment);
  });

  return pets
    .map<LastBathRow>((pet) => {
      const lastAppointment = appointmentsByPet.get(pet.id) || null;
      const phone = pet.tutors?.telefone || "";

      return {
        daysWithoutVisit: lastAppointment
          ? getDaysSince(lastAppointment.data, today)
          : null,
        lastAppointment,
        pet,
        phone,
        tutor: pet.tutors?.nome || "Sem tutor",
      };
    })
    .sort((first, second) => {
      if (first.daysWithoutVisit === null && second.daysWithoutVisit !== null) {
        return -1;
      }

      if (first.daysWithoutVisit !== null && second.daysWithoutVisit === null) {
        return 1;
      }

      const daysComparison =
        (second.daysWithoutVisit ?? -1) - (first.daysWithoutVisit ?? -1);

      if (daysComparison !== 0) {
        return daysComparison;
      }

      return first.pet.nome.localeCompare(second.pet.nome, "pt-BR");
    });
}

export function LastBathsModal({
  appointments,
  pets,
  onClose,
}: LastBathsModalProps) {
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () => createLastBathRows(pets, appointments),
    [appointments, pets],
  );

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);

    if (!term) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        normalizeText(row.pet.nome).includes(term) ||
        normalizeText(row.tutor).includes(term) ||
        normalizeText(row.phone).includes(term)
      );
    });
  }, [rows, search]);

  const petsWithoutBath = rows.filter(
    (row) => row.daysWithoutVisit === null,
  ).length;
  const petsOverThirtyDays = rows.filter(
    (row) => (row.daysWithoutVisit || 0) >= 30,
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b p-4 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-[#8A0EEA]">
              <PawPrint size={20} />
              <p className="text-sm font-semibold uppercase tracking-wide">
                Controle de banho
              </p>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Pets e último banho
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lista todos os pets pelo último banho/tosa registrado na agenda.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pets listados</p>
              <strong className="mt-1 block text-2xl text-slate-900">
                {rows.length}
              </strong>
            </div>
            <div className="rounded-2xl border bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Sem banho registrado</p>
              <strong className="mt-1 block text-2xl text-amber-900">
                {petsWithoutBath}
              </strong>
            </div>
            <div className="rounded-2xl border bg-purple-50 p-4">
              <p className="text-sm text-[#8A0EEA]">30 dias ou mais</p>
              <strong className="mt-1 block text-2xl text-[#8A0EEA]">
                {petsOverThirtyDays}
              </strong>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-3 rounded-xl border px-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pet, tutor ou telefone"
              className="min-w-0 flex-1 py-3 outline-none"
            />
          </label>

          <div className="mt-4 hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Último agendamento</th>
                  <th className="px-4 py-3">Dias sem ir</th>
                  <th className="px-4 py-3">Tutor</th>
                  <th className="px-4 py-3">Número</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                      Nenhum pet encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const whatsAppUrl = getWhatsAppUrl(row.phone);

                    return (
                      <tr key={row.pet.id} className="align-top">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {row.pet.nome}
                          {row.lastAppointment?.servico && (
                            <p className="mt-1 text-xs font-normal text-slate-500">
                              {row.lastAppointment.servico}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {formatDateLabel(row.lastAppointment?.data)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              row.daysWithoutVisit === null
                                ? "bg-amber-100 text-amber-800"
                                : row.daysWithoutVisit >= 30
                                  ? "bg-purple-100 text-[#8A0EEA]"
                                  : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {formatDaysLabel(row.daysWithoutVisit)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.tutor}</td>
                        <td className="px-4 py-3">
                          {whatsAppUrl ? (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 font-semibold text-emerald-700 hover:underline"
                            >
                              <MessageCircle size={16} />
                              {formatPhone(row.phone)}
                            </a>
                          ) : (
                            formatPhone(row.phone)
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 md:hidden">
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-slate-500">
                Nenhum pet encontrado.
              </div>
            ) : (
              filteredRows.map((row) => {
                const whatsAppUrl = getWhatsAppUrl(row.phone);

                return (
                  <article
                    key={row.pet.id}
                    className="rounded-2xl border bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {row.pet.nome}
                        </h3>
                        <p className="text-sm text-slate-500">{row.tutor}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          row.daysWithoutVisit === null
                            ? "bg-amber-100 text-amber-800"
                            : row.daysWithoutVisit >= 30
                              ? "bg-purple-100 text-[#8A0EEA]"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {formatDaysLabel(row.daysWithoutVisit)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                      <p>
                        <strong className="text-slate-800">
                          Último agendamento:
                        </strong>{" "}
                        {formatDateLabel(row.lastAppointment?.data)}
                      </p>
                      {row.lastAppointment?.servico && (
                        <p>
                          <strong className="text-slate-800">Serviço:</strong>{" "}
                          {row.lastAppointment.servico}
                        </p>
                      )}
                      <p>
                        <strong className="text-slate-800">Número:</strong>{" "}
                        {whatsAppUrl ? (
                          <a
                            href={whatsAppUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-emerald-700"
                          >
                            {formatPhone(row.phone)}
                          </a>
                        ) : (
                          formatPhone(row.phone)
                        )}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
