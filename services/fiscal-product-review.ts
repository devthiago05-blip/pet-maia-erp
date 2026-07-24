import { supabase } from "@/lib/supabase";
import type { RecognizedPurchaseItem } from "@/types/purchase-recognition";

export interface PurchaseFiscalSuggestion {
  productId: number;
  item: RecognizedPurchaseItem;
}

async function authorizationHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada.");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function savePurchaseFiscalSuggestions(input: {
  purchaseId: number;
  documentNumber?: string;
  suggestions: PurchaseFiscalSuggestion[];
}) {
  const response = await fetch("/api/fiscal/product-reviews", {
    method: "POST",
    headers: {
      ...(await authorizationHeader()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as {
    saved?: number;
    error?: string;
  };
  if (!response.ok) throw new Error(payload.error || "Erro ao salvar sugestões fiscais.");
  return payload;
}

export async function approveProductFiscalReview(
  productId: number,
  notes?: string,
) {
  const response = await fetch("/api/fiscal/product-reviews", {
    method: "PATCH",
    headers: {
      ...(await authorizationHeader()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, notes }),
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Erro ao aprovar tributação.");
  return payload;
}
