"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { extractRequestedPetNameFromObservation } from "@/lib/appointment-observation";
import type {
  Appointment,
  AppointmentStatus,
  NewAppointmentInput,
  Pet,
  Service,
  Tutor,
} from "@/types/domain";

interface NewAppointmentModalProps {
  tutors: Tutor[];
  pets: Pet[];
  services: Service[];
  onSave:
    | ((appointment: NewAppointmentInput) => void)
    | ((appointment: NewAppointmentInput) => boolean)
    | ((appointment: NewAppointmentInput) => Promise<void>)
    | ((appointment: NewAppointmentInput) => Promise<boolean>);
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTutorId?: string;
  defaultPetId?: string;
  hideTrigger?: boolean;
  appointment?: Appointment | null;
}

const appointmentPhoneLinePattern = /^(Celular|Telefone):\s?(.+)$/i;

function normalizePhoneDigits(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";

  return digits.startsWith("55") && digits.length > 11
    ? digits.slice(2)
    : digits;
}

function findTutorByAppointmentPhone(
  observation: string | undefined,
  tutors: Tutor[],
) {
  const appointmentPhone = observation
    ?.split("\n")
    .map((line) => line.trim().match(appointmentPhoneLinePattern)?.[2])
    .find(Boolean);
  const appointmentPhoneDigits = normalizePhoneDigits(appointmentPhone);

  if (!appointmentPhoneDigits) {
    return undefined;
  }

  return tutors.find(
    (tutor) => normalizePhoneDigits(tutor.telefone) === appointmentPhoneDigits,
  );
}
const tutorContactLinePattern = /^(Endere[cç]o|Endereco|Telefone):\s?.*$/i;

function syncObservationTutorContact(
  observation: string,
  tutor?: Pick<Tutor, "endereco" | "telefone">,
) {
  const cleanObservation = observation
    .split("\n")
    .filter((line) => !tutorContactLinePattern.test(line.trim()))
    .join("\n")
    .trim();
  const contactLines = [
    tutor?.endereco?.trim() ? `Endereco: ${tutor.endereco.trim()}` : "",
    tutor?.telefone?.trim() ? `Telefone: ${tutor.telefone.trim()}` : "",
  ].filter(Boolean);

  if (contactLines.length === 0) {
    return cleanObservation;
  }

  return [...contactLines, cleanObservation].filter(Boolean).join("\n");
}

export function NewAppointmentModal({
  tutors,
  pets,
  services,
  onSave,
  open,
  onOpenChange,
  defaultTutorId = "",
  defaultPetId = "",
  hideTrigger = false,
  appointment = null,
}: NewAppointmentModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [petId, setPetId] = useState(defaultPetId);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(
    defaultPetId ? [defaultPetId] : [],
  );
  const [tutorId, setTutorId] = useState(defaultTutorId);
  const [servicos, setServicos] = useState<string[]>([]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("Agendado");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const modalOpen = open ?? internalOpen;

  const petsFiltrados = tutorId
    ? pets.filter((petItem) => String(petItem.tutor_id) === tutorId)
    : pets;
  const selectedPetIdsForDisplay = Array.from(
    new Set([petId, ...selectedPetIds].filter(Boolean)),
  ).filter((selectedId) =>
    petsFiltrados.some((petItem) => String(petItem.id) === selectedId),
  );
  const canSelectMultiplePets =
    !appointment && Boolean(tutorId) && petsFiltrados.length > 1;
  const selectedPetCount = selectedPetIdsForDisplay.length;
  const selectedTutor = tutors.find((tutor) => String(tutor.id) === tutorId);
  const requestedPetName = !petId
    ? extractRequestedPetNameFromObservation(
        observacao || appointment?.observacao,
      )
    : "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (modalOpen) {
        const selectedPet = appointment
          ? pets.find((pet) => pet.id === appointment.pet_id)
          : null;
        const matchedTutor = appointment
          ? findTutorByAppointmentPhone(appointment.observacao, tutors)
          : undefined;
        const initialTutorId = selectedPet?.tutor_id
          ? String(selectedPet.tutor_id)
          : defaultTutorId || (matchedTutor ? String(matchedTutor.id) : "");
        const initialTutor = tutors.find(
          (tutor) => String(tutor.id) === initialTutorId,
        );

        setTutorId(initialTutorId);
        const initialPetId = appointment?.pet_id
          ? String(appointment.pet_id)
          : defaultPetId;

        setPetId(initialPetId);
        setSelectedPetIds(initialPetId ? [initialPetId] : []);
        setServicos(
          appointment?.servico
            ? appointment.servico.split(" + ").filter(Boolean)
            : [],
        );
        setData(appointment?.data || "");
        setHora(appointment?.hora || "");
        setStatus(appointment?.status || "Agendado");
        setObservacao(
          syncObservationTutorContact(
            appointment?.observacao || "",
            initialTutor,
          ),
        );
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [appointment, defaultPetId, defaultTutorId, modalOpen, pets, tutors]);

  function setModalOpen(value: boolean) {
    if (open === undefined) {
      setInternalOpen(value);
    }

    onOpenChange?.(value);
  }

  function resetForm() {
    setPetId(defaultPetId);
    setSelectedPetIds(defaultPetId ? [defaultPetId] : []);
    setTutorId(defaultTutorId);
    setServicos([]);
    setData("");
    setHora("");
    setStatus("Agendado");
    setObservacao("");
  }

  function handleTutorChange(nextTutorId: string) {
    const nextTutor = tutors.find((tutor) => String(tutor.id) === nextTutorId);

    setTutorId(nextTutorId);
    setPetId("");
    setSelectedPetIds([]);
    setObservacao((currentObservation) =>
      syncObservationTutorContact(currentObservation, nextTutor),
    );
  }

  function handlePetChange(nextPetId: string) {
    setPetId(nextPetId);
    setSelectedPetIds(nextPetId ? [nextPetId] : []);

    const selectedPet = pets.find((pet) => String(pet.id) === nextPetId);

    if (selectedPet?.tutor_id) {
      const nextTutorId = String(selectedPet.tutor_id);
      const nextTutor = tutors.find(
        (tutor) => String(tutor.id) === nextTutorId,
      );

      setTutorId(nextTutorId);
      setObservacao((currentObservation) =>
        syncObservationTutorContact(currentObservation, nextTutor),
      );
    }
  }

  function handleToggleAdditionalPet(nextPetId: string) {
    if (nextPetId === petId) {
      return;
    }

    setSelectedPetIds((currentIds) => {
      if (currentIds.includes(nextPetId)) {
        return currentIds.filter((currentId) => currentId !== nextPetId);
      }

      return [...currentIds, nextPetId];
    });
  }

  function handleSelectAllTutorPets() {
    const allPetIds = petsFiltrados.map((petItem) => String(petItem.id));

    setSelectedPetIds(allPetIds);

    if (!petId && allPetIds[0]) {
      setPetId(allPetIds[0]);
    }
  }

  function handleKeepOnlySelectedPet() {
    setSelectedPetIds(petId ? [petId] : []);
  }

  function handleClose() {
    resetForm();
    setModalOpen(false);
  }

  async function handleSave() {
    const petIdsToSave = appointment
      ? [petId].filter(Boolean)
      : selectedPetIdsForDisplay;
    const primaryPetId = petIdsToSave[0] || petId;

    if (!primaryPetId || servicos.length === 0 || !data || !hora) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);

    const result = await onSave({
      petId: primaryPetId,
      petIds: appointment ? undefined : petIdsToSave,
      servico: servicos.join(" + "),
      data,
      hora,
      status,
      observacao: syncObservationTutorContact(observacao, selectedTutor),
    });

    setSaving(false);

    if (result === false) {
      return;
    }

    handleClose();
  }

  return (
    <>
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        >
          Novo Agendamento
        </button>
      )}

      {modalOpen && (
        <div className="erp-modal-overlay" role="dialog" aria-modal="true">
          <div className="erp-modal-panel max-w-xl">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              {appointment ? "Editar Agendamento" : "Novo Agendamento"}
            </h2>

            <div className="grid gap-4">
              <select
                value={tutorId}
                onChange={(event) => handleTutorChange(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Selecione um Tutor</option>

                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nome}
                  </option>
                ))}
              </select>

              <select
                value={petId}
                onChange={(event) => handlePetChange(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">
                  {requestedPetName
                    ? `Pet informado no site: ${requestedPetName}`
                    : "Selecione um Pet"}
                </option>

                {petsFiltrados.map((petItem) => (
                  <option key={petItem.id} value={petItem.id}>
                    {petItem.nome}
                  </option>
                ))}
              </select>

              {canSelectMultiplePets && (
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        Pets deste tutor que vão no mesmo horário
                      </p>
                      <p className="text-sm text-slate-500">
                        Marque os outros pets para criar tudo em lote com os
                        mesmos serviços, data e horário.
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllTutorPets}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#8A0EEA] shadow-sm"
                      >
                        Selecionar todos
                      </button>

                      <button
                        type="button"
                        onClick={handleKeepOnlySelectedPet}
                        className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        Só o selecionado
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {petsFiltrados.map((petItem) => {
                      const petItemId = String(petItem.id);
                      const isMainPet = petItemId === petId;
                      const checked =
                        selectedPetIdsForDisplay.includes(petItemId);

                      return (
                        <label
                          key={petItem.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 ${
                            checked
                              ? "border-[#8A0EEA]/40 text-[#8A0EEA]"
                              : "border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isMainPet}
                              onChange={() =>
                                handleToggleAdditionalPet(petItemId)
                              }
                              className="h-4 w-4 accent-[#8A0EEA]"
                            />

                            <span className="truncate text-sm font-semibold">
                              {petItem.nome}
                            </span>
                          </span>

                          {isMainPet && (
                            <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-[#8A0EEA]">
                              principal
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
                    {selectedPetCount} pet(s) selecionado(s). Ao salvar, o
                    sistema cria {selectedPetCount} agendamento(s) no mesmo
                    horário.
                  </p>
                </div>
              )}

              <div className="rounded-xl border p-3">
                <p className="mb-2 font-medium">Serviços</p>

                {services.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum serviço cadastrado.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={servicos.includes(service.nome)}
                          onChange={(event) => {
                            if (event.target.checked) {
                              setServicos([...servicos, service.nome]);
                            } else {
                              setServicos(
                                servicos.filter(
                                  (item) => item !== service.nome,
                                ),
                              );
                            }
                          }}
                        />

                        <span className="text-sm sm:text-base">
                          {service.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <label className="grid gap-2 text-sm font-medium">
                Data do agendamento
                <input
                  type="date"
                  value={data}
                  onChange={(event) => setData(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Horário
                <input
                  type="time"
                  value={hora}
                  onChange={(event) => setHora(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AppointmentStatus)
                }
                className="w-full rounded-xl border p-3"
              >
                <option>Pendente</option>
                <option>Agendado</option>
                <option>Finalizado</option>
                <option>Cancelado</option>
              </select>

              <label className="grid gap-2 text-sm font-medium">
                Observação
                <textarea
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  placeholder="Ex.: pet sensível ao secador, buscar após 16h, usar shampoo específico..."
                  rows={4}
                  className="min-h-28 w-full resize-y rounded-xl border p-3 font-normal"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full rounded-xl border py-2 sm:flex-1"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
                >
                  {saving
                    ? "Salvando..."
                    : appointment
                      ? "Salvar alterações"
                      : selectedPetCount > 1
                        ? `Salvar ${selectedPetCount} agendamentos`
                        : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
