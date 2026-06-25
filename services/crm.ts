import { supabase } from "@/lib/supabase";
import type { CrmInteractionInput } from "@/types/domain";

export async function fetchCrmTutors() {
  return supabase
    .from("tutors")
    .select(
      `
        *,
        pets (
          id,
          nome
        ),
        crm_interactions (*)
      `,
    )
    .order("nome");
}

export async function createCrmInteraction(input: CrmInteractionInput) {
  return supabase.from("crm_interactions").insert([
    {
      tutor_id: input.tutorId,
      contact_date: input.contactDate,
      channel: input.channel,
      subject: input.subject,
      notes: input.notes || null,
      next_action_date: input.nextActionDate || null,
      status: input.status,
      responsible_name: input.responsibleName,
    },
  ]);
}
