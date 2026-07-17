import { supabase } from "@/lib/supabase";
import type { ProductStockAdjustmentInput } from "@/types/domain";

export async function fetchStockProducts() {
  return supabase.from("products").select("*").order("nome");
}

export async function fetchStockMovements() {
  return supabase
    .from("product_stock_movements")
    .select("*, products(id, nome, sku, barcode)")
    .order("created_at", { ascending: false })
    .limit(500);
}

export async function fetchProductBatches() {
  return supabase
    .from("product_batches")
    .select("*, products(id, nome, sku, barcode)")
    .eq("active", true)
    .order("expiration_date", { ascending: true, nullsFirst: false });
}

export async function adjustProductStock(input: ProductStockAdjustmentInput) {
  return supabase.rpc("adjust_product_stock", {
    selected_product_id: input.productId,
    selected_quantity_delta: input.quantityDelta,
    selected_kind: input.kind,
    selected_reason: input.reason,
    selected_batch_number: input.batchNumber || null,
    selected_expiration_date: input.expirationDate || null,
  });
}
