import "server-only";

import { MockSmartPOSAdapter } from "@/lib/payments/adapters/mock-smartpos-adapter";
import { getPaymentConfig } from "@/lib/payments/config";
import type { PaymentProvider, PaymentRequest } from "@/lib/payments/types";

function provider(): PaymentProvider {
  const config = getPaymentConfig();
  if (config.provider === "mock")
    return new MockSmartPOSAdapter(config.scenario);
  throw new Error(
    "Provedor SmartPOS real ainda não habilitado. Configure PAYMENT_PROVIDER=mock.",
  );
}

export async function processIntegratedPayment(request: PaymentRequest) {
  const config = getPaymentConfig();
  if (!config.enabled) {
    throw new Error("Integração de pagamento está desativada.");
  }
  return provider().charge(request);
}
