import { supabase } from "@/lib/supabase";
import type { NewPetInput, Pet } from "@/types/domain";

export async function fetchPets() {
  return supabase.from("pets").select(
    `
      *,
      tutors (
        nome
      )
    `,
  );
}

export async function fetchPetById(id: number) {
  return supabase
    .from("pets")
    .select(
      `
      *,
      tutors (
        nome,
        telefone,
        email
      )
    `,
    )
    .eq("id", id)
    .single();
}

export async function createPet(pet: NewPetInput) {
  return supabase.from("pets").insert([
    {
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idade: pet.idade,
      tutor_id: Number(pet.tutorId),
    },
  ]);
}

export async function updatePet(pet: Pet & { tutorId?: string }) {
  return supabase
    .from("pets")
    .update({
      nome: pet.nome,
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idade: pet.idade,
      tutor_id: Number(pet.tutorId),
    })
    .eq("id", pet.id);
}

export async function deletePet(id: number) {
  return supabase.from("pets").delete().eq("id", id);
}
