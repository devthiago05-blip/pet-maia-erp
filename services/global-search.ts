import { supabase } from "@/lib/supabase";

export interface GlobalPetResult {
  id: number;
  nome: string;
  especie?: string;
  raca?: string;
  tutors?: { nome?: string } | null;
}

export interface GlobalTutorResult {
  id: number;
  nome: string;
  telefone?: string;
  pets?: Array<{ id: number; nome: string }>;
}

function normalizeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ");
}

export async function searchClinicalRecords({
  search,
  includePets,
  includeTutors,
}: {
  search: string;
  includePets: boolean;
  includeTutors: boolean;
}) {
  const term = normalizeSearchTerm(search);

  if (term.length < 2) {
    return { pets: [], tutors: [], error: null };
  }

  const numericId = /^\d+$/.test(term) ? Number(term) : null;
  const petQuery = supabase
    .from("pets")
    .select("id, nome, especie, raca, tutors (nome)")
    .order("nome")
    .limit(6);
  const tutorQuery = supabase
    .from("tutors")
    .select("id, nome, telefone, pets (id, nome)")
    .ilike("nome", `%${term}%`)
    .order("nome")
    .limit(5);

  const [petResponse, tutorResponse] = await Promise.all([
    includePets
      ? numericId
        ? petQuery.or(`nome.ilike.%${term}%,id.eq.${numericId}`)
        : petQuery.ilike("nome", `%${term}%`)
      : Promise.resolve({ data: [], error: null }),
    includeTutors ? tutorQuery : Promise.resolve({ data: [], error: null }),
  ]);

  const error = petResponse.error || tutorResponse.error;

  return {
    pets: (petResponse.data || []) as GlobalPetResult[],
    tutors: (tutorResponse.data || []) as GlobalTutorResult[],
    error,
  };
}
