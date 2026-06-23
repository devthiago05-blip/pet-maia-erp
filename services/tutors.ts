import { supabase } from "@/lib/supabase";
import type { NewTutorInput, Tutor } from "@/types/domain";

export async function fetchTutors() {
  return supabase.from("tutors").select("*");
}

export async function createTutor(tutor: NewTutorInput) {
  return supabase.from("tutors").insert([
    {
      nome: tutor.nome,
      telefone: tutor.telefone,
      email: tutor.email,
      endereco: tutor.endereco,
    },
  ]);
}

export async function updateTutor(tutor: Tutor) {
  return supabase
    .from("tutors")
    .update({
      nome: tutor.nome,
      telefone: tutor.telefone,
      email: tutor.email,
      endereco: tutor.endereco,
    })
    .eq("id", tutor.id);
}

export async function deleteTutor(id: number) {
  return supabase.from("tutors").delete().eq("id", id);
}
