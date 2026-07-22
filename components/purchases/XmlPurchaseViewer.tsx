"use client";

import {
  Building2,
  CalendarDays,
  FileText,
  ReceiptText,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/formatters";
import { createPurchaseDocumentUrl } from "@/services/purchase-recognition";
import type { PurchaseDocumentArchive } from "@/types/purchase-recognition";

interface XmlItem {
  code: string;
  description: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface XmlSummary {
  number: string;
  series: string;
  issueDate: string;
  supplierName: string;
  supplierDocument: string;
  customerName: string;
  total: number;
  discount: number;
  freight: number;
  payments: Array<{ method: string; amount: number }>;
  items: XmlItem[];
}

const paymentNames: Record<string, string> = {
  "01": "Dinheiro",
  "02": "Cheque",
  "03": "Cartão de crédito",
  "04": "Cartão de débito",
  "15": "Boleto",
  "17": "PIX",
  "18": "Transferência",
  "90": "Sem pagamento",
  "99": "Outros",
};

function tagText(parent: ParentNode, name: string) {
  return parent.querySelector(name)?.textContent?.trim() || "";
}

function numberTag(parent: ParentNode, name: string) {
  const value = Number(tagText(parent, name).replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function formatDocument(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 14)
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
  if (digits.length === 11)
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return value || "Não informado";
}

function formatIssueDate(value: string) {
  if (!value) return "Não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: value.includes("T") ? "short" : undefined,
      }).format(date);
}

function parseNfeXml(xml: string): XmlSummary {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror"))
    throw new Error("XML inválido ou incompleto");

  const issuer = parsed.querySelector("emit");
  const customer = parsed.querySelector("dest");
  const items = Array.from(parsed.querySelectorAll("det")).map((detail) => {
    const product = detail.querySelector("prod") || detail;
    return {
      code: tagText(product, "cProd"),
      description: tagText(product, "xProd") || "Produto sem descrição",
      ncm: tagText(product, "NCM"),
      cfop: tagText(product, "CFOP"),
      unit: tagText(product, "uCom"),
      quantity: numberTag(product, "qCom"),
      unitPrice: numberTag(product, "vUnCom"),
      total: numberTag(product, "vProd"),
    };
  });
  const payments = Array.from(parsed.querySelectorAll("detPag")).map(
    (payment) => {
      const code = tagText(payment, "tPag");
      return {
        method: paymentNames[code] || `Forma ${code || "não informada"}`,
        amount: numberTag(payment, "vPag"),
      };
    },
  );

  return {
    number: tagText(parsed, "nNF"),
    series: tagText(parsed, "serie"),
    issueDate: tagText(parsed, "dhEmi") || tagText(parsed, "dEmi"),
    supplierName: issuer ? tagText(issuer, "xNome") : "",
    supplierDocument: issuer
      ? tagText(issuer, "CNPJ") || tagText(issuer, "CPF")
      : "",
    customerName: customer ? tagText(customer, "xNome") : "",
    total: numberTag(parsed, "vNF"),
    discount: numberTag(parsed, "vDesc"),
    freight: numberTag(parsed, "vFrete"),
    payments,
    items,
  };
}

export function XmlPurchaseViewer({
  document,
  onClose,
}: {
  document: PurchaseDocumentArchive;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<XmlSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const response = await createPurchaseDocumentUrl(document);
      if (response.error || !response.data?.signedUrl)
        throw new Error("Não foi possível abrir o XML");
      const xmlResponse = await fetch(response.data.signedUrl);
      if (!xmlResponse.ok) throw new Error("Não foi possível baixar o XML");
      const parsed = parseNfeXml(await xmlResponse.text());
      if (active) setSummary(parsed);
    })().catch((reason) => {
      if (active)
        setError(
          reason instanceof Error ? reason.message : "Erro ao ler o XML",
        );
    });
    return () => {
      active = false;
    };
  }, [document]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <section className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b bg-slate-50 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-[#8A0EEA]">
              Visualização organizada do XML
            </p>
            <h2 className="mt-1 truncate text-xl font-bold">
              Nota {summary?.number || document.document_number || "fiscal"}
            </h2>
            <p className="truncate text-sm text-slate-500">
              {document.original_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar visualização"
            className="rounded-xl border bg-white p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-5">
          {!summary && !error && (
            <div className="py-16 text-center text-slate-500">
              Organizando os dados da nota...
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 p-5 text-center font-semibold text-red-700">
              {error}. Use “Baixar” para consultar o arquivo original.
            </div>
          )}
          {summary && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  icon={<FileText size={18} />}
                  label="Nota / Série"
                  value={`${summary.number || "-"}${summary.series ? ` / ${summary.series}` : ""}`}
                />
                <SummaryCard
                  icon={<Building2 size={18} />}
                  label="Fornecedor"
                  value={summary.supplierName || "Não informado"}
                  detail={formatDocument(summary.supplierDocument)}
                />
                <SummaryCard
                  icon={<CalendarDays size={18} />}
                  label="Emissão"
                  value={formatIssueDate(summary.issueDate)}
                />
                <SummaryCard
                  icon={<ReceiptText size={18} />}
                  label="Total da nota"
                  value={formatCurrency(summary.total)}
                  highlight
                />
              </div>

              <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <SmallMetric
                  label="Destinatário"
                  value={summary.customerName || "Não informado"}
                />
                <SmallMetric
                  label="Frete"
                  value={formatCurrency(summary.freight)}
                />
                <SmallMetric
                  label="Desconto"
                  value={formatCurrency(summary.discount)}
                />
                <SmallMetric
                  label="Pagamento"
                  value={
                    summary.payments.length
                      ? summary.payments
                          .map(
                            (item) =>
                              `${item.method}: ${formatCurrency(item.amount)}`,
                          )
                          .join(" + ")
                      : "Não informado"
                  }
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold">Produtos da nota</h3>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-[#8A0EEA]">
                    {summary.items.length} item(ns)
                  </span>
                </div>
                {summary.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-slate-500">
                    Nenhum produto foi localizado neste XML.
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto rounded-xl border md:block">
                      <table className="w-full min-w-[820px]">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="p-3 text-left">Código / Produto</th>
                            <th className="p-3 text-left">NCM / CFOP</th>
                            <th className="p-3 text-right">Quantidade</th>
                            <th className="p-3 text-right">Unitário</th>
                            <th className="p-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.items.map((item, index) => (
                            <tr
                              key={`${item.code}-${index}`}
                              className="border-t"
                            >
                              <td className="p-3">
                                <p className="font-semibold">
                                  {item.description}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.code || "Sem código"}
                                </p>
                              </td>
                              <td className="p-3 text-sm">
                                {item.ncm || "-"} / {item.cfop || "-"}
                              </td>
                              <td className="p-3 text-right">
                                {item.quantity.toLocaleString("pt-BR")}{" "}
                                {item.unit}
                              </td>
                              <td className="p-3 text-right">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="p-3 text-right font-bold">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="space-y-3 md:hidden">
                      {summary.items.map((item, index) => (
                        <article
                          key={`${item.code}-${index}`}
                          className="rounded-xl border p-4"
                        >
                          <p className="font-bold">{item.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Código {item.code || "-"} · NCM {item.ncm || "-"} ·
                            CFOP {item.cfop || "-"}
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                            <SmallMetric
                              label="Qtd."
                              value={`${item.quantity.toLocaleString("pt-BR")} ${item.unit}`}
                            />
                            <SmallMetric
                              label="Unitário"
                              value={formatCurrency(item.unitPrice)}
                            />
                            <SmallMetric
                              label="Total"
                              value={formatCurrency(item.total)}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-purple-200 bg-purple-50" : "bg-white"}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <p
        className={`mt-2 break-words font-bold ${highlight ? "text-xl text-[#8A0EEA]" : "text-slate-900"}`}
      >
        {value}
      </p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="break-words font-semibold text-slate-800">{value}</p>
    </div>
  );
}
