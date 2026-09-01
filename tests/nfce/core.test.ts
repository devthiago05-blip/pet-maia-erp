import { describe, expect, it } from "vitest";

import {
  calculateAccessKeyDigit,
  generateNfceAccessKey,
} from "@/lib/nfce/access-key";
import { generateDanfeMock } from "@/lib/nfce/danfe";
import { sanitizeFiscalMetadata } from "@/lib/nfce/logger";
import { signXmlMock } from "@/lib/nfce/mock-signature";
import { calculateNfceTotals } from "@/lib/nfce/money";
import { buildMockQrCodePayload } from "@/lib/nfce/qr-code";
import type { NfceBuildInput } from "@/lib/nfce/types";
import { validateFiscalProduct } from "@/lib/nfce/validation";
import { buildNfceXml } from "@/lib/nfce/xml-builder";

const input: NfceBuildInput = {
  environment: "mock",
  ufCode: "23",
  municipalityCode: "2304400",
  issuer: {
    cnpj: "00000000000000",
    legalName: "EMITENTE MOCK",
    stateRegistration: "000000000",
    taxRegime: "1",
    address: "RUA MOCK",
    number: "1",
    district: "TESTE",
    city: "FORTALEZA",
    state: "CE",
    postalCode: "60000000",
  },
  number: 125,
  series: 1,
  issuedAt: new Date("2026-08-15T12:00:00-03:00"),
  items: [
    {
      productId: 1,
      code: "P1",
      description: "PRODUTO MOCK",
      quantity: 2,
      unitPrice: 75,
      discount: 10,
      profile: {
        productId: 1,
        ncm: "23091000",
        cfop: "5102",
        csosn: "102",
        origin: "0",
        commercialUnit: "UN",
        taxUnit: "UN",
        pisCst: "49",
        pisRate: 0,
        cofinsCst: "49",
        cofinsRate: 0,
        taxStatus: "complete",
        accountantValidated: true,
      },
    },
  ],
  payments: [
    {
      method: "Crédito",
      amount: 140,
      integrated: true,
      authorizationCode: "123456",
      acquirerCnpj: "00000000000000",
    },
  ],
};

describe("núcleo NFC-e MOCK", () => {
  it("calcula total e desconto com arredondamento monetário", () => {
    expect(calculateNfceTotals(input.items)).toEqual({
      subtotal: 150,
      discount: 10,
      total: 140,
    });
  });

  it("gera chave de acesso de 44 dígitos com DV válido", () => {
    const key = generateNfceAccessKey({
      ufCode: input.ufCode,
      issuedAt: input.issuedAt,
      cnpj: input.issuer.cnpj,
      series: input.series,
      number: input.number,
    });
    expect(key).toMatch(/^\d{44}$/);
    expect(Number(key.at(-1))).toBe(calculateAccessKeyDigit(key.slice(0, 43)));
  });

  it("gera XML 4.00 com pagamento integrado e marca de homologação", () => {
    const result = buildNfceXml(input);
    expect(result.xml).toContain('versao="4.00"');
    expect(result.xml).toContain("<mod>65</mod>");
    expect(result.xml).toContain("<tpIntegra>1</tpIntegra>");
    expect(result.xml).toContain("SEM VALIDADE FISCAL");
  });

  it("bloqueia produto não validado pelo contador", () => {
    expect(
      validateFiscalProduct(
        { ...input.items[0].profile, accountantValidated: false },
        "1",
      ),
    ).toContain("Validação do contador");
  });

  it("assina somente em modo MOCK e gera QR payload", () => {
    const built = buildNfceXml(input);
    const signed = signXmlMock(built.xml);
    expect(signed.signedXml).toContain("ASSINATURA-MOCK-SEM-VALIDADE-FISCAL");
    expect(buildMockQrCodePayload(built.accessKey)).toContain(built.accessKey);
  });

  it("gera DANFE PDF com marca de teste", async () => {
    const built = buildNfceXml(input);
    const pdf = await generateDanfeMock({
      accessKey: built.accessKey,
      number: input.number,
      series: input.series,
      issuerName: input.issuer.legalName,
      total: built.totals.total,
      issuedAt: input.issuedAt,
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("remove segredos dos metadados de log", () => {
    expect(
      sanitizeFiscalMetadata({
        cscToken: "secret",
        ok: true,
        nested: { cvv: "123" },
      }),
    ).toEqual({ ok: true, nested: {} });
  });
});
