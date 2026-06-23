import { supabase } from "@/lib/supabase";
import type { NewServiceInput, Service } from "@/types/domain";

export async function fetchServices() {
  return supabase.from("services").select("*").order("nome");
}

export async function createService(service: NewServiceInput) {
  return supabase.from("services").insert([service]);
}

export async function updateService(service: Service) {
  return supabase
    .from("services")
    .update({
      nome: service.nome,
      preco_pequeno: service.preco_pequeno,
      preco_medio: service.preco_medio,
      preco_grande: service.preco_grande,
    })
    .eq("id", service.id);
}

export async function deleteService(id: number) {
  return supabase.from("services").delete().eq("id", id);
}
