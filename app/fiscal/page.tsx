"use client";

import { useEffect, useState } from "react";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { fiscalApi } from "@/services/fiscal-module";

interface FiscalDocumentSummary {
  status: string;
  total: number;
  created_at: string;
}

interface DiagnosticResponse {
  diagnostics: Array<{
    key: string;
    label: string;
    status: "ok" | "error" | "not_configured";
    detail: string;
  }>;
}

interface DocumentsResponse {
  documents: FiscalDocumentSummary[];
}

export default function FiscalOverviewPage() {
  const [data, setData] = useState<DiagnosticResponse | null>(null);
  const [documents, setDocuments] = useState<FiscalDocumentSummary[]>([]);
  useEffect(() => {
    Promise.all([
      fiscalApi<DiagnosticResponse>("/api/fiscal/diagnostics"),
      fiscalApi<DocumentsResponse>("/api/fiscal/documents"),
    ])
      .then(([diagnostics, docs]) => {
        setData(diagnostics);
        setDocuments(docs.documents || []);
      })
      .catch(() => undefined);
  }, []);
  const today = new Date().toLocaleDateString("en-CA");
  const todayDocuments = documents.filter((item) =>
    String(item.created_at).startsWith(today),
  );
  const cards = [
    ["NFC-e emitidas hoje", todayDocuments.length],
    [
      "Valor total hoje",
      `R$ ${todayDocuments.reduce((sum, item) => sum + Number(item.total || 0), 0).toFixed(2)}`,
    ],
    [
      "Autorizadas",
      documents.filter((item) => item.status === "authorized").length,
    ],
    [
      "Rejeitadas",
      documents.filter((item) => item.status === "rejected").length,
    ],
    [
      "Canceladas",
      documents.filter((item) => item.status === "cancelled").length,
    ],
  ];
  return (
    <FiscalShell
      title="Fiscal"
      description="NFC-e, XML, pagamentos e diagnóstico"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <strong className="mt-2 block text-2xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Diagnóstico</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.diagnostics || []).map((item) => (
            <div key={item.key} className="rounded-xl border p-3">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${item.status === "ok" ? "bg-emerald-100 text-emerald-700" : item.status === "error" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}
              >
                {item.status === "ok"
                  ? "OK"
                  : item.status === "error"
                    ? "ERRO"
                    : "NÃO CONFIGURADO"}
              </span>
              <p className="mt-2 font-semibold">{item.label}</p>
              <p className="text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </FiscalShell>
  );
}
