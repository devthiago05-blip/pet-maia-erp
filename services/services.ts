import { supabase } from "@/lib/supabase";

export async function fetchServices() {
  return supabase.from("services").select("*");
}
