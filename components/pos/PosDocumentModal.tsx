"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { PosItem } from "@/types/domain";

export function PosDocumentModal({
  type,
  number,
  customer,
  date,
  expirationDate,
  paymentMethod,
  status,
  total,
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
  items: PosItem[];
  onConvert?: (paymentMethod: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("PIX");

  async function handleConvert() {
    if (!onConvert) {
      return;
    }

    setConverting(true);
    try {
      await onConvert(selectedPaymentMethod);
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
              <div className="flex justify-between border-t pt-4 text-lg">
                <strong>Total</strong>
                <strong className="text-[#8A0EEA]">
                  {formatCurrency(total)}
                </strong>
              </div>
            </div>

            <div className="grid gap-3 border-t p-4 print:hidden sm:grid-cols-2 sm:p-5">
              {onConvert && (
                <div className="flex gap-2 sm:col-span-2">
                  <select
                    value={selectedPaymentMethod}
                    onChange={(event) =>
                      setSelectedPaymentMethod(event.target.value)
                    }
                    className="min-w-0 flex-1 rounded-xl border p-3"
                  >
                    <option>PIX</option>
                    <option>Dinheiro</option>
                    <option>Cartão</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={converting}
                    className="rounded-xl bg-emerald-600 px-4 text-white disabled:opacity-50"
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
