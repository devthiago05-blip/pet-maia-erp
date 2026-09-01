import type {
  PaymentMockScenario,
  PaymentProvider,
  PaymentRequest,
  PaymentResult,
} from "@/lib/payments/types";

export class MockSmartPOSAdapter implements PaymentProvider {
  private readonly transactions = new Map<string, PaymentResult>();

  constructor(private readonly scenario: PaymentMockScenario = "approved") {}

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      throw new Error("Valor do pagamento inválido.");
    }
    if (this.scenario === "timeout") {
      throw new Error("[PAYMENT][MOCK][TIMEOUT] Tempo limite excedido.");
    }
    if (this.scenario === "connection_error") {
      throw new Error("[PAYMENT][MOCK][CONNECTION] SmartPOS indisponível.");
    }

    const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const status = this.scenario;
    const result: PaymentResult = {
      provider: "mock",
      status,
      paymentType: request.paymentType,
      amount: request.amount,
      transactionId,
      authorizationCode: status === "approved" ? "123456" : undefined,
      terminalId: "TESTE01",
      acquirerCnpj: status === "approved" ? "00000000000000" : undefined,
      cardBrand:
        request.paymentType === "Crédito" || request.paymentType === "Débito"
          ? "TESTE"
          : undefined,
      externalReference: request.externalReference,
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(transactionId, result);
    return result;
  }

  async cancel(transactionId: string): Promise<PaymentResult> {
    const current = this.transactions.get(transactionId);
    if (!current) throw new Error("Transação mock não encontrada.");
    const cancelled = {
      ...current,
      status: "cancelled" as const,
      createdAt: new Date().toISOString(),
    };
    this.transactions.set(transactionId, cancelled);
    return cancelled;
  }

  async query(transactionId: string): Promise<PaymentResult> {
    const result = this.transactions.get(transactionId);
    if (!result) throw new Error("Transação mock não encontrada.");
    return result;
  }
}
