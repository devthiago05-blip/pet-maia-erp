import { supabase } from "@/lib/supabase";
import type { NewClinicalRecordInput } from "@/types/domain";

export async function fetchClinicalRecordsByPet(petId: number) {
  return supabase
    .from("clinical_records")
    .select("*")
    .eq("pet_id", petId)
    .order("consultation_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function createClinicalRecord(record: NewClinicalRecordInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabase.from("clinical_records").insert([
    {
      pet_id: record.petId,
      professional_id: user?.id || null,
      professional_name: record.professionalName,
      consultation_date: record.consultationDate,
      weight_kg: record.weightKg || null,
      temperature_c: record.temperatureC || null,
      main_complaint: record.mainComplaint,
      diagnosis: record.diagnosis || null,
      conduct: record.conduct || null,
      return_date: record.returnDate || null,
    },
  ]);
}
