import { supabase } from "@/lib/supabase";
import type { NewTutorInput, Tutor } from "@/types/domain";

export async function fetchTutors() {
  const response = await supabase
    .from("tutors")
    .select("*, pets(count)")
    .order("nome", { ascending: true });

  if (!response.data) {
    return response;
  }

  return {
    ...response,
    data: response.data.map((tutor) => ({
      ...tutor,
      pets: tutor.pets?.[0]?.count ?? 0,
    })) as Tutor[],
  };
}

export async function createTutor(tutor: NewTutorInput) {
  return supabase
    .from("tutors")
    .insert([
      {
        nome: tutor.nome.trim().toUpperCase(),
        telefone: tutor.telefone,
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
      email: tutor.email,
      endereco: tutor.endereco?.trim().toUpperCase(),
    })
    .eq("id", tutor.id);
}

export async function deleteTutor(id: number) {
  return supabase.from("tutors").delete().eq("id", id);
}
