import { describe, expect, it } from "vitest";

import { SefazMockAdapter } from "@/lib/nfce/adapters/sefaz-mock-adapter";

const request = {
  documentId: "doc-test",
  accessKey: "23260812345678000199650010000000011000000015",
  xml: "<NFe />",
};

describe("SefazMockAdapter", () => {
  it.each([
    ["authorized", 100],
    ["duplicate", 204],
    ["invalid_schema", 215],
    ["issuer_disabled", 203],
    ["payment_rejected", 391],
  ] as const)("simula %s", async (scenario, cStat) => {
    const response = await new SefazMockAdapter(scenario).authorize(request);
    expect(response.cStat).toBe(cStat);
  });

  it("simula indisponibilidade", async () => {
    await expect(
      new SefazMockAdapter("unavailable").authorize(request),
    ).rejects.toThrow("SEFAZ indisponível");
  });

  it("autoriza, consulta e cancela uma nota mock", async () => {
    const adapter = new SefazMockAdapter();
    const authorization = await adapter.authorize(request);
    expect((await adapter.query(request.accessKey)).cStat).toBe(100);

    const cancellation = await adapter.cancel({
      accessKey: request.accessKey,
      protocol: authorization.protocol!,
      justification: "Erro identificado na operação de venda",
    });
    expect(cancellation.cStat).toBe(135);
  });
});
