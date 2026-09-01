"use client";

import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { fiscalApi } from "@/services/fiscal-module";

interface NfceMockResult {
  accessKey: string;
  xml: string;
  danfeBase64: string;
  persisted: boolean;
  persistenceWarning?: string;
  sefaz: { cStat: number; message: string };
  qrCode?: { dataUrl: string; payload: string };
}

const initial = {
  environment: "mock",
  ufCode: "23",
  municipalityCode: "2304400",
  issuer: {
    cnpj: "00000000000000",
    legalName: "EMITENTE EXCLUSIVO DE TESTE",
    tradeName: "PET MAIA MOCK",
    stateRegistration: "000000000",
    taxRegime: "1",
    address: "ENDERECO MOCK",
    number: "S/N",
    district: "BAIRRO MOCK",
    city: "FORTALEZA",
    state: "CE",
    postalCode: "60000000",
  },
  number: 1,
  series: 1,
  issuedAt: new Date().toISOString(),
  items: [
    {
      productId: 0,
      code: "TESTE001",
      description: "PRODUTO EXCLUSIVO DE TESTE",
      quantity: 1,
      unitPrice: 150,
      discount: 0,
      profile: {
        productId: 0,
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
      method: "PIX",
      amount: 150,
      integrated: true,
      transactionId: "MOCK-TEST",
      authorizationCode: "123456",
      terminalId: "TESTE01",
      acquirerCnpj: "00000000000000",
    },
  ],
  changeAmount: 0,
};

export default function NfceMockPage() {
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [scenario, setScenario] = useState("authorized");
  const [result, setResult] = useState<NfceMockResult | null>(null);
  async function generate() {
    try {
      const input = JSON.parse(json);
      input.issuedAt = new Date().toISOString();
      const response = await fiscalApi<NfceMockResult>(
        "/api/fiscal/nfce/mock",
        {
          method: "POST",
          body: JSON.stringify({ input, scenario }),
        },
      );
      setResult(response);
      toast.success(
        `SEFAZ Mock: ${response.sefaz.cStat} - ${response.sefaz.message}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "JSON inválido");
    }
  }
  function download(content: BlobPart, name: string, type: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <FiscalShell
      title="NFC-e MOCK"
      description="Geração, validação, assinatura, SEFAZ e DANFE"
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Documento de teste editável</h2>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="rounded-lg border p-2"
            >
              <option value="authorized">100 Autorizada</option>
              <option value="duplicate">204 Duplicidade</option>
              <option value="invalid_schema">215 Schema</option>
              <option value="issuer_disabled">203 Emitente</option>
              <option value="payment_rejected">Pagamento rejeitado</option>
              <option value="timeout">Timeout</option>
              <option value="unavailable">SEFAZ indisponível</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Os dados abaixo são exclusivamente MOCK e nunca são enviados à
            produção.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="mt-4 h-[520px] w-full rounded-xl border bg-slate-950 p-4 font-mono text-xs text-emerald-300"
          />
          <button
            onClick={generate}
            className="mt-4 w-full rounded-xl bg-purple-600 p-3 font-bold text-white"
          >
            Gerar e enviar à SEFAZ Mock
          </button>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border bg-white p-5">
            <h2 className="font-bold">Resultado</h2>
            {result ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <strong>Chave:</strong> {result.accessKey}
                </p>
                <p>
                  <strong>Status:</strong> {result.sefaz.cStat} —{" "}
                  {result.sefaz.message}
                </p>
                <p>
                  <strong>Persistência:</strong>{" "}
                  {result.persisted
                    ? "Banco conectado"
                    : result.persistenceWarning}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      download(
                        result.xml,
                        `${result.accessKey}.xml`,
                        "application/xml",
                      )
                    }
                    className="rounded-lg border px-3 py-2"
                  >
                    Baixar XML
                  </button>
                  <button
                    onClick={() => {
                      const bytes = Uint8Array.from(
                        atob(result.danfeBase64),
                        (c) => c.charCodeAt(0),
                      );
                      download(
                        new Blob([bytes]),
                        `DANFE-${result.accessKey}.pdf`,
                        "application/pdf",
                      );
                    }}
                    className="rounded-lg border px-3 py-2"
                  >
                    Baixar DANFE
                  </button>
                </div>
                {result.qrCode?.dataUrl && (
                  <Image
                    src={result.qrCode.dataUrl}
                    alt="QR Code NFC-e MOCK"
                    width={208}
                    height={208}
                    unoptimized
                    className="mx-auto mt-4 h-52 w-52"
                  />
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Gere uma NFC-e para visualizar XML, QR Code e DANFE.
              </p>
            )}
          </div>
          {result?.xml && (
            <div className="rounded-2xl border bg-slate-950 p-5">
              <h2 className="font-bold text-white">
                XML assinado em modo MOCK
              </h2>
              <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap text-xs text-emerald-300">
                {result.xml}
              </pre>
            </div>
          )}
        </div>
      </div>
    </FiscalShell>
  );
}
