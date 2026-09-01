import type { PaymentRequest, PaymentResult } from "@/lib/payments/types";
import { supabase } from "@/lib/supabase";

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada.");
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(payload.error || "Falha no pagamento integrado.");
  return payload as T;
}

export function fetchPaymentIntegrationStatus() {
  return request<{ enabled: boolean; provider: string; nfceEnabled: boolean }>(
    "/api/payments/integration",
    "GET",
  );
}

export function issueNfceForSale(saleId: number) {
  return request<{ cStat: number; message: string; documentId: string }>(
    "/api/fiscal/sales/issue",
    "POST",
    { saleId },
  );
}

export function processCheckoutPayment(payment: PaymentRequest) {
  return request<{
    enabled: boolean;
    result: PaymentResult | null;
    recordId?: string | null;
    persistenceWarning?: string | null;
  }>("/api/payments/integration", "POST", payment);
}

export function linkCheckoutPayments(saleId: number, recordIds: string[]) {
  return request<{ linked: boolean }>("/api/payments/integration", "PATCH", {
    saleId,
    recordIds,
  });
}
