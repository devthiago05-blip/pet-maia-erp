import { NextResponse } from "next/server";

import {
  formatBrazilianMobilePhone,
  normalizeDdd,
  normalizeLastNinePhone,
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

  const phone = normalizeLastNinePhone(payload.phone);
  const ddd = normalizeDdd(payload.ddd);
  const tutorId = normalizeId(payload.tutorId);
  const petId = normalizeId(payload.petId);
  const serviceName = requiredText(payload.serviceName);
  const date = requiredText(payload.date);
  const time = requiredText(payload.time);

  if (!phone) {
    return jsonError(
      "Informe o telefone sem DDD com 9 dígitos, começando com 9.",
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
  } else {
    const tutorName = requiredText(payload.tutor?.nome);
    const tutorAddress = requiredText(payload.tutor?.endereco);

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

  let pet: PetRow | null = null;

  if (petId) {
    const { data, error } = await admin
      .from("pets")
      .select("id, nome, tutor_id")
      .eq("id", petId)
      .maybeSingle<PetRow>();

    if (error) {
      console.error(error);
      return jsonError("Não foi possível validar o pet.", 500);
    }

    if (!data || Number(data.tutor_id) !== Number(tutor.id)) {
      return jsonError("Pet não encontrado para este tutor.", 404);
    }

    pet = data;
  } else {
    const petName = requiredText(payload.pet?.nome);

    if (!petName) {
      return jsonError("Informe o nome do pet.");
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

    pet = data;
  }

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .insert([
      {
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
      },
    ])
    .select("id")
    .single<{ id: number }>();

  if (appointmentError) {
    console.error(appointmentError);
    return jsonError("Não foi possível criar a solicitação.", 500);
  }

  return NextResponse.json({
    ok: true,
    appointmentId: appointment.id,
    message:
      "Solicitação enviada. A equipe vai conferir a agenda e confirmar pelo WhatsApp.",
  });
}

