import { supabase } from "@/lib/supabase";
import type {
  GroomingPlan,
  GroomingPlanSubscription,
  GroomingPlanUsage,
  NewGroomingPlanInput,
  NewGroomingPlanSubscriptionInput,
  NewGroomingPlanUsageInput,
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

export async function fetchGroomingPlanSubscriptions() {
  return supabase
    .from("grooming_plan_subscriptions")
    .select(
      `
        *,
        grooming_plans!grooming_plan_subscriptions_plan_id_fkey (
          id,
          name
        ),
        pets!grooming_plan_subscriptions_pet_id_fkey (
          id,
          nome,
          tutor_id,
          tutors!pets_tutor_id_fkey (
            id,
            nome,
            telefone
          )
        ),
        grooming_plan_usage!grooming_plan_usage_subscription_id_fkey (
          id,
          subscription_id,
          appointment_id,
          usage_date,
          usage_type,
          benefit_name,
          quantity,
          notes,
          created_at
        )
      `,
    )
    .order("status", { ascending: true })
    .order("next_billing_date", { ascending: true, nullsFirst: false })
    .returns<GroomingPlanSubscription[]>();
}

function buildSubscriptionPayload(input: NewGroomingPlanSubscriptionInput) {
  return {
    plan_id: input.planId,
    tutor_id: input.tutorId || null,
    pet_id: input.petId,
    start_date: input.startDate,
    end_date: input.endDate || null,
    next_billing_date: input.nextBillingDate || null,
    status: input.status,
    monthly_price: input.monthlyPrice,
    baths_per_month: input.bathsPerMonth,
    free_benefits: input.freeBenefits,
    notes: input.notes?.trim() || null,
  };
}

export async function createGroomingPlanSubscription(
  input: NewGroomingPlanSubscriptionInput,
) {
  return supabase
    .from("grooming_plan_subscriptions")
    .insert([buildSubscriptionPayload(input)]);
}

export async function updateGroomingPlanSubscription(
  id: number,
  input: NewGroomingPlanSubscriptionInput,
) {
  return supabase
    .from("grooming_plan_subscriptions")
    .update(buildSubscriptionPayload(input))
    .eq("id", id);
}

export async function deleteGroomingPlanSubscription(id: number) {
  return supabase.from("grooming_plan_subscriptions").delete().eq("id", id);
}

export async function createGroomingPlanUsage(
  input: NewGroomingPlanUsageInput,
) {
  return supabase.from("grooming_plan_usage").insert([
    {
      subscription_id: input.subscriptionId,
      appointment_id: input.appointmentId || null,
      usage_date: input.usageDate,
      usage_type: input.usageType,
      benefit_name: input.benefitName?.trim() || null,
      quantity: input.quantity,
      notes: input.notes?.trim() || null,
    },
  ]);
}

export async function deleteGroomingPlanUsage(id: number) {
  return supabase.from("grooming_plan_usage").delete().eq("id", id);
}

export function sortGroomingPlanUsage(usages: GroomingPlanUsage[]) {
  return [...usages].sort((first, second) => {
    const dateComparison = second.usage_date.localeCompare(first.usage_date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    return second.id - first.id;
  });
}
