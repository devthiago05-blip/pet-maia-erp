"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { supabase } from "@/lib/supabase";
import { fiscalApi } from "@/services/fiscal-module";

interface XmlDocumentRow {
  id: string;
  issued_at?: string;
  created_at: string;
  number: number;
  access_key?: string;
  customer_name?: string;
  customer_cpf?: string;
  total: number;
  status: string;
}

interface XmlDocumentsResponse {
  documents: XmlDocumentRow[];
  warning?: string;
}

export default function FiscalXmlPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(0);
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState<XmlDocumentRow[]>([]);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    const query = new URLSearchParams({ year: String(year) });
    if (month) query.set("month", String(month));
    if (status) query.set("status", status);
    fiscalApi<XmlDocumentsResponse>(`/api/fiscal/documents?${query}`)
      .then((response) => {
        setDocuments(response.documents || []);
        setWarning(response.warning || "");
      })
      .catch((error) => toast.error(error.message));
  }, [year, month, status]);
  async function downloadZip() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const query = new URLSearchParams({ year: String(year) });
    if (month) query.set("month", String(month));
    const response = await fetch(`/api/fiscal/documents/export?${query}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return toast.error("Não foi possível gerar o ZIP.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = `NFCE-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <FiscalShell title="XML NFC-e" description="Consulta por ano, mês e status">
      <div className="rounded-2xl border bg-white p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border p-2"
          />
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border p-2"
          >
            <option value={0}>Ano inteiro</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {new Date(2026, index).toLocaleDateString("pt-BR", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border p-2"
          >
            <option value="">Todos os status</option>
            <option value="authorized">Autorizada</option>
            <option value="cancelled">Cancelada</option>
            <option value="rejected">Rejeitada</option>
            <option value="contingency">Contingência</option>
          </select>
          <button
            onClick={downloadZip}
            className="rounded-xl bg-purple-600 p-2 font-bold text-white"
          >
            Exportar XML para contador
          </button>
        </div>
        {warning && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            {warning}
          </p>
        )}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Data</th>
                <th>NFC-e</th>
                <th>Chave</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">
                    {new Date(item.issued_at || item.created_at).toLocaleString(
                      "pt-BR",
                    )}
                  </td>
                  <td>{String(item.number).padStart(9, "0")}</td>
                  <td className="font-mono text-xs">{item.access_key}</td>
                  <td>
                    {item.customer_name || item.customer_cpf || "Consumidor"}
                  </td>
                  <td>R$ {Number(item.total).toFixed(2)}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!documents.length && (
            <p className="p-8 text-center text-slate-500">
              Nenhum XML no período.
            </p>
          )}
        </div>
      </div>
    </FiscalShell>
  );
}
