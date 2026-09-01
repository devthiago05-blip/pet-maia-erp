import { describe, expect, it } from "vitest";

import { MockSmartPOSAdapter } from "@/lib/payments/adapters/mock-smartpos-adapter";

const request = {
  amount: 150,
  paymentType: "PIX" as const,
  externalReference: "VENDA-TESTE",
};

describe("MockSmartPOSAdapter", () => {
  it.each([
    ["approved", "approved"],
    ["declined", "declined"],
    ["cancelled", "cancelled"],
    ["pending", "pending"],
  ] as const)("simula %s", async (scenario, status) => {
    const result = await new MockSmartPOSAdapter(scenario).charge(request);
    expect(result.status).toBe(status);
    expect(result.amount).toBe(150);
    expect(result.terminalId).toBe("TESTE01");
  });

  it("simula timeout e erro de conexão", async () => {
    await expect(
      new MockSmartPOSAdapter("timeout").charge(request),
    ).rejects.toThrow("Tempo limite");
    await expect(
      new MockSmartPOSAdapter("connection_error").charge(request),
    ).rejects.toThrow("SmartPOS indisponível");
  });

  it("consulta e cancela transação mock", async () => {
    const adapter = new MockSmartPOSAdapter();
    const payment = await adapter.charge(request);
    expect((await adapter.query(payment.transactionId!)).status).toBe(
      "approved",
    );
    expect((await adapter.cancel(payment.transactionId!)).status).toBe(
      "cancelled",
    );
  });
});
