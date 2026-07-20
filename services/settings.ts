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
      inscricao_estadual: settings.inscricao_estadual || null,
      uf: settings.uf || "CE",
      codigo_municipio_ibge: settings.codigo_municipio_ibge || null,
      regime_tributario: settings.regime_tributario || null,
      fiscal_environment: settings.fiscal_environment || "homologacao",
      nfce_series: Number(settings.nfce_series || 1),
      nfce_next_number: Number(settings.nfce_next_number || 1),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
}

export async function updateProfessionalProfile({
  crmv,
  especialidade,
  crmvState,
  mapaRegistration,
  signatureText,
}: {
  crmv: string;
  especialidade: string;
  crmvState: string;
  mapaRegistration: string;
  signatureText: string;
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
      crmv_state: crmvState.trim().toUpperCase() || null,
      mapa_registration: mapaRegistration.trim() || null,
      signature_text: signatureText.trim() || null,
    })
    .eq("id", user.id);
}
