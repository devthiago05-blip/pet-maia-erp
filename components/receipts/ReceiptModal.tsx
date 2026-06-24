"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FinancialEntry } from "@/types/domain";

interface ReceiptModalProps {
  entry: FinancialEntry;
}

export function ReceiptModal({ entry }: ReceiptModalProps) {
  const [open, setOpen] = useState(false);
  const receiptNumber = String(entry.id).padStart(6, "0");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[#8A0EEA]"
      >
        Visualizar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b p-4 print:hidden sm:p-6">
              <h2 className="text-xl font-bold">Comprovante</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar comprovante"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="receipt-print-area space-y-6 p-5 sm:p-8">
              <div className="border-b pb-5 text-center">
                <BrandLogo className="mx-auto max-w-[260px]" />
                <p className="mt-1 text-sm text-slate-500">
                  Comprovante de recebimento
                </p>
              </div>

              <div className="grid gap-3 text-sm">
                <ReceiptRow label="Número" value={`#${receiptNumber}`} />
                <ReceiptRow label="Data" value={formatDate(entry.created_at)} />
                <ReceiptRow label="Descrição" value={entry.descricao} />
                <ReceiptRow
                  label="Forma de pagamento"
                  value={entry.forma_pagamento || "Não informada"}
                />
              </div>

              <div className="flex items-center justify-between border-y py-4">
                <span className="font-semibold">Valor recebido</span>
                <strong className="text-xl text-[#8A0EEA]">
                  {formatCurrency(entry.valor)}
                </strong>
              </div>

              <p className="text-center text-xs text-slate-500">
                Pagamento confirmado.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t p-4 print:hidden sm:flex-row sm:p-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl border py-2 sm:flex-1"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-2 text-white sm:flex-1"
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

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
