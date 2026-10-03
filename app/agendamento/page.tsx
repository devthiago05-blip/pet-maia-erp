"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  PawPrint,
  Phone,
  Search,
  Send,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface LookupTutor {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

interface LookupPet {
  id: number;
  nome: string;
  especie?: string;
  raca?: string;
  porte?: string;
  sexo?: string;
  idade?: string;
}

interface LookupResponse {
  found?: boolean;
  needsDdd?: boolean;
  message?: string;
  error?: string;
  tutor?: LookupTutor;
  pets?: LookupPet[];
}

type FlowStep = "phone" | "booking" | "done";

function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export default function PublicBookingPage() {
  const [step, setStep] = useState<FlowStep>("phone");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [ddd, setDdd] = useState("");
  const [needsDdd, setNeedsDdd] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [tutor, setTutor] = useState<LookupTutor | null>(null);
  const [pets, setPets] = useState<LookupPet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [useNewPet, setUseNewPet] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [tutorForm, setTutorForm] = useState({
    nome: "",
    email: "",
    endereco: "",
  });
  const [petForm, setPetForm] = useState({
    nome: "",
    especie: "Cachorro",
    raca: "",
    porte: "",
    sexo: "",
    idade: "",
  });
  const [bookingForm, setBookingForm] = useState({
    serviceName: "",
    date: todayInputValue(),
    time: "",
    notes: "",
  });

  const isKnownTutor = Boolean(tutor);
  const selectedPet = useMemo(
    () => pets.find((pet) => String(pet.id) === selectedPetId),
    [pets, selectedPetId],
  );

  useEffect(() => {
    async function loadOptions() {
      const response = await fetch("/api/public/booking/options");
      const payload = (await response.json()) as { services?: string[] };
      const availableServices = payload.services || [];

      setServices(availableServices);
      setBookingForm((current) => ({
        ...current,
        serviceName: current.serviceName || availableServices[0] || "Banho",
      }));
    }

    loadOptions().catch(() => {
      setServices(["Banho", "Banho + Tosa", "Consulta", "Vacina"]);
      setBookingForm((current) => ({
        ...current,
        serviceName: current.serviceName || "Banho",
      }));
    });
  }, []);

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPhone = onlyDigits(phone, 9);
    const cleanDdd = onlyDigits(ddd, 2);

    if (!/^9\d{8}$/.test(cleanPhone)) {
      toast.error("Digite o telefone sem DDD com 9 dígitos começando por 9.");
      return;
    }

    setLoading(true);
    setLookupMessage("");

    try {
      const params = new URLSearchParams({ phone: cleanPhone });
      if (cleanDdd) {
        params.set("ddd", cleanDdd);
      }

      const response = await fetch(`/api/public/booking/lookup?${params}`);
      const payload = (await response.json()) as LookupResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível consultar.");
      }

      if (payload.needsDdd) {
        setNeedsDdd(true);
        setLookupMessage(payload.message || "Informe o DDD para continuar.");
        return;
      }

      setNeedsDdd(false);
      setTutor(payload.tutor || null);
      setPets(payload.pets || []);
      setSelectedPetId(payload.pets?.[0]?.id ? String(payload.pets[0].id) : "");
      setUseNewPet(!payload.found || !payload.pets?.length);
      setStep("booking");

      if (!payload.found) {
        setLookupMessage(
          "Não encontramos cadastro com esse telefone. Preencha seus dados para criar a solicitação.",
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao consultar telefone.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bookingForm.serviceName || !bookingForm.date || !bookingForm.time) {
      toast.error("Informe serviço, data e horário desejado.");
      return;
    }

    if (!isKnownTutor && !tutorForm.nome.trim()) {
      toast.error("Informe o nome do tutor.");
      return;
    }

    if (!isKnownTutor && !/^\d{2}$/.test(ddd)) {
      toast.error("Informe o DDD para concluir o cadastro.");
      return;
    }

    if ((useNewPet || !selectedPetId) && !petForm.nome.trim()) {
      toast.error("Informe o nome do pet.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          ddd,
          tutorId: tutor?.id,
          tutor: isKnownTutor ? undefined : tutorForm,
          petId: useNewPet ? undefined : selectedPetId,
          pet: useNewPet || !selectedPetId ? petForm : undefined,
          ...bookingForm,
        }),
      });
      const payload = (await response.json()) as {
        appointmentId?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível enviar.");
      }

      setAppointmentId(payload.appointmentId || null);
      setStep("done");
      toast.success("Solicitação enviada para aprovação!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao enviar solicitação.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setStep("phone");
    setTutor(null);
    setPets([]);
    setSelectedPetId("");
    setUseNewPet(false);
    setLookupMessage("");
    setAppointmentId(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-emerald-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-purple-100 bg-white shadow-xl shadow-purple-100/60">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#8A0EEA] p-8 text-white sm:p-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                <PawPrint size={18} />
                Pet Maia
              </span>

              <h1 className="mt-8 text-3xl font-black leading-tight sm:text-4xl">
                Solicite o banho, tosa ou atendimento do seu pet.
              </h1>

              <p className="mt-4 max-w-md text-white/85">
                Você informa o telefone e escolhe o melhor horário. A equipe
                confere a agenda, pode ajustar o dia ou horário e confirma pelo
                WhatsApp.
              </p>

              <div className="mt-8 grid gap-3 text-sm">
                {[
                  "Cadastro rápido de tutor e pet quando ainda não existir.",
                  "Solicitação entra como pendente para aprovação.",
                  "Confirmação enviada pelo WhatsApp após aprovação.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 sm:p-8">
              {step === "phone" && (
                <form onSubmit={handleLookup} className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
                      Primeiro passo
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">
                      Digite o telefone do tutor
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Use o número sem DDD, com o 9 na frente. Exemplo:
                      988765432.
                    </p>
                  </div>

                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Telefone sem DDD
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                      <Phone size={20} className="text-slate-400" />
                      <input
                        value={phone}
                        onChange={(event) =>
                          setPhone(onlyDigits(event.target.value, 9))
                        }
                        inputMode="numeric"
                        placeholder="988765432"
                        className="min-h-14 min-w-0 flex-1 text-lg font-semibold outline-none"
                      />
                    </div>
                  </label>

                  {needsDdd && (
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      DDD para localizar o cadastro certo
                      <input
                        value={ddd}
                        onChange={(event) =>
                          setDdd(onlyDigits(event.target.value, 2))
                        }
                        inputMode="numeric"
                        placeholder="85"
                        className="min-h-14 rounded-2xl border border-slate-200 px-4 text-lg font-semibold outline-none focus:border-[#8A0EEA]"
                      />
                    </label>
                  )}

                  {lookupMessage && (
                    <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                      {lookupMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#8A0EEA] px-5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#7600d1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Search size={20} />
                    {loading ? "Consultando..." : "Continuar"}
                  </button>
                </form>
              )}

              {step === "booking" && (
                <form onSubmit={handleSubmitBooking} className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
                        Solicitação
                      </p>
                      <h2 className="mt-1 text-2xl font-bold">
                        Dados para o agendamento
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        A confirmação final será feita pela equipe da Pet Maia.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={resetFlow}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Trocar telefone
                    </button>
                  </div>

                  {lookupMessage && !isKnownTutor && (
                    <p className="rounded-2xl bg-blue-50 p-4 text-sm font-medium text-blue-800">
                      {lookupMessage}
                    </p>
                  )}

                  <section className="rounded-3xl border border-slate-200 p-4">
                    <h3 className="flex items-center gap-2 font-bold">
                      <UserRound size={18} className="text-[#8A0EEA]" />
                      Tutor
                    </h3>

                    {isKnownTutor ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="font-bold">{tutor?.nome}</p>
                        <p className="text-sm text-slate-500">
                          Cadastro localizado pelo telefone informado.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                          value={tutorForm.nome}
                          onChange={(event) =>
                            setTutorForm((current) => ({
                              ...current,
                              nome: event.target.value,
                            }))
                          }
                          placeholder="Nome do tutor"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                        <input
                          value={ddd}
                          onChange={(event) =>
                            setDdd(onlyDigits(event.target.value, 2))
                          }
                          inputMode="numeric"
                          placeholder="DDD"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                        <input
                          value={tutorForm.email}
                          onChange={(event) =>
                            setTutorForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          placeholder="E-mail opcional"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                        <input
                          value={tutorForm.endereco}
                          onChange={(event) =>
                            setTutorForm((current) => ({
                              ...current,
                              endereco: event.target.value,
                            }))
                          }
                          placeholder="Endereço"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                      </div>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="flex items-center gap-2 font-bold">
                        <PawPrint size={18} className="text-[#8A0EEA]" />
                        Pet
                      </h3>

                      {isKnownTutor && pets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setUseNewPet((current) => !current)}
                          className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
                        >
                          {useNewPet ? "Usar pet cadastrado" : "Cadastrar outro pet"}
                        </button>
                      )}
                    </div>

                    {isKnownTutor && pets.length > 0 && !useNewPet ? (
                      <div className="mt-4 grid gap-3">
                        {pets.map((pet) => (
                          <label
                            key={pet.id}
                            className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 ${
                              selectedPetId === String(pet.id)
                                ? "border-[#8A0EEA] bg-purple-50"
                                : "border-slate-200"
                            }`}
                          >
                            <span>
                              <span className="block font-bold">{pet.nome}</span>
                              <span className="text-sm text-slate-500">
                                {[pet.especie, pet.raca].filter(Boolean).join(" · ") ||
                                  "Pet cadastrado"}
                              </span>
                            </span>
                            <input
                              type="radio"
                              name="pet"
                              checked={selectedPetId === String(pet.id)}
                              onChange={() => setSelectedPetId(String(pet.id))}
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                          value={petForm.nome}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              nome: event.target.value,
                            }))
                          }
                          placeholder="Nome do pet"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                        <select
                          value={petForm.especie}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              especie: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        >
                          <option>Cachorro</option>
                          <option>Gato</option>
                          <option>Outro</option>
                        </select>
                        <input
                          value={petForm.raca}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              raca: event.target.value,
                            }))
                          }
                          placeholder="Raça"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                        <select
                          value={petForm.porte}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              porte: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        >
                          <option value="">Porte</option>
                          <option>Pequeno</option>
                          <option>Médio</option>
                          <option>Grande</option>
                        </select>
                        <select
                          value={petForm.sexo}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              sexo: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        >
                          <option value="">Sexo</option>
                          <option>Macho</option>
                          <option>Fêmea</option>
                        </select>
                        <input
                          value={petForm.idade}
                          onChange={(event) =>
                            setPetForm((current) => ({
                              ...current,
                              idade: event.target.value,
                            }))
                          }
                          placeholder="Idade aproximada"
                          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                        />
                      </div>
                    )}

                    {selectedPet && !useNewPet && (
                      <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                        Pet selecionado: {selectedPet.nome}
                      </p>
                    )}
                  </section>

                  <section className="rounded-3xl border border-slate-200 p-4">
                    <h3 className="flex items-center gap-2 font-bold">
                      <CalendarDays size={18} className="text-[#8A0EEA]" />
                      Preferência de agenda
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <select
                        value={bookingForm.serviceName}
                        onChange={(event) =>
                          setBookingForm((current) => ({
                            ...current,
                            serviceName: event.target.value,
                          }))
                        }
                        className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA]"
                      >
                        {services.map((service) => (
                          <option key={service}>{service}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
                        <CalendarDays size={18} className="text-slate-400" />
                        <input
                          type="date"
                          min={todayInputValue()}
                          value={bookingForm.date}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              date: event.target.value,
                            }))
                          }
                          className="min-h-12 min-w-0 flex-1 outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4">
                        <Clock size={18} className="text-slate-400" />
                        <input
                          type="time"
                          value={bookingForm.time}
                          onChange={(event) =>
                            setBookingForm((current) => ({
                              ...current,
                              time: event.target.value,
                            }))
                          }
                          className="min-h-12 min-w-0 flex-1 outline-none"
                        />
                      </label>
                      <textarea
                        value={bookingForm.notes}
                        onChange={(event) =>
                          setBookingForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Observações: preferência, comportamento, taxi pet..."
                        className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#8A0EEA] sm:col-span-2"
                      />
                    </div>
                  </section>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#8A0EEA] px-5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-[#7600d1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={20} />
                    {loading ? "Enviando..." : "Enviar para aprovação"}
                  </button>
                </form>
              )}

              {step === "done" && (
                <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={42} />
                  </div>
                  <h2 className="mt-6 text-3xl font-black">
                    Solicitação enviada!
                  </h2>
                  <p className="mt-3 max-w-md text-slate-500">
                    Recebemos seu pedido de agendamento. A equipe vai conferir a
                    agenda e confirmar pelo WhatsApp.
                  </p>
                  {appointmentId && (
                    <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      Protocolo #{appointmentId}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="mt-8 rounded-2xl border border-[#8A0EEA]/20 px-5 py-3 font-bold text-[#8A0EEA] hover:bg-purple-50"
                  >
                    Fazer outra solicitação
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
