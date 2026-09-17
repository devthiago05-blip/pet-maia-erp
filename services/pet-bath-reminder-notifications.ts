import { supabase } from "@/lib/supabase";
import type {
  NewPetBathReminderNotificationInput,
  PetBathReminderNotification,
} from "@/types/domain";

export async function fetchPetBathReminderNotifications() {
  return supabase
    .from("pet_bath_reminder_notifications")
    .select("*")
    .order("notified_at", { ascending: false })
    .returns<PetBathReminderNotification[]>();
}

export async function markPetBathReminderNotification(
  input: NewPetBathReminderNotificationInput,
) {
  return supabase
    .from("pet_bath_reminder_notifications")
    .upsert(
      {
        bath_reference_key: input.bathReferenceKey,
        channel: input.channel,
        days_without_bath: input.daysWithoutBath,
        last_bath_date: input.lastBathDate || null,
        message: input.message,
        pet_id: input.petId,
        reminder_level: input.reminderLevel,
        tutor_id: input.tutorId || null,
      },
      {
        onConflict: "pet_id,reminder_level,bath_reference_key",
      },
    )
    .select("*")
    .single<PetBathReminderNotification>();
}

export async function unmarkPetBathReminderNotification(id: number) {
  return supabase
    .from("pet_bath_reminder_notifications")
    .delete()
    .eq("id", id);
}
