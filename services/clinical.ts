import { supabase } from "@/lib/supabase";
import type {
  ClinicalAttachment,
  ClinicalDocumentInput,
  ClinicalExamInput,
  NewClinicalPrescriptionInput,
  NewClinicalRecordInput,
  NewPetVaccinationInput,
} from "@/types/domain";

const clinicalAttachmentsBucket = "clinical-attachments";

async function getCurrentProfessional() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, crmv: null };
  }

  const { data } = await supabase
    .from("user_profiles")
    .select("crmv")
    .eq("id", user.id)
    .single();

  return { userId: user.id, crmv: data?.crmv || null };
}

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

export async function saveClinicalRecord(record: NewClinicalRecordInput) {
  const professional = await getCurrentProfessional();

  const values = {
    pet_id: record.petId,
    professional_id: professional.userId,
    professional_name: record.professionalName,
    professional_crmv: professional.crmv,
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
    updated_at: new Date().toISOString(),
  };

  return record.id
    ? supabase.from("clinical_records").update(values).eq("id", record.id)
    : supabase.from("clinical_records").insert([values]);
}

export async function saveClinicalPrescription(
  prescription: NewClinicalPrescriptionInput,
) {
  const values = {
    clinical_record_id: prescription.clinicalRecordId,
    medication: prescription.medication,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    duration: prescription.duration || null,
    instructions: prescription.instructions || null,
    item_type: prescription.itemType,
    prescription_type: prescription.prescriptionType,
    pharmacy_type: prescription.pharmacyType || null,
    administration_route: prescription.administrationRoute || null,
    quantity: prescription.quantity || null,
    quantity_unit: prescription.quantityUnit || null,
    pharmaceutical_form: prescription.pharmaceuticalForm || null,
    composition: prescription.composition || null,
  };

  return prescription.id
    ? supabase
        .from("clinical_prescriptions")
        .update(values)
        .eq("id", prescription.id)
    : supabase.from("clinical_prescriptions").insert([values]);
}

export async function deleteClinicalPrescription(id: number) {
  return supabase.from("clinical_prescriptions").delete().eq("id", id);
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

export async function deletePetVaccination(id: number) {
  return supabase.from("pet_vaccinations").delete().eq("id", id);
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
          id,
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

export async function fetchClinicalExamsByPet(petId: number) {
  return supabase
    .from("clinical_exams")
    .select("*")
    .eq("pet_id", petId)
    .order("request_date", { ascending: false });
}

export async function saveClinicalExam(input: ClinicalExamInput) {
  const values = {
    pet_id: input.petId,
    exam_name: input.examName,
    request_date: input.requestDate,
    collection_date: input.collectionDate || null,
    result_date: input.resultDate || null,
    laboratory: input.laboratory || null,
    status: input.status,
    result: input.result || null,
    notes: input.notes || null,
    professional_name: input.professionalName,
    updated_at: new Date().toISOString(),
  };

  return input.id
    ? supabase.from("clinical_exams").update(values).eq("id", input.id)
    : supabase.from("clinical_exams").insert([values]);
}

export async function deleteClinicalExam(id: number) {
  return supabase.from("clinical_exams").delete().eq("id", id);
}

export async function fetchClinicalAttachments(examId: number) {
  return supabase
    .from("clinical_attachments")
    .select("*")
    .eq("clinical_exam_id", examId)
    .order("created_at", { ascending: false })
    .returns<ClinicalAttachment[]>();
}

export async function uploadClinicalAttachment({
  petId,
  examId,
  file,
}: {
  petId: number;
  examId: number;
  file: File;
}) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "file";
  const storagePath = `${petId}/${crypto.randomUUID()}.${extension}`;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uploadResponse = await supabase.storage
    .from(clinicalAttachmentsBucket)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadResponse.error) {
    return { data: null, error: uploadResponse.error };
  }

  const databaseResponse = await supabase
    .from("clinical_attachments")
    .insert({
      pet_id: petId,
      clinical_exam_id: examId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: user?.id || null,
    })
    .select("*")
    .single<ClinicalAttachment>();

  if (databaseResponse.error) {
    await supabase.storage
      .from(clinicalAttachmentsBucket)
      .remove([storagePath]);
  }

  return databaseResponse;
}

export async function createClinicalAttachmentUrl(storagePath: string) {
  return supabase.storage
    .from(clinicalAttachmentsBucket)
    .createSignedUrl(storagePath, 300);
}

export async function deleteClinicalAttachment(attachment: ClinicalAttachment) {
  const storageResponse = await supabase.storage
    .from(clinicalAttachmentsBucket)
    .remove([attachment.storage_path]);

  if (storageResponse.error) {
    return storageResponse;
  }

  return supabase.from("clinical_attachments").delete().eq("id", attachment.id);
}

export async function fetchClinicalDocumentsByPet(petId: number) {
  return supabase
    .from("clinical_documents")
    .select("*")
    .eq("pet_id", petId)
    .order("issue_date", { ascending: false });
}

export async function createClinicalDocument(input: ClinicalDocumentInput) {
  const professional = await getCurrentProfessional();

  return supabase.from("clinical_documents").insert([
    {
      pet_id: input.petId,
      document_type: input.documentType,
      title: input.title,
      content: input.content,
      issue_date: input.issueDate,
      professional_name: input.professionalName,
      professional_crmv: professional.crmv,
    },
  ]);
}

export async function deleteClinicalDocument(id: number) {
  return supabase.from("clinical_documents").delete().eq("id", id);
}
