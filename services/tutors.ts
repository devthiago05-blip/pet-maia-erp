import { supabase } from "@/lib/supabase";
import type { NewTutorInput, Tutor } from "@/types/domain";

function normalizeCpf(value: string | null | undefined) {
  const digits = (value || "").replace(/\D/g, "");

  return digits || null;
}

function hasPlaceholderPhone(phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "");

  return digits === "85999999999" || digits === "5585999999999";
}

export async function fetchTutors() {
  const response = await supabase
    .from("tutors")
    .select("*, pets(id, ativo)")
    .order("nome", { ascending: true });

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
    .ilike("telefone", "%99999%")
    .order("nome", { ascending: true });

  if (!response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.filter((tutor) =>
      hasPlaceholderPhone(tutor.telefone),
    ) as Tutor[],
  };
}

export async function createTutor(tutor: NewTutorInput) {
  return supabase
    .from("tutors")
    .insert([
      {
        nome: tutor.nome.trim().toUpperCase(),
        telefone: tutor.telefone,
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
      telefone: tutor.telefone,
      cpf: normalizeCpf(tutor.cpf),
      email: tutor.email,
      endereco: tutor.endereco?.trim().toUpperCase(),
    })
    .eq("id", tutor.id);
}

export async function deleteTutor(id: number) {
  return supabase.from("tutors").delete().eq("id", id);
}
