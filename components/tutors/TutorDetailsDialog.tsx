"use client";

import { Plus, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAccess } from "@/components/auth/AccessContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCpf, formatCurrency, formatDate } from "@/lib/formatters";
import type { TutorHistoryAppointment } from "@/lib/tutor-history";
import {
  appointmentValue,
  completedHistoryTotal,
  historyText,
  lastCompletedBath,
  NOT_INFORMED,
  sortTutorHistory,
  tutorHistoryAccess,
} from "@/lib/tutor-history";
import type { TutorDetails } from "@/services/tutor-history";
import { fetchTutorDetails } from "@/services/tutor-history";
import type { Tutor } from "@/types/domain";

function valueLabel(value: number | null | undefined) {
  return value == null ? NOT_INFORMED : formatCurrency(value);
}

function appointmentDate(appointment: TutorHistoryAppointment) {
  return `${appointment.data ? formatDate(appointment.data) : NOT_INFORMED} • ${appointment.hora?.slice(0, 5) || NOT_INFORMED}`;
}

function Services({
  appointment,
  showPrices,
}: {
  appointment: TutorHistoryAppointment;
  showPrices: boolean;
}) {
  const services = appointment.appointment_services || [];
  if (!services.length) return <p>{historyText(appointment.servico)}</p>;
  return (
    <ul className="space-y-1">
      {services.map((service) => (
        <li key={service.id} className="flex flex-wrap justify-between gap-x-4">
          <span>{historyText(service.service_name)}</span>
          {showPrices && <span>{valueLabel(service.price)}</span>}
        </li>
      ))}
    </ul>
  );
}

export function TutorDetailsDialog({
  tutorId,
  onClose,
  onAddPet,
}: {
  tutorId: number;
  onClose: () => void;
  onAddPet: (tutor: Tutor) => void;
}) {
  const { canAccess } = useAccess();
  const allowed = canAccess("tutores");
  const { history, services, financial } = tutorHistoryAccess(canAccess);
  const showValues = services || financial;
  const [details, setDetails] = useState<TutorDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (!allowed) return;
    async function load() {
      setLoading(true);
      setError("");
      setDetails(null);
      try {
        const result = await fetchTutorDetails(tutorId, {
          history,
          services,
          financial,
        });
        if (active) setDetails(result);
      } catch {
        if (active)
          setError(
            "Não foi possível carregar a ficha completa. Verifique sua conexão e suas permissões e tente novamente.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [tutorId, allowed, history, services, financial, attempt]);

  const appointments = sortTutorHistory(details?.appointments || []);
  const totals = completedHistoryTotal(
    appointments,
    details?.financialEntries || [],
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Ficha do tutor</DialogTitle>
          <DialogDescription>
            Dados cadastrais, pets vinculados e histórico de serviços.
          </DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p>Sem permissão para consultar tutores.</p>
        ) : loading ? (
          <p role="status">Carregando ficha e histórico...</p>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="mt-3 underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          details && (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                {history && (
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2 font-semibold text-white"
                  >
                    <Printer size={18} /> Imprimir histórico de serviços
                  </button>
                )}
                {canAccess("pets") && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddPet(details.tutor);
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold"
                  >
                    <Plus size={18} /> Cadastrar novo pet
                  </button>
                )}
              </div>
              <div className="document-print-area min-w-0 space-y-6 break-words">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-violet-700">
                    PET MAIA • Histórico de serviços
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    {historyText(details.tutor.nome)}
                  </h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Código", String(details.tutor.id)],
                      ["CPF", formatCpf(details.tutor.cpf)],
                      ["Telefone", details.tutor.telefone],
                      ["E-mail", details.tutor.email],
                      ["Endereço", details.tutor.endereco],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold text-slate-500">
                          {label}
                        </dt>
                        <dd className="whitespace-pre-wrap">
                          {historyText(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-lg font-bold">
                    Pets vinculados ({details.pets.length})
                  </h3>
                  {!details.pets.length && <p>Nenhum pet vinculado.</p>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {details.pets.map((pet) => {
                      const bath = lastCompletedBath(appointments, pet.id);
                      return (
                        <article
                          key={pet.id}
                          className="break-inside-avoid rounded-2xl border border-slate-200 p-4"
                        >
                          <h4 className="font-bold">
                            {canAccess("pets") ? (
                              <Link
                                className="text-violet-700 underline"
                                href={`/pets/${pet.id}`}
                              >
                                {historyText(pet.nome)}
                              </Link>
                            ) : (
                              historyText(pet.nome)
                            )}
                          </h4>
                          <p>
                            Espécie: {historyText(pet.especie)} • Raça:{" "}
                            {historyText(pet.raca)}
                          </p>
                          <p>
                            Porte: {historyText(pet.porte)} • Sexo:{" "}
                            {historyText(pet.sexo)} • Idade:{" "}
                            {historyText(pet.idade)}
                          </p>
                          <h5 className="mt-3 font-semibold">
                            Último banho finalizado
                          </h5>
                          {!history ? (
                            <p>Sem permissão para consultar atendimentos.</p>
                          ) : bath ? (
                            <>
                              <p>{appointmentDate(bath)}</p>
                              <Services
                                appointment={bath}
                                showPrices={services}
                              />
                              <p className="mt-1 font-semibold">
                                Valor do atendimento:{" "}
                                {showValues
                                  ? valueLabel(
                                      appointmentValue(
                                        bath,
                                        details.financialEntries,
                                      ),
                                    )
                                  : "Sem permissão para valores"}
                              </p>
                            </>
                          ) : (
                            <p>{NOT_INFORMED}</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <h3 className="mb-2 text-lg font-bold">
                    Histórico de atendimentos
                  </h3>
                  {!history ? (
                    <p>Sem permissão para consultar atendimentos.</p>
                  ) : (
                    <>
                      <p className="mb-3 text-sm text-slate-500">
                        Do mais recente ao mais antigo. Os serviços são os
                        registrados no atendimento. Valores ausentes não são
                        estimados.
                      </p>
                      {!appointments.length && (
                        <p>Nenhum atendimento registrado.</p>
                      )}
                      <div className="space-y-3">
                        {appointments.map((appointment) => (
                          <article
                            key={appointment.id}
                            className="break-inside-avoid rounded-xl border border-slate-200 p-4"
                          >
                            <div className="mb-2 flex flex-wrap justify-between gap-2">
                              <h4 className="font-bold">
                                {historyText(
                                  details.pets.find(
                                    (pet) => pet.id === appointment.pet_id,
                                  )?.nome,
                                )}{" "}
                                • {appointmentDate(appointment)}
                              </h4>
                              <span className="font-semibold">
                                {historyText(appointment.status)}
                              </span>
                            </div>
                            <Services
                              appointment={appointment}
                              showPrices={services}
                            />
                            <p className="mt-2 font-semibold">
                              Valor do atendimento:{" "}
                              {showValues
                                ? valueLabel(
                                    appointmentValue(
                                      appointment,
                                      details.financialEntries,
                                    ),
                                  )
                                : "Sem permissão para valores"}
                            </p>
                          </article>
                        ))}
                      </div>
                      <div className="mt-4 break-inside-avoid rounded-xl bg-violet-50 p-4">
                        <p className="font-bold">
                          Total dos serviços finalizados:{" "}
                          {showValues
                            ? totals.missing && !totals.known
                              ? NOT_INFORMED
                              : formatCurrency(totals.total)
                            : "Sem permissão para valores"}
                        </p>
                        <p className="mt-1 text-sm">
                          Agendados, pendentes e cancelados não entram no total.
                          Este histórico não é um comprovante de pagamento.
                        </p>
                        {showValues && totals.missing > 0 && (
                          <p className="mt-1 text-sm">
                            {totals.missing} atendimento(s) finalizado(s) sem
                            valor informado; total parcial dos valores
                            conhecidos.
                          </p>
                        )}
                        {showValues && (
                          <p className="mt-1 text-sm">
                            Valor: lançamento financeiro vinculado, quando
                            disponível; caso contrário, soma dos serviços
                            registrados. Os preços individuais podem diferir do
                            total por ajustes.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
