import { supabase } from "@/lib/supabase";

export interface BarcodeLookupResult {
  found: boolean;
  code: string;
  name?: string;
  brand?: string;
  categories?: string;
  quantity?: string;
  imageUrl?: string;
  ncmSuggestion?: string | null;
  ncmReason?: string | null;
  source?: string;
  error?: string;
}

export async function lookupProductBarcode(code: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada. Entre novamente.");

  const response = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const payload = (await response.json()) as BarcodeLookupResult;
  if (!response.ok) throw new Error(payload.error || "Não foi possível consultar o código.");
  return payload;
}
