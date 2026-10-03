import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const fallbackServices = ["Banho", "Banho + Tosa", "Consulta", "Vacina"];

export async function GET() {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("services")
    .select("nome")
    .order("nome", { ascending: true })
    .returns<Array<{ nome: string }>>();

  if (error) {
    console.error(error);
    return NextResponse.json({ services: fallbackServices });
  }

  const services = Array.from(
    new Set((data || []).map((service) => service.nome).filter(Boolean)),
  );

  return NextResponse.json({
    services: services.length > 0 ? services : fallbackServices,
  });
}

