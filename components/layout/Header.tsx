"use client";

import { Bell, CalendarDays, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAccess } from "@/components/auth/AccessContext";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/lib/supabase";
import {
  fetchPendingFinancialNotifications,
  fetchPendingSiteAppointmentNotifications,
  fetchTodayPendingAppointments,
  fetchVaccinationNotifications,
} from "@/services/notifications";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

interface AppointmentNotificationRow {
  id: number;
  data?: string;
  hora: string;
  servico: string;
  pets?: {
    nome?: string;
    tutors?: { nome?: string } | null;
  } | null;
}

interface VaccinationNotificationRow {
  id: number;
  pet_id: number;
  vaccine_name: string;
  next_dose_date: string;
  pets?: {
    nome?: string;
    tutors?: { nome?: string } | null;
  } | null;
}

function getRelativeDateIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA");
}

function getDaysUntil(date: string, today: string) {
  const targetDate = new Date(`${date}T00:00:00`);
  const currentDate = new Date(`${today}T00:00:00`);

  return Math.round(
    (targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/agenda": "Agenda",
  "/bi": "BI",
  "/clinica": "Clínica",
  "/crm": "CRM",
  "/financeiro": "Financeiro",
  "/estoque": "Estoque",
  "/pets": "Pets",
  "/pdv": "PDV",
  "/receipts": "Recibos",
  "/relatorios": "Relatórios",
  "/services": "Serviços",
  "/settings": "Configurações",
  "/site": "Site",
  "/tutors": "Tutores",
  "/usuarios": "Usuários",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, canAccess } = useAccess();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const today = new Date().toLocaleDateString("pt-BR");
  const todayIso = new Date().toLocaleDateString("en-CA");
  const initial = profile?.nome?.trim().charAt(0).toUpperCase() || "U";
  const route = Object.keys(pageTitles)
    .filter((item) => item !== "/")
    .find((item) => pathname === item || pathname.startsWith(`${item}/`));
  const pageTitle = route
    ? pageTitles[route]
    : pageTitles[pathname] || "PET MAIA ERP";

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      const [
        appointmentsResponse,
        pendingSiteAppointmentsResponse,
        financialResponse,
        vaccinationResponse,
      ] = await Promise.all([
        canAccess("agenda")
          ? fetchTodayPendingAppointments(todayIso)
          : Promise.resolve({ data: [], error: null }),
        canAccess("agenda")
          ? fetchPendingSiteAppointmentNotifications()
          : Promise.resolve({ data: [], error: null }),
        canAccess("financeiro")
          ? fetchPendingFinancialNotifications()
          : Promise.resolve({ data: [], error: null }),
        canAccess("clinica") || canAccess("pets")
          ? fetchVaccinationNotifications(
              getRelativeDateIso(-90),
              getRelativeDateIso(30),
            )
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!active) {
        return;
      }

      if (appointmentsResponse.error) {
        console.error(appointmentsResponse.error);
      }

      if (financialResponse.error) {
        console.error(financialResponse.error);
      }

      if (pendingSiteAppointmentsResponse.error) {
        console.error(pendingSiteAppointmentsResponse.error);
      }

      if (vaccinationResponse.error) {
        console.error(vaccinationResponse.error);
      }

      const appointmentItems: NotificationItem[] = (
        (appointmentsResponse.data ||
          []) as unknown as AppointmentNotificationRow[]
      ).map((appointment) => ({
        id: `appointment-${appointment.id}`,
        title: `${appointment.hora} · ${appointment.pets?.nome || "Pet"}`,
        description: appointment.servico,
        href: `/agenda?appointmentId=${appointment.id}`,
      }));
      const pendingSiteAppointmentItems: NotificationItem[] = (
        (pendingSiteAppointmentsResponse.data ||
          []) as unknown as AppointmentNotificationRow[]
      ).map((appointment) => ({
        id: `site-appointment-${appointment.id}`,
        title: `Solicitacao do site - ${appointment.pets?.nome || "Pet"}`,
        description: `${appointment.data || "Sem data"} ${appointment.hora || ""} - Tutor: ${appointment.pets?.tutors?.nome || "nao informado"} - ${appointment.servico}`,
        href: `/agenda?appointmentId=${appointment.id}&status=Pendente`,
      }));
      const financialItems: NotificationItem[] = (
        financialResponse.data || []
      ).map((entry) => ({
        id: `financial-${entry.id}`,
        title: "Pagamento pendente",
        description: `${entry.descricao} · ${formatCurrency(entry.valor)}`,
        href: `/financeiro?entryId=${entry.id}`,
      }));

      const vaccinationItems: NotificationItem[] = (
        (vaccinationResponse.data ||
          []) as unknown as VaccinationNotificationRow[]
      ).map((vaccination) => {
        const daysUntil = getDaysUntil(vaccination.next_dose_date, todayIso);
        const urgency =
          daysUntil < 0
            ? `Vacina atrasada há ${Math.abs(daysUntil)} dia(s)`
            : daysUntil === 0
              ? "Vacina vence hoje"
              : daysUntil <= 7
                ? `Vacina vence em ${daysUntil} dia(s)`
                : `Próxima vacina em ${daysUntil} dia(s)`;

        return {
          id: `vaccination-${vaccination.id}`,
          title: `${urgency} · ${vaccination.pets?.nome || "Pet"}`,
          description: `${vaccination.vaccine_name} · Tutor: ${vaccination.pets?.tutors?.nome || "não informado"}`,
          href: `/pets/${vaccination.pet_id}`,
        };
      });

      setNotifications([
        ...pendingSiteAppointmentItems,
        ...vaccinationItems,
        ...appointmentItems,
        ...financialItems,
      ]);
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, [canAccess, todayIso]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <header className="relative border-b border-slate-200 bg-white py-3 pr-4 pl-16 sm:py-4 md:pl-8">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-800 sm:text-2xl">
            {pageTitle}
          </h1>
          <p className="truncate text-xs text-slate-500 sm:text-sm">
            Bem-vindo ao PET MAIA ERP
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-2 text-slate-500 sm:flex">
            <CalendarDays size={18} />
            <span>{today}</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((current) => !current)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100"
              aria-label="Abrir notificações"
              aria-expanded={notificationsOpen}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF7A00] px-1 text-xs text-white">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="fixed top-20 right-4 left-4 z-50 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-xl border bg-white shadow-xl sm:absolute sm:top-12 sm:right-0 sm:left-auto sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))]">
                <div className="border-b p-4">
                  <p className="font-bold">Notificações</p>
                  <p className="text-xs text-slate-500">
                    Solicitacoes do site, vacinas, agenda e pagamentos
                  </p>
                </div>
                <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto sm:max-h-80">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-center text-sm text-slate-500">
                      Nenhuma notificação no momento.
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => setNotificationsOpen(false)}
                        className="block border-b p-4 transition last:border-b-0 hover:bg-slate-50"
                      >
                        <p className="text-sm font-semibold">
                          {notification.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {notification.description}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8A0EEA] font-bold text-white">
              {initial}
            </div>
            <div className="hidden lg:block">
              <p className="font-medium">{profile?.nome || "Usuário"}</p>
              <p className="text-xs text-slate-500">
                {profile?.is_admin ? "Administrador" : "Usuário"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-slate-600 hover:bg-slate-50"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      {(canAccess("pets") || canAccess("tutores")) && (
        <div className="mt-3 md:max-w-2xl">
          <GlobalSearch
            includePets={canAccess("pets")}
            includeTutors={canAccess("tutores")}
          />
        </div>
      )}
    </header>
  );
}
