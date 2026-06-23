"use client";

import { useState } from "react";

import type { NewAppointmentInput, Pet, Tutor } from "@/types/domain";

interface NewAppointmentModalProps {
  tutors: Tutor[];
  pets: Pet[];
  onSave: (appointment: NewAppointmentInput & { id: number }) => void;
}

const serviceOptions = [
  "Consulta",
  "Retorno",
  "Vacina",
  "Banho",
  "Tosa",
  "Tosa Higienica",
  "Hidratação",
  "Corte de unhas",
  "Limpeza de ouvido",
  "Exame",
  "Cirurgia",
  "Internação",
];

export function NewAppointmentModal({
  tutors,
  pets,
  onSave,
}: NewAppointmentModalProps) {
  const [open, setOpen] = useState(false);
  const [pet, setPet] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [servicos, setServicos] = useState<string[]>([]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] = useState("Agendado");

  const petsFiltrados = pets.filter(
    (petItem) => String(petItem.tutor_id) === tutorId,
  );

  function handleSave() {
    if (!pet || servicos.length === 0 || !data || !hora) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    onSave({
      id: Date.now(),
      pet,
      servico: servicos.join(" + "),
      data,
      hora,
      status,
    });

    setOpen(false);
    setPet("");
    setServicos([]);
    setData("");
    setHora("");
    setStatus("Agendado");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
      >
        Novo Agendamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">
              Novo Agendamento
            </h2>

            <div className="grid gap-4">
              <select
                value={tutorId}
                onChange={(event) => setTutorId(event.target.value)}
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
                value={pet}
                onChange={(event) => setPet(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="">Selecione um Pet</option>

                {petsFiltrados.map((petItem) => (
                  <option key={petItem.id} value={petItem.nome}>
                    {petItem.nome}
                  </option>
                ))}
              </select>

              <div className="rounded-xl border p-3">
                <p className="mb-2 font-medium">Serviços</p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {serviceOptions.map((servico) => (
                    <label key={servico} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={servicos.includes(servico)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setServicos([...servicos, servico]);
                          } else {
                            setServicos(
                              servicos.filter((item) => item !== servico),
                            );
                          }
                        }}
                      />

                      <span className="text-sm sm:text-base">{servico}</span>
                    </label>
                  ))}
                </div>
              </div>

              <input
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="time"
                value={hora}
                onChange={(event) => setHora(event.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option>Agendado</option>
                <option>Concluído</option>
                <option>Cancelado</option>
              </select>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl border py-2 sm:flex-1"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white sm:flex-1"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
