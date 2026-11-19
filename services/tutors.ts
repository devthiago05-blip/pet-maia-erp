import { supabase } from "@/lib/supabase";
import { isTutorWithoutPhone, tutorPhonesMatch } from "@/lib/tutor-phone";
import type { NewTutorInput, Tutor } from "@/types/domain";

function normalizeCpf(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");

  return digits || null;
}

export async function fetchTutors(options?: { includeInactive?: boolean }) {
  let query = supabase
    .from("tutors")
    .select("*, pets(id, ativo)");

  if (!options?.includeInactive) {
    query = query.eq("ativo", true);
  }

  const response = await query.order("nome", { ascending: true });

  if (!response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.map((tutor) => {
      const pets: Array<{ id: number; ativo?: boolean }> = Array.isArray(
        tutor.pets,
      )
        ? tutor.pets
        : [];
      const activePets = pets.filter((pet) => pet.ativo !== false).length;

      return {
        ...tutor,
        pets: pets.length,
        activePets,
        inactivePets: pets.length - activePets,
      };
    }) as Tutor[],
  };
}

export async function fetchTutorsPendingRegistration() {
  const response = await supabase
    .from("tutors")
    .select("id, nome, telefone, cpf, email, endereco")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (!response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.filter((tutor) =>
      isTutorWithoutPhone(tutor.telefone),
    ) as Tutor[],
  };
}

export async function findTutorByPhone(phone: string, excludeTutorId?: number) {
  if (isTutorWithoutPhone(phone)) {
    return { data: null as Tutor | null, error: null };
  }

  const response = await supabase
    .from("tutors")
    .select("id, nome, telefone")
    .order("nome", { ascending: true });

  if (response.error) {
    return { data: null as Tutor | null, error: response.error };
  }

  const duplicate = response.data?.find(
    (tutor) =>
      tutor.id !== excludeTutorId && tutorPhonesMatch(tutor.telefone, phone),
  );

  return { data: (duplicate as Tutor | undefined) || null, error: null };
}

export async function createTutor(tutor: NewTutorInput) {
  return supabase
    .from("tutors")
    .insert([
      {
        nome: tutor.nome.trim().toUpperCase(),
        telefone: tutor.telefone.trim(),
        cpf: normalizeCpf(tutor.cpf),
        email: tutor.email,
        endereco: tutor.endereco.trim().toUpperCase(),
      },
    ])
    .select("*")
    .single();
}

export async function updateTutor(tutor: Tutor) {
  return supabase
    .from("tutors")
    .update({
      nome: tutor.nome.trim().toUpperCase(),
      telefone: tutor.telefone?.trim() || "",
      cpf: normalizeCpf(tutor.cpf),
      email: tutor.email,
      endereco: tutor.endereco?.trim().toUpperCase(),
    })
    .eq("id", tutor.id);
}

export async function deleteTutor(id: number) {
  return supabase.from("tutors").delete().eq("id", id);
}
