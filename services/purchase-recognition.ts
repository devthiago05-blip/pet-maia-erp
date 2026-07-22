import { supabase } from "@/lib/supabase";

export type PurchaseMappingKind = "pdv" | "grooming";

export function normalizePurchaseDescription(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function fetchPurchaseItemMappings(kind: PurchaseMappingKind) {
  return supabase
    .from("purchase_item_mappings")
    .select("normalized_description,target_id")
    .eq("destination_kind", kind);
}

export async function savePurchaseItemMapping(
  kind: PurchaseMappingKind,
  description: string,
  targetId: number,
) {
  return supabase.from("purchase_item_mappings").upsert(
    {
      destination_kind: kind,
      source_description: description.trim(),
      normalized_description: normalizePurchaseDescription(description),
      target_id: targetId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "destination_kind,normalized_description" },
  );
}
