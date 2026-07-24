import type { FiscalProductAssessment } from "@/lib/fiscal-tax";
import { supabase } from "@/lib/supabase";

export interface FiscalReadinessReport {
  generatedAt: string;
  regimeConfirmed: boolean;
  totals: {
    products: number;
    ready: number;
    suggestions: number;
    blocked: number;
  };
  assessments: FiscalProductAssessment[];
  warnings: string[];
}

export async function fetchFiscalReadiness() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada.");

  const response = await fetch("/api/fiscal/readiness", {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const payload = (await response.json()) as FiscalReadinessReport & {
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || "Erro na auditoria tributária.");
  }
  return payload;
}
