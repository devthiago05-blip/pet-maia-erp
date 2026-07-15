import { supabase } from "@/lib/supabase";
import type { NewPetInput, Pet } from "@/types/domain";

const petPhotosBucket = "pet-photos";

export async function fetchPets() {
  return supabase
    .from("pets")
    .select(
      `
      *,
      tutors (
        nome
      )
    `,
    )
    .order("nome", { ascending: true });
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
        email,
        endereco
      )
    `,
    )
    .eq("id", id)
    .single();
}

export async function createPet(pet: NewPetInput) {
  return supabase.from("pets").insert([
    {
      nome: pet.nome.trim().toUpperCase(),
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idade: pet.idade,
      bath_reminder_interval_days: pet.bathReminderIntervalDays
        ? Number(pet.bathReminderIntervalDays)
        : null,
      photo_url: pet.photoUrl || null,
      tutor_id: Number(pet.tutorId),
    },
  ]);
}

export async function updatePet(pet: Pet & { tutorId?: string }) {
  return supabase
    .from("pets")
    .update({
      nome: pet.nome.trim().toUpperCase(),
      especie: pet.especie,
      raca: pet.raca,
      porte: pet.porte,
      sexo: pet.sexo,
      idade: pet.idade,
      bath_reminder_interval_days: pet.bath_reminder_interval_days ?? null,
      photo_url: pet.photo_url || null,
      tutor_id: Number(pet.tutorId),
    })
    .eq("id", pet.id);
}

export async function uploadPetPhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    return {
      data: null,
      error: new Error("Selecione uma imagem valida."),
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `pets/${crypto.randomUUID()}.${extension}`;
  const uploadResponse = await supabase.storage
    .from(petPhotosBucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResponse.error) {
    return { data: null, error: uploadResponse.error };
  }

  const publicUrlResponse = supabase.storage
    .from(petPhotosBucket)
    .getPublicUrl(storagePath);

  return {
    data: publicUrlResponse.data.publicUrl,
    error: null,
  };
}

export async function deletePet(id: number) {
  return supabase.from("pets").delete().eq("id", id);
}

export async function dismissPetBathReminder(
  petId: number,
  dismissedUntil: string,
) {
  return supabase
    .from("pets")
    .update({ bath_reminder_dismissed_until: dismissedUntil })
    .eq("id", petId);
}
