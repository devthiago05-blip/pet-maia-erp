import { supabase } from "@/lib/supabase";
import type { ClinicSettings } from "@/types/domain";

export async function fetchClinicSettings() {
  return supabase.from("clinic_settings").select("*").eq("id", 1).single();
}

export async function updateClinicSettings(settings: ClinicSettings) {
  return supabase
    .from("clinic_settings")
    .update({
      nome: settings.nome,
      razao_social: settings.razao_social || null,
      cnpj: settings.cnpj || null,
      telefone: settings.telefone || null,
      endereco: settings.endereco || null,
      pix_key: settings.pix_key || null,
      pix_recipient_name: settings.pix_recipient_name || null,
      pix_city: settings.pix_city || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
}

export async function updateProfessionalProfile({
  crmv,
  especialidade,
}: {
  crmv: string;
  especialidade: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Usuário não autenticado.") };
  }

  return supabase
    .from("user_profiles")
    .update({
      crmv: crmv.trim() || null,
      especialidade: especialidade.trim() || null,
    })
    .eq("id", user.id);
}
