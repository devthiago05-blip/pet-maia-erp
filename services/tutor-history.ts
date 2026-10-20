import { supabase } from "@/lib/supabase";
import type {
  tutorHistoryAccess,
  TutorHistoryAppointment,
} from "@/lib/tutor-history";
import type { FinancialEntry, Pet, Tutor } from "@/types/domain";

export interface TutorDetails {
  tutor: Tutor;
  pets: Pet[];
  appointments: TutorHistoryAppointment[];
  financialEntries: FinancialEntry[];
}

// Explicit pagination avoids silently truncating a long service history at the API limit.
async function allPages<T>(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
) {
  const result: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await query(from, from + 499);
    if (error) throw new Error(error.message);
    result.push(...(data || []));
    if (!data || data.length < 500) return result;
  }
}

export async function fetchTutorDetails(
  tutorId: number,
  access: ReturnType<typeof tutorHistoryAccess>,
): Promise<TutorDetails> {
  const tutorResponse = await supabase
    .from("tutors")
    .select("*")
    .eq("id", tutorId)
    .single();
  if (tutorResponse.error || !tutorResponse.data)
    throw new Error("Tutor indisponível.");
  const pets = await allPages<Pet>((from, to) =>
    supabase
      .from("pets")
      .select("id, nome, especie, raca, porte, sexo, idade, tutor_id")
      .eq("tutor_id", tutorId)
      .order("nome")
      .order("id")
      .range(from, to),
  );
  const appointments: TutorHistoryAppointment[] = [];
  const financialEntries: FinancialEntry[] = [];
  if (access.history) {
    // Keep URLs bounded even for tutors with a large number of pets.
    for (let offset = 0; offset < pets.length; offset += 100) {
      const ids = pets.slice(offset, offset + 100).map((pet) => pet.id);
      appointments.push(
        ...(await allPages<TutorHistoryAppointment>((from, to) =>
          supabase
            .from("appointments")
            .select(access.services ? "*, appointment_services(*)" : "*")
            .in("pet_id", ids)
            .order("data", { ascending: false })
            .order("hora", { ascending: false })
            .order("id", { ascending: false })
            .range(from, to)
            .returns<TutorHistoryAppointment[]>(),
        )),
      );
    }
    if (access.financial) {
      for (let offset = 0; offset < appointments.length; offset += 100) {
        const ids = appointments
          .slice(offset, offset + 100)
          .map((item) => item.id);
        financialEntries.push(
          ...(await allPages<FinancialEntry>((from, to) =>
            supabase
              .from("financial_entries")
              .select("*")
              .eq("origem", "appointment")
              .eq("tipo", "Receita")
              .in("referencia_id", ids)
              .order("id", { ascending: false })
              .range(from, to),
          )),
        );
      }
    }
  }
  return {
    tutor: tutorResponse.data as Tutor,
    pets,
    appointments,
    financialEntries,
  };
}
