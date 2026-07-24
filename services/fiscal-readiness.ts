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
  assessments: Array<
    FiscalProductAssessment & {
      importedReview: {
        status: "pending" | "review" | "approved";
        suggested_ncm: string | null;
        suggested_cest: string | null;
        suggested_cfop: string | null;
        suggested_origin: string | null;
        suggested_csosn_cst: string | null;
        suggested_pis_cst: string | null;
        suggested_cofins_cst: string | null;
        suggested_unit: string | null;
        source_description: string | null;
        source_document_number: string | null;
      } | null;
    }
  >;
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
