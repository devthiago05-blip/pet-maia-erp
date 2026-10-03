import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const defaultTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function todayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || "";

  if (!isDate(date)) {
    return NextResponse.json(
      { error: "Informe uma data válida." },
      { status: 400 },
    );
  }

  if (date < todayInputValue()) {
    return NextResponse.json({
      date,
      slots: defaultTimeSlots,
      occupiedTimes: [],
      availableTimes: [],
    });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("appointments")
    .select("hora,status")
    .eq("data", date)
    .neq("status", "Cancelado")
    .returns<Array<{ hora: string | null; status: string }>>();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Não foi possível consultar a disponibilidade." },
      { status: 500 },
    );
  }

  const occupiedTimes = Array.from(
    new Set((data || []).map((item) => item.hora?.slice(0, 5)).filter(Boolean)),
  ) as string[];
  const occupiedSet = new Set(occupiedTimes);

  return NextResponse.json({
    date,
    slots: defaultTimeSlots,
    occupiedTimes,
    availableTimes: defaultTimeSlots.filter((slot) => !occupiedSet.has(slot)),
  });
}

