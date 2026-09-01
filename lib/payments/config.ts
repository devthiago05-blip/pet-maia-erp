import "server-only";

import type {
  PaymentMockScenario,
  PaymentProviderName,
} from "@/lib/payments/types";

export function getPaymentConfig(env: NodeJS.ProcessEnv = process.env) {
  const provider: PaymentProviderName =
    env.PAYMENT_PROVIDER === "mercado_pago" ||
    env.PAYMENT_PROVIDER === "stone" ||
    env.PAYMENT_PROVIDER === "tef"
      ? env.PAYMENT_PROVIDER
      : "mock";
  const allowedScenarios: PaymentMockScenario[] = [
    "approved",
    "declined",
    "cancelled",
    "pending",
    "timeout",
    "connection_error",
  ];
  const scenario = allowedScenarios.includes(
    env.PAYMENT_MOCK_SCENARIO as PaymentMockScenario,
  )
    ? (env.PAYMENT_MOCK_SCENARIO as PaymentMockScenario)
    : "approved";

  return {
    enabled: env.PAYMENT_INTEGRATION_ENABLED === "true",
    provider,
    scenario,
  };
}
