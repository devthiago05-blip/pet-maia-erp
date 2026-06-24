import { supabase } from "@/lib/supabase";
import type {
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetVaccinationInput,
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

export async function fetchPetVaccinations(petId: number) {
  return supabase
    .from("pet_vaccinations")
    .select("*")
    .eq("pet_id", petId)
    .order("application_date", { ascending: false });
}

export async function createPetVaccination(
  vaccination: NewPetVaccinationInput,
) {
  return supabase.from("pet_vaccinations").insert([
    {
      pet_id: vaccination.petId,
      vaccine_name: vaccination.vaccineName,
      manufacturer: vaccination.manufacturer || null,
      batch_number: vaccination.batchNumber || null,
      application_date: vaccination.applicationDate,
      next_dose_date: vaccination.nextDoseDate || null,
      professional_name: vaccination.professionalName,
      notes: vaccination.notes || null,
    },
  ]);
}

export async function fetchClinicPatients() {
  return supabase
    .from("pets")
    .select(
      `
        *,
        tutors (
          nome,
          telefone
        ),
        clinical_records (
          consultation_date,
          professional_name,
          return_date
        ),
        pet_vaccinations (
          next_dose_date
        )
      `,
    )
    .order("nome");
}
