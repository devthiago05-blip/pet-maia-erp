"use client";

import { useState } from "react";

import {
  PosDocumentModal,
  type PosQuoteConversion,
} from "@/components/pos/PosDocumentModal";
import {
  QuoteEditModal,
  type QuoteUpdateInput,
} from "@/components/pos/QuoteEditModal";
import { SaleReturnModal } from "@/components/pos/SaleReturnModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { PosQuote, PosSale, Product, Tutor } from "@/types/domain";
export function QuotesView({
  quotes,
  products,
  tutors,
  onConvert,
  onDelete,
  onUpdate,
}: {
  quotes: PosQuote[];
  products: Product[];
  tutors: Tutor[];
  onConvert: (quoteId: number, conversion: PosQuoteConversion) => Promise<void>;
  onDelete: (quoteId: number) => Promise<void>;
  onUpdate: (input: QuoteUpdateInput) => Promise<void>;
}) {
  const [quoteToDelete, setQuoteToDelete] = useState<PosQuote | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!quoteToDelete) return;
    setDeleting(true);
    try {
      await onDelete(quoteToDelete.id);
      setQuoteToDelete(null);
    } catch {
      return;
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Criado em</th>
                <th className="p-4 text-left">Validade</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhum orçamento salvo.
                  </td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="border-t">
                    <td className="p-4">
                      #{String(quote.id).padStart(6, "0")}
                    </td>
                    <td className="p-4">
                      {quote.tutors?.nome || quote.cliente_nome || "Consumidor"}
                    </td>
                    <td className="p-4">{formatDate(quote.created_at)}</td>
                    <td className="p-4">{formatDate(quote.validade)}</td>
                    <td className="p-4">{formatCurrency(quote.total)}</td>
                    <td className="p-4">{quote.status}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <PosDocumentModal
                          type="Orçamento"
                          number={quote.id}
                          customer={
                            quote.tutors?.nome ||
                            quote.cliente_nome ||
                            "Consumidor"
                          }
                          date={quote.created_at}
                          expirationDate={quote.validade}
                          status={quote.status}
                          total={quote.total}
                          items={quote.pos_quote_items || []}
                          onConvert={
                            quote.status === "Aberto"
                              ? (conversion) => onConvert(quote.id, conversion)
                              : undefined
                          }
                        />
                        {quote.status === "Aberto" && (
                          <QuoteEditModal
                            quote={quote}
                            products={products}
                            tutors={tutors}
                            onSave={onUpdate}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setQuoteToDelete(quote)}
                          className="font-semibold text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={Boolean(quoteToDelete)}
        title="Excluir orçamento?"
        description={
          quoteToDelete
            ? `O orçamento #${String(quoteToDelete.id).padStart(6, "0")} e todos os seus itens serão removidos permanentemente.`
            : ""
        }
        confirmText={deleting ? "Excluindo..." : "Excluir orçamento"}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!deleting) setQuoteToDelete(null);
        }}
      />
    </>
  );
}

export function SalesView({
  sales,
  onCancel,
  onReturn,
}: {
  sales: PosSale[];
  onCancel: (saleId: number) => Promise<void>;
  onReturn: (
    saleId: number,
    input: {
      type: "Devolução" | "Troca";
      reason: string;
      items: Array<{ sale_item_id: number; quantity: number }>;
    },
  ) => Promise<boolean>;
}) {
  const [saleToCancel, setSaleToCancel] = useState<PosSale | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleConfirmCancel() {
    if (!saleToCancel) {
      return;
    }

    setCancelling(true);
    try {
      await onCancel(saleToCancel.id);
      setSaleToCancel(null);
    } catch {
      return;
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Histórico de vendas</h2>
          <p className="text-sm text-slate-500">
            Consulte comprovantes e acompanhe o status das vendas.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {sales.length}
        </span>
      </div>

      <div className="space-y-3 md:hidden">
        {sales.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Nenhuma venda registrada.
          </div>
        ) : (
          sales.map((sale) => {
            const customer =
              sale.tutors?.nome || sale.cliente_nome || "Consumidor";
            const cancelled = sale.status === "Cancelada";

            return (
              <article
                key={sale.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      VENDA #{String(sale.id).padStart(6, "0")}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900">
                      {customer}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#8A0EEA]">
                      {formatCurrency(sale.total)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        cancelled
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {sale.status || "Concluída"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Pagamento</p>
                    <p className="font-semibold text-slate-700">
                      {sale.forma_pagamento || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Caixa</p>
                    <p className="font-semibold text-slate-700">
                      {sale.cash_register_id
                        ? `#${String(sale.cash_register_id).padStart(6, "0")}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-3 grid gap-2 border-t pt-3 ${cancelled ? "grid-cols-1" : "grid-cols-3"}`}
                >
                  <div className="flex min-h-10 items-center justify-center rounded-xl bg-purple-50 font-semibold text-[#8A0EEA]">
                    <PosDocumentModal
                      type="Venda"
                      number={sale.id}
                      customer={customer}
                      date={sale.created_at}
                      paymentMethod={sale.forma_pagamento}
                      status={sale.status || "Concluída"}
                      total={sale.total}
                      subtotal={sale.subtotal}
                      discount={sale.discount_amount}
                      surcharge={sale.surcharge_amount}
                      adjustmentReason={sale.adjustment_reason}
                      cashReceived={sale.cash_received}
                      changeAmount={sale.change_amount}
                      changeMethod={sale.change_method}
                      items={sale.pos_sale_items || []}
                    />
                  </div>
                  {!cancelled && (
                    <div className="flex min-h-10 items-center justify-center rounded-xl bg-amber-50">
                      <SaleReturnModal
                        sale={sale}
                        onSave={(input) => onReturn(sale.id, input)}
                      />
                    </div>
                  )}
                  {!cancelled && (
                    <button
                      type="button"
                      onClick={() => setSaleToCancel(sale)}
                      className="min-h-10 rounded-xl bg-red-50 font-semibold text-red-600"
                    >
                      Excluir venda
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Caixa</th>
                <th className="p-4 text-left">Pagamento</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="p-4">#{String(sale.id).padStart(6, "0")}</td>
                    <td className="p-4">
                      {sale.tutors?.nome || sale.cliente_nome || "Consumidor"}
                    </td>
                    <td className="p-4">{formatDate(sale.created_at)}</td>
                    <td className="p-4">
                      {sale.cash_register_id
                        ? `#${String(sale.cash_register_id).padStart(6, "0")}`
                        : "-"}
                    </td>
                    <td className="p-4">{sale.forma_pagamento}</td>
                    <td className="p-4">
                      <span
                        className={
                          sale.status === "Cancelada"
                            ? "text-red-600"
                            : "text-emerald-600"
                        }
                      >
                        {sale.status || "Concluída"}
                      </span>
                    </td>
                    <td className="p-4">{formatCurrency(sale.total)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-3">
                        <PosDocumentModal
                          type="Venda"
                          number={sale.id}
                          customer={
                            sale.tutors?.nome ||
                            sale.cliente_nome ||
                            "Consumidor"
                          }
                          date={sale.created_at}
                          paymentMethod={sale.forma_pagamento}
                          status={sale.status || "Concluída"}
                          total={sale.total}
                          subtotal={sale.subtotal}
                          discount={sale.discount_amount}
                          surcharge={sale.surcharge_amount}
                          adjustmentReason={sale.adjustment_reason}
                          cashReceived={sale.cash_received}
                          changeAmount={sale.change_amount}
                          changeMethod={sale.change_method}
                          items={sale.pos_sale_items || []}
                        />
                        {sale.status !== "Cancelada" && (
                          <SaleReturnModal
                            sale={sale}
                            onSave={(input) => onReturn(sale.id, input)}
                          />
                        )}
                        {sale.status !== "Cancelada" && (
                          <button
                            type="button"
                            onClick={() => setSaleToCancel(sale)}
                            className="text-red-600"
                          >
                            Excluir venda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(saleToCancel)}
        title="Excluir venda"
        description={`Deseja excluir a venda #${String(saleToCancel?.id || 0).padStart(6, "0")}? Os produtos voltarão ao estoque e a receita será removida do Financeiro.`}
        confirmText={cancelling ? "Excluindo..." : "Excluir venda"}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!cancelling) {
            setSaleToCancel(null);
          }
        }}
      />
    </>
  );
}


