import { supabase } from "@/lib/supabase";
import type {
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
} from "@/types/domain";

export async function fetchClinicalRecordsByPet(petId: number) {
  return supabase
    .from("clinical_records")
    .select(
      `
        *,
        clinical_prescriptions (*)
      `,
    )
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
      anamnesis: record.anamnesis || null,
      allergies: record.allergies || null,
      current_medications: record.currentMedications || null,
      diagnosis: record.diagnosis || null,
      conduct: record.conduct || null,
      return_date: record.returnDate || null,
    },
  ]);
}

export async function createClinicalPrescription(
  prescription: NewClinicalPrescriptionInput,
) {
  return supabase.from("clinical_prescriptions").insert([
    {
      clinical_record_id: prescription.clinicalRecordId,
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration || null,
      instructions: prescription.instructions || null,
    },
  ]);
}
