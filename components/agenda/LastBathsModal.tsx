"use client";

import {
  CheckCircle2,
  MessageCircle,
  PawPrint,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  fetchPetBathReminderNotifications,
  markPetBathReminderNotification,
  unmarkPetBathReminderNotification,
} from "@/services/pet-bath-reminder-notifications";
import type { Appointment, Pet } from "@/types/domain";
import type {
  BathReminderLevel,
  PetBathReminderNotification,
} from "@/types/domain";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const REMINDER_LEVELS: BathReminderLevel[] = [30, 45, 60];

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
  tutorId?: number | null;
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

function getWhatsAppMessageUrl(phone: string, message: string) {
  const baseUrl = getWhatsAppUrl(phone);

  if (!baseUrl) {
    return "";
  }

  return `${baseUrl}?text=${encodeURIComponent(message)}`;
}

function getTutorFirstName(name: string) {
  const firstName = name.trim().split(/\s+/)[0];

  return firstName || "tudo bem";
}

function getReminderLevel(row: LastBathRow): BathReminderLevel | null {
  if (row.daysWithoutVisit === null) {
    return 30;
  }

  if (row.daysWithoutVisit >= 60) {
    return 60;
  }

  if (row.daysWithoutVisit >= 45) {
    return 45;
  }

  if (row.daysWithoutVisit >= 30) {
    return 30;
  }

  return null;
}

function getBathReferenceKey(row: LastBathRow) {
  if (row.lastAppointment) {
    return `appointment:${row.lastAppointment.id}:${row.lastAppointment.data}`;
  }

  const createdAt = row.pet.created_at?.slice(0, 10) || "sem-cadastro";

  return `never:${row.pet.id}:${createdAt}`;
}

function getNotificationKey(
  petId: number,
  level: BathReminderLevel,
  referenceKey: string,
) {
  return `${petId}:${level}:${referenceKey}`;
}

function formatNotifiedAt(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function buildBathReminderMessage(row: LastBathRow, level: BathReminderLevel) {
  const tutorName = getTutorFirstName(row.tutor);
  const petName = row.pet.nome;
  const lastBathDate = formatDateLabel(row.lastAppointment?.data);

  if (row.daysWithoutVisit === null) {
    return [
      `Olá, ${tutorName}! Tudo bem?`,
      "",
      `Aqui é do Pet Maia. Ainda não temos banho registrado para ${petName} no sistema.`,
      "Quer que eu veja um horário disponível para banho/tosa?",
      "",
      "Se preferir, pode me responder por aqui.",
    ].join("\n");
  }

  if (level === 60) {
    return [
      `Olá, ${tutorName}! Tudo bem?`,
      "",
      `Aqui é do Pet Maia. Vi que ${petName} já está há ${formatDaysLabel(row.daysWithoutVisit)} sem banho/tosa. O último atendimento foi em ${lastBathDate}.`,
      "Para manter conforto, pele e pelagem em dia, recomendo agendarmos o quanto antes.",
      "Quer que eu te envie os horários disponíveis?",
    ].join("\n");
  }

  if (level === 45) {
    return [
      `Olá, ${tutorName}! Tudo bem?`,
      "",
      `Aqui é do Pet Maia. O(a) ${petName} está há ${formatDaysLabel(row.daysWithoutVisit)} sem banho/tosa. O último foi em ${lastBathDate}.`,
      "Já passou um pouco do intervalo ideal. Quer que eu veja um horário para essa semana?",
      "",
      "Pode me responder por aqui.",
    ].join("\n");
  }

  return [
    `Olá, ${tutorName}! Tudo bem?`,
    "",
    `Aqui é do Pet Maia. O(a) ${petName} completou ${formatDaysLabel(row.daysWithoutVisit)} desde o último banho/tosa, em ${lastBathDate}.`,
    "Temos horários disponíveis para manter a rotina em dia. Quer que eu veja um melhor horário para vocês?",
    "",
    "Se preferir, pode me responder por aqui.",
  ].join("\n");
}

function getLevelBadgeClass(level: BathReminderLevel, sent: boolean) {
  if (sent) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (level === 60) {
    return "bg-red-100 text-red-700";
  }

  if (level === 45) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-purple-100 text-[#8A0EEA]";
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
        tutorId: pet.tutors?.id || pet.tutor_id || null,
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
  const [notifications, setNotifications] = useState<
    PetBathReminderNotification[]
  >([]);
  const [notificationError, setNotificationError] = useState("");
  const [savingNotificationKey, setSavingNotificationKey] = useState("");

  useEffect(() => {
    let active = true;

    fetchPetBathReminderNotifications().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        console.error(error);
        setNotificationError(
          "Não foi possível carregar o histórico de avisos. A lista continua disponível, mas pode mostrar avisos já enviados.",
        );
        return;
      }

      setNotificationError("");
      setNotifications(data || []);
    });

    return () => {
      active = false;
    };
  }, []);

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
  const notificationByKey = useMemo(() => {
    const entries = new Map<string, PetBathReminderNotification>();

    notifications.forEach((notification) => {
      entries.set(
        getNotificationKey(
          notification.pet_id,
          notification.reminder_level,
          notification.bath_reference_key,
        ),
        notification,
      );
    });

    return entries;
  }, [notifications]);
  const pendingByLevel = useMemo(() => {
    return rows.reduce<Record<BathReminderLevel, number>>(
      (totals, row) => {
        const level = getReminderLevel(row);

        if (!level) {
          return totals;
        }

        const notification = notificationByKey.get(
          getNotificationKey(row.pet.id, level, getBathReferenceKey(row)),
        );

        if (!notification) {
          totals[level] += 1;
        }

        return totals;
      },
      { 30: 0, 45: 0, 60: 0 },
    );
  }, [notificationByKey, rows]);

  async function markReminder(
    row: LastBathRow,
    level: BathReminderLevel,
    channel: "whatsapp" | "manual",
  ) {
    const referenceKey = getBathReferenceKey(row);
    const message = buildBathReminderMessage(row, level);
    const key = getNotificationKey(row.pet.id, level, referenceKey);

    setSavingNotificationKey(key);
    const { data, error } = await markPetBathReminderNotification({
      bathReferenceKey: referenceKey,
      channel,
      daysWithoutBath: row.daysWithoutVisit ?? 0,
      lastBathDate: row.lastAppointment?.data || null,
      message,
      petId: row.pet.id,
      reminderLevel: level,
      tutorId: row.tutorId || null,
    });
    setSavingNotificationKey("");

    if (error || !data) {
      console.error(error);
      toast.error("Não foi possível marcar o aviso como enviado.");
      return;
    }

    setNotifications((current) => {
      const next = current.filter((item) => item.id !== data.id);
      next.unshift(data);
      return next;
    });
    toast.success(`Aviso de ${level} dias marcado para ${row.pet.nome}.`);
  }

  async function unmarkReminder(notification: PetBathReminderNotification) {
    const key = getNotificationKey(
      notification.pet_id,
      notification.reminder_level,
      notification.bath_reference_key,
    );

    setSavingNotificationKey(key);
    const { error } = await unmarkPetBathReminderNotification(notification.id);
    setSavingNotificationKey("");

    if (error) {
      console.error(error);
      toast.error("Não foi possível desmarcar o aviso.");
      return;
    }

    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
    toast.success("Aviso desmarcado.");
  }

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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
            {REMINDER_LEVELS.map((level) => (
              <div
                key={level}
                className={`rounded-2xl border p-4 ${
                  level === 60
                    ? "bg-red-50"
                    : level === 45
                      ? "bg-amber-50"
                      : "bg-purple-50"
                }`}
              >
                <p
                  className={`text-sm ${
                    level === 60
                      ? "text-red-700"
                      : level === 45
                        ? "text-amber-700"
                        : "text-[#8A0EEA]"
                  }`}
                >
                  Pendentes {level}d
                </p>
                <strong
                  className={`mt-1 block text-2xl ${
                    level === 60
                      ? "text-red-700"
                      : level === 45
                        ? "text-amber-800"
                        : "text-[#8A0EEA]"
                  }`}
                >
                  {pendingByLevel[level]}
                </strong>
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Total com 30 dias ou mais: {petsOverThirtyDays}. Ao avisar, o
            sistema grava o nível atual para não repetir a mesma mensagem.
          </p>

          <label className="mt-4 flex items-center gap-3 rounded-xl border px-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar pet, tutor ou telefone"
              className="min-w-0 flex-1 py-3 outline-none"
            />
          </label>

          {notificationError && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {notificationError}
            </div>
          )}

          <div className="mt-4 hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Último agendamento</th>
                  <th className="px-4 py-3">Dias sem ir</th>
                  <th className="px-4 py-3">Tutor</th>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-slate-500"
                      colSpan={6}
                    >
                      Nenhum pet encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const whatsAppUrl = getWhatsAppUrl(row.phone);
                    const referenceKey = getBathReferenceKey(row);
                    const currentLevel = getReminderLevel(row);
                    const currentNotification = currentLevel
                      ? notificationByKey.get(
                          getNotificationKey(
                            row.pet.id,
                            currentLevel,
                            referenceKey,
                          ),
                        )
                      : null;
                    const savingKey = currentLevel
                      ? getNotificationKey(row.pet.id, currentLevel, referenceKey)
                      : "";
                    const isSaving = savingNotificationKey === savingKey;
                    const reminderUrl =
                      currentLevel && row.phone && !currentNotification
                        ? getWhatsAppMessageUrl(
                            row.phone,
                            buildBathReminderMessage(row, currentLevel),
                          )
                        : "";

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
                        <td className="px-4 py-3">
                          {!currentLevel ? (
                            <span className="text-xs text-slate-400">
                              Em dia
                            </span>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1">
                                {REMINDER_LEVELS.map((level) => {
                                  const sent = Boolean(
                                    notificationByKey.get(
                                      getNotificationKey(
                                        row.pet.id,
                                        level,
                                        referenceKey,
                                      ),
                                    ),
                                  );

                                  return (
                                    <span
                                      key={level}
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                        currentLevel === level || sent
                                          ? getLevelBadgeClass(level, sent)
                                          : "bg-slate-100 text-slate-400"
                                      }`}
                                    >
                                      {sent ? "✓ " : ""}
                                      {level}d
                                    </span>
                                  );
                                })}
                              </div>

                              {currentNotification ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    Avisado em{" "}
                                    {formatNotifiedAt(
                                      currentNotification.notified_at,
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void unmarkReminder(currentNotification)
                                    }
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold text-slate-500 disabled:opacity-50"
                                  >
                                    <RotateCcw size={13} />
                                    Desmarcar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {reminderUrl && (
                                    <a
                                      href={reminderUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() =>
                                        void markReminder(
                                          row,
                                          currentLevel,
                                          "whatsapp",
                                        )
                                      }
                                      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 ${
                                        isSaving
                                          ? "pointer-events-none opacity-60"
                                          : ""
                                      }`}
                                    >
                                      <MessageCircle size={15} />
                                      WhatsApp {currentLevel}d
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void markReminder(row, currentLevel, "manual")
                                    }
                                    disabled={isSaving}
                                    className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
                                  >
                                    {isSaving ? "Salvando..." : "Marcar avisado"}
                                  </button>
                                </div>
                              )}
                            </div>
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
                const referenceKey = getBathReferenceKey(row);
                const currentLevel = getReminderLevel(row);
                const currentNotification = currentLevel
                  ? notificationByKey.get(
                      getNotificationKey(row.pet.id, currentLevel, referenceKey),
                    )
                  : null;
                const savingKey = currentLevel
                  ? getNotificationKey(row.pet.id, currentLevel, referenceKey)
                  : "";
                const isSaving = savingNotificationKey === savingKey;
                const reminderUrl =
                  currentLevel && row.phone && !currentNotification
                    ? getWhatsAppMessageUrl(
                        row.phone,
                        buildBathReminderMessage(row, currentLevel),
                      )
                    : "";

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

                    {currentLevel && (
                      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex flex-wrap gap-1">
                          {REMINDER_LEVELS.map((level) => {
                            const sent = Boolean(
                              notificationByKey.get(
                                getNotificationKey(
                                  row.pet.id,
                                  level,
                                  referenceKey,
                                ),
                              ),
                            );

                            return (
                              <span
                                key={level}
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  currentLevel === level || sent
                                    ? getLevelBadgeClass(level, sent)
                                    : "bg-white text-slate-400"
                                }`}
                              >
                                {sent ? "✓ " : ""}
                                {level}d
                              </span>
                            );
                          })}
                        </div>

                        {currentNotification ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                              <CheckCircle2 size={16} />
                              Avisado em{" "}
                              {formatNotifiedAt(
                                currentNotification.notified_at,
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                void unmarkReminder(currentNotification)
                              }
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-xs font-bold text-slate-500 disabled:opacity-50"
                            >
                              <RotateCcw size={14} />
                              Desmarcar
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {reminderUrl && (
                              <a
                                href={reminderUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() =>
                                  void markReminder(
                                    row,
                                    currentLevel,
                                    "whatsapp",
                                  )
                                }
                                className={`flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white ${
                                  isSaving ? "pointer-events-none opacity-60" : ""
                                }`}
                              >
                                <MessageCircle size={17} />
                                Enviar mensagem {currentLevel}d
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                void markReminder(row, currentLevel, "manual")
                              }
                              disabled={isSaving}
                              className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 disabled:opacity-50"
                            >
                              {isSaving
                                ? "Salvando..."
                                : "Marcar tutor como avisado"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
