import { supabase } from "@/lib/supabase";
import type {
  GroomingPlan,
  NewGroomingPlanInput,
  NewServiceInput,
  Service,
} from "@/types/domain";

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

export async function fetchGroomingPlans() {
  return supabase
    .from("grooming_plans")
    .select("*")
    .order("active", { ascending: false })
    .order("name", { ascending: true })
    .returns<GroomingPlan[]>();
}

export async function createGroomingPlan(plan: NewGroomingPlanInput) {
  return supabase.from("grooming_plans").insert([
    {
      name: plan.name.trim(),
      monthly_price: plan.monthlyPrice,
      baths_per_month: plan.bathsPerMonth,
      free_benefits: plan.freeBenefits,
      notes: plan.notes?.trim() || null,
      active: plan.active,
    },
  ]);
}

export async function updateGroomingPlan(plan: GroomingPlan) {
  return supabase
    .from("grooming_plans")
    .update({
      name: plan.name.trim(),
      monthly_price: plan.monthly_price,
      baths_per_month: plan.baths_per_month,
      free_benefits: plan.free_benefits,
      notes: plan.notes?.trim() || null,
      active: plan.active,
    })
    .eq("id", plan.id);
}

export async function deleteGroomingPlan(id: number) {
  return supabase.from("grooming_plans").delete().eq("id", id);
}
