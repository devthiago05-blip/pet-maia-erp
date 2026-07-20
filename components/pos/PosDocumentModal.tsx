"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { financialPaymentMethods } from "@/lib/financial-options";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { PosItem } from "@/types/domain";

interface ConversionPayment {
  id: string;
  method: string;
  amount: string;
}

export interface PosQuoteConversion {
  paymentMethod?: string;
  payments?: Array<{ payment_method: string; amount: number }>;
}

export function PosDocumentModal({
  type,
  number,
  customer,
  date,
  expirationDate,
  paymentMethod,
  status,
  total,
  subtotal,
  discount,
  surcharge,
  adjustmentReason,
  items,
  onConvert,
}: {
  type: "Orçamento" | "Venda";
  number: number;
  customer: string;
  date: string;
  expirationDate?: string;
  paymentMethod?: string;
  status?: string;
  total: number;
  subtotal?: number;
  discount?: number;
  surcharge?: number;
  adjustmentReason?: string;
  items: PosItem[];
  onConvert?: (conversion: PosQuoteConversion) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PIX");
  const [splitPayments, setSplitPayments] = useState(false);
  const [payments, setPayments] = useState<ConversionPayment[]>([
    { id: "quote-payment-1", method: "PIX", amount: "" },
  ]);

  const paymentTotal = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const paymentDifference = total - paymentTotal;

  async function handleConvert() {
    if (!onConvert) {
      return;
    }

    setConverting(true);
    try {
      if (splitPayments) {
        const normalizedPayments = payments
          .map((payment) => ({
            payment_method: payment.method,
            amount: Number(payment.amount || 0),
          }))
          .filter((payment) => payment.amount > 0);

        if (
          normalizedPayments.length === 0 ||
          Math.abs(paymentDifference) >= 0.01
        ) {
          return;
        }

        await onConvert({ payments: normalizedPayments });
      } else {
        await onConvert({ paymentMethod: selectedPaymentMethod });
      }
      setOpen(false);
    } finally {
      setConverting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[#8A0EEA]"
      >
        Detalhes
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 print:hidden sm:p-5">
              <h2 className="text-xl font-bold">
                {type} #{String(number).padStart(6, "0")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="receipt-print-area space-y-5 p-4 sm:p-7">
              <div className="border-b pb-4 text-center">
                <BrandLogo className="mx-auto max-w-[240px]" />
                <p className="mt-2 font-semibold">{type}</p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <strong>Cliente:</strong> {customer}
                </p>
                <p>
                  <strong>Data:</strong> {formatDate(date)}
                </p>
                {expirationDate && (
                  <p>
                    <strong>Validade:</strong> {formatDate(expirationDate)}
                  </p>
                )}
                {paymentMethod && (
                  <p>
                    <strong>Pagamento:</strong> {paymentMethod}
                  </p>
                )}
                {status && (
                  <p>
                    <strong>Status:</strong> {status}
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Item</th>
                      <th className="p-3 text-right">Qtd.</th>
                      <th className="p-3 text-right">Unitário</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.descricao}</td>
                        <td className="p-3 text-right">{item.quantidade}</td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.valor_unitario)}
                        </td>
                        <td className="p-3 text-right">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(Number(discount||0)>0||Number(surcharge||0)>0)&&<div className="space-y-1 border-t pt-4 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal||total)}</span></div>{Number(discount||0)>0&&<div className="flex justify-between text-emerald-700"><span>Desconto</span><span>- {formatCurrency(discount||0)}</span></div>}{Number(surcharge||0)>0&&<div className="flex justify-between text-amber-700"><span>Acréscimo</span><span>+ {formatCurrency(surcharge||0)}</span></div>}{adjustmentReason&&<p className="pt-1 text-xs text-slate-500">Motivo: {adjustmentReason}</p>}</div>}
              <div className={`${Number(discount||0)>0||Number(surcharge||0)>0?"pt-2":"border-t pt-4"} flex justify-between text-lg`}>
                <strong>Total</strong>
                <strong className="text-[#8A0EEA]">
                  {formatCurrency(total)}
                </strong>
              </div>
            </div>

            <div className="grid gap-3 border-t p-4 print:hidden sm:grid-cols-2 sm:p-5">
              {onConvert && (
                <div className="space-y-3 sm:col-span-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm font-medium">
                    Pagamento dividido
                    <input
                      type="checkbox"
                      checked={splitPayments}
                      onChange={(event) =>
                        setSplitPayments(event.target.checked)
                      }
                      className="size-4 accent-[#8A0EEA]"
                    />
                  </label>

                  {splitPayments ? (
                    <div className="space-y-2 rounded-xl border p-3">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                        >
                          <select
                            value={payment.method}
                            onChange={(event) =>
                              setPayments((current) =>
                                current.map((item) =>
                                  item.id === payment.id
                                    ? { ...item, method: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="rounded-lg border p-2 text-sm"
                          >
                            {financialPaymentMethods.map((method) => (
                              <option key={method}>{method}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={payment.amount}
                            onChange={(event) =>
                              setPayments((current) =>
                                current.map((item) =>
                                  item.id === payment.id
                                    ? { ...item, amount: event.target.value }
                                    : item,
                                ),
                              )
                            }
                            placeholder="Valor"
                            className="rounded-lg border p-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPayments((current) =>
                                current.filter(
                                  (item) => item.id !== payment.id,
                                ),
                              )
                            }
                            disabled={payments.length === 1}
                            className="rounded-lg border px-3 text-sm text-red-600 disabled:opacity-40"
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setPayments((current) => [
                            ...current,
                            {
                              id: `quote-payment-${Date.now()}`,
                              method: "PIX",
                              amount: "",
                            },
                          ])
                        }
                        className="text-sm font-semibold text-[#8A0EEA]"
                      >
                        Adicionar forma de pagamento
                      </button>
                      <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="text-slate-500">Pago</span>
                        <strong className="text-right">
                          {formatCurrency(paymentTotal)}
                        </strong>
                        <span className="text-slate-500">Diferença</span>
                        <strong
                          className={`text-right ${
                            Math.abs(paymentDifference) >= 0.01
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {formatCurrency(paymentDifference)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <select
                      value={selectedPaymentMethod}
                      onChange={(event) =>
                        setSelectedPaymentMethod(event.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    >
                      {financialPaymentMethods.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={
                      converting ||
                      (splitPayments && Math.abs(paymentDifference) >= 0.01)
                    }
                    className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white disabled:opacity-50"
                  >
                    {converting ? "Convertendo..." : "Converter em venda"}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-2 text-white"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
