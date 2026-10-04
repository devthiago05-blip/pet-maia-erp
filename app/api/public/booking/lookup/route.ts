import { NextResponse } from "next/server";

import {
  normalizeDdd,
  normalizePublicBookingPhoneInput,
  phoneMatchesPublicBookingInput,
} from "@/lib/public-booking";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

interface TutorRow {
  id: number;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  pets?: Array<{
    id: number;
    nome: string;
    especie?: string | null;
    raca?: string | null;
    porte?: string | null;
    sexo?: string | null;
    idade?: string | null;
    tutor_id?: number | null;
  }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phoneInput = normalizePublicBookingPhoneInput(
    searchParams.get("phone"),
  );
  const phone = phoneInput.lastNine;
  const ddd = phoneInput.ddd || normalizeDdd(searchParams.get("ddd"));

  if (!phone) {
    return NextResponse.json(
      {
        error:
          "Informe o telefone com DDD, começando com 9. Exemplo: 85988765432.",
      },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("tutors")
    .select(
      `
        id,
        nome,
        telefone,
        email,
        endereco,
        pets (
          id,
          nome,
          especie,
          raca,
          porte,
          sexo,
          idade,
          tutor_id
        )
      `,
    )
    .order("nome", { ascending: true })
    .returns<TutorRow[]>();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível consultar o cadastro." },
      { status: 500 },
    );
  }

  const matches = (data || []).filter((tutor) =>
    phoneMatchesPublicBookingInput(tutor.telefone, phone, ddd),
  );

  if (matches.length > 1 && !ddd) {
    return NextResponse.json({
      found: false,
      needsDdd: true,
      message:
        "Encontramos mais de um cadastro com esse número. Informe o DDD para localizar corretamente.",
    });
  }

  const tutor = matches[0];

  if (!tutor) {
    return NextResponse.json({
      found: false,
      phone,
      ddd,
    });
  }

  return NextResponse.json({
    found: true,
    tutor: {
      id: tutor.id,
      nome: tutor.nome,
      telefone: tutor.telefone || "",
      email: tutor.email || "",
      endereco: tutor.endereco || "",
    },
    pets: (tutor.pets || []).map((pet) => ({
      id: pet.id,
      nome: pet.nome,
      especie: pet.especie || "",
      raca: pet.raca || "",
      porte: pet.porte || "",
      sexo: pet.sexo || "",
      idade: pet.idade || "",
    })),
  });
}
