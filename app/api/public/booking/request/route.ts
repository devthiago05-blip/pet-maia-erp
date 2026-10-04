import { NextResponse } from "next/server";

import {
  formatBrazilianMobilePhone,
  normalizeDdd,
  normalizePublicBookingPhoneInput,
  phoneMatchesPublicBookingInput,
} from "@/lib/public-booking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface BookingRequestPayload {
  phone?: string;
  ddd?: string;
  tutorId?: number | string;
  tutor?: {
    nome?: string;
    email?: string;
    endereco?: string;
  };
  petId?: number | string;
  petIds?: Array<number | string>;
  pet?: {
    nome?: string;
    especie?: string;
    raca?: string;
    porte?: string;
    sexo?: string;
    idade?: string;
  };
  serviceName?: string;
  date?: string;
  time?: string;
  notes?: string;
}

interface TutorRow {
  id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
}

interface PetRow {
  id: number;
  nome: string;
  tutor_id?: number | null;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function requiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: unknown) {
  const id = Number(value);

  return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeIds(value: unknown) {
  const ids = Array.isArray(value) ? value : [];

  return Array.from(
    new Set(
      ids
        .map((item) => normalizeId(item))
        .filter((item): item is number => Boolean(item)),
    ),
  );
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function buildObservation(payload: {
  phone: string;
  ddd?: string;
  notes?: string;
}) {
  const phoneLine = payload.ddd
    ? `Telefone informado no site: (${payload.ddd}) ${payload.phone.slice(0, 5)}-${payload.phone.slice(5)}`
    : `Telefone informado no site: ${payload.phone}`;
  const notes = requiredText(payload.notes);

  return [
    "Solicitação enviada pelo agendamento online.",
    phoneLine,
    notes ? `Observações do tutor: ${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  let payload: BookingRequestPayload;

  try {
    payload = (await request.json()) as BookingRequestPayload;
  } catch {
    return jsonError("Dados inválidos.");
  }

  const phoneInput = normalizePublicBookingPhoneInput(payload.phone);
  const phone = phoneInput.lastNine;
  const ddd = phoneInput.ddd || normalizeDdd(payload.ddd);
  const tutorId = normalizeId(payload.tutorId);
  const petId = normalizeId(payload.petId);
  const petIds = normalizeIds(payload.petIds);
  const requestedPetIds = Array.from(
    new Set([...(petId ? [petId] : []), ...petIds]),
  );
  const serviceName = requiredText(payload.serviceName);
  const date = requiredText(payload.date);
  const time = requiredText(payload.time);
  const tutorAddress = requiredText(payload.tutor?.endereco);

  if (!phone) {
    return jsonError(
      "Informe o telefone com DDD, começando com 9. Exemplo: 85988765432.",
    );
  }

  if (!serviceName) {
    return jsonError("Escolha o serviço desejado.");
  }

  if (!isDate(date)) {
    return jsonError("Informe a data desejada.");
  }

  if (!isTime(time)) {
    return jsonError("Informe o horário desejado.");
  }

  const admin = createSupabaseAdmin();

  const { data: occupiedAppointment, error: availabilityError } = await admin
    .from("appointments")
    .select("id")
    .eq("data", date)
    .eq("hora", time)
    .neq("status", "Cancelado")
    .limit(1);

  if (availabilityError) {
    console.error(availabilityError);
    return jsonError("Não foi possível validar o horário.", 500);
  }

  if (occupiedAppointment && occupiedAppointment.length > 0) {
    return jsonError(
      "Esse horário acabou de ficar indisponível. Escolha outro horário.",
      409,
    );
  }

  let tutor: TutorRow | null = null;

  if (tutorId) {
    const { data, error } = await admin
      .from("tutors")
      .select("id, nome, telefone, email, endereco")
      .eq("id", tutorId)
      .maybeSingle<TutorRow>();

    if (error) {
      console.error(error);
      return jsonError("Não foi possível validar o tutor.", 500);
    }

    if (!data || !phoneMatchesPublicBookingInput(data.telefone, phone, ddd)) {
      return jsonError("Cadastro não localizado para este telefone.", 404);
    }

    tutor = data;

    if (tutorAddress && tutorAddress !== requiredText(data.endereco)) {
      const { data: updatedTutor, error: updateError } = await admin
        .from("tutors")
        .update({ endereco: tutorAddress.toUpperCase() })
        .eq("id", tutor.id)
        .select("id, nome, telefone, email, endereco")
        .single<TutorRow>();

      if (updateError) {
        console.error(updateError);
        return jsonError("Não foi possível atualizar o endereço.", 500);
      }

      tutor = updatedTutor;
    }
  } else {
    const tutorName = requiredText(payload.tutor?.nome);

    if (!tutorName) {
      return jsonError("Informe o nome do tutor.");
    }

    if (!ddd) {
      return jsonError("Informe o DDD para concluir o cadastro.");
    }

    const { data, error } = await admin
      .from("tutors")
      .insert([
        {
          nome: tutorName.toUpperCase(),
          telefone: formatBrazilianMobilePhone(ddd, phone),
          email: requiredText(payload.tutor?.email) || null,
          endereco: tutorAddress.toUpperCase(),
        },
      ])
      .select("id, nome, telefone, email, endereco")
      .single<TutorRow>();

    if (error) {
      console.error(error);
      return jsonError("Não foi possível criar o cadastro do tutor.", 500);
    }

    tutor = data;
  }

  let petsToSchedule: PetRow[] = [];

  if (requestedPetIds.length > 0) {
    const { data, error } = await admin
      .from("pets")
      .select("id, nome, tutor_id")
      .in("id", requestedPetIds)
      .returns<PetRow[]>();

    if (error) {
      console.error(error);
      return jsonError("Não foi possível validar o pet.", 500);
    }

    const selectedPets = data || [];
    const allPetsBelongToTutor =
      selectedPets.length === requestedPetIds.length &&
      selectedPets.every((item) => Number(item.tutor_id) === Number(tutor.id));

    if (!allPetsBelongToTutor) {
      return jsonError("Pet não encontrado para este tutor.", 404);
    }

    petsToSchedule = selectedPets;
  }

  const petName = requiredText(payload.pet?.nome);

  if (petName) {
    if (!tutor) {
      return jsonError("Tutor não localizado.", 500);
    }

    const { data, error } = await admin
      .from("pets")
      .insert([
        {
          nome: petName.toUpperCase(),
          especie: requiredText(payload.pet?.especie) || "Cachorro",
          raca: requiredText(payload.pet?.raca) || "SRD",
          porte: requiredText(payload.pet?.porte),
          sexo: requiredText(payload.pet?.sexo),
          idade: requiredText(payload.pet?.idade),
          tutor_id: tutor.id,
        },
      ])
      .select("id, nome, tutor_id")
      .single<PetRow>();

    if (error) {
      console.error(error);
      return jsonError("Não foi possível criar o cadastro do pet.", 500);
    }

    petsToSchedule = [...petsToSchedule, data];
  }

  if (petsToSchedule.length === 0) {
    return jsonError("Selecione ou cadastre pelo menos um pet.");
  }

  const { data: appointments, error: appointmentError } = await admin
    .from("appointments")
    .insert(
      petsToSchedule.map((pet) => ({
        pet_id: pet.id,
        servico: serviceName,
        data: date,
        hora: time,
        status: "Pendente",
        observacao: buildObservation({
          phone,
          ddd,
          notes: payload.notes,
        }),
      })),
    )
    .select("id")
    .returns<Array<{ id: number }>>();

  if (appointmentError) {
    console.error(appointmentError);
    return jsonError("Não foi possível criar a solicitação.", 500);
  }

  return NextResponse.json({
    ok: true,
    appointmentId: appointments?.[0]?.id || null,
    appointmentIds: (appointments || []).map((appointment) => appointment.id),
    message:
      "Solicitação enviada. A equipe vai conferir a agenda e confirmar pelo WhatsApp.",
  });
}
