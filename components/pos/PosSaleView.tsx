"use client";

import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  type CartItem,
  type PaymentSplit,
  type ProductGroup,
} from "@/components/pos/pos-page-shared";
import { ProductSelectionModal } from "@/components/pos/ProductSelectionModal";
import { SuspendedSalesPanel } from "@/components/pos/SuspendedSalesPanel";
import { financialPaymentMethods } from "@/lib/financial-options";
import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { Product, SuspendedPosSale, Tutor } from "@/types/domain";
export function SaleView({
  groups,
  cart,
  search,
  tutorId,
  customerName,
  discount,
  surcharge,
  adjustmentReason,
  discountLimitPercent,
  maxDiscountAmount,
  discountIsInvalid,
  paymentMethod,
  paymentAmount,
  changeMethod,
  splitPayments,
  payments,
  paymentTotal,
  paymentDifference,
  expirationDate,
  tutors,
  suspendedSales,
  subtotal,
  total,
  processing,
  onSearch,
  onBarcodeScan,
  onAdd,
  onQuantity,
  onTutor,
  onCustomerName,
  onDiscount,
  onSurcharge,
  onAdjustmentReason,
  onPaymentMethod,
  onPaymentAmount,
  onPaymentAmountBlur,
  onChangeMethod,
  onSplitPayments,
  onPaymentSplit,
  onAddPaymentSplit,
  onRemovePaymentSplit,
  onExpirationDate,
  onQuote,
  onSale,
  onClear,
  onSuspend,
  onRecoverSuspended,
  onDeleteSuspended,
}: {
  groups: ProductGroup[];
  cart: CartItem[];
  search: string;
  tutorId: string;
  customerName: string;
  discount: string;
  surcharge: string;
  adjustmentReason: string;
  discountLimitPercent: number;
  maxDiscountAmount: number;
  discountIsInvalid: boolean;
  paymentMethod: string;
  paymentAmount: string;
  changeMethod: "Dinheiro" | "PIX";
  splitPayments: boolean;
  payments: PaymentSplit[];
  paymentTotal: number;
  paymentDifference: number;
  expirationDate: string;
  tutors: Tutor[];
  suspendedSales: SuspendedPosSale[];
  subtotal: number;
  total: number;
  processing: boolean;
  onSearch: (value: string) => void;
  onBarcodeScan: (value: string) => void;
  onAdd: (product: Product, quantity?: number) => void;
  onQuantity: (id: number, delta: number) => void;
  onTutor: (value: string) => void;
  onCustomerName: (value: string) => void;
  onDiscount: (value: string) => void;
  onSurcharge: (value: string) => void;
  onAdjustmentReason: (value: string) => void;
  onPaymentMethod: (value: string) => void;
  onPaymentAmount: (value: string) => void;
  onPaymentAmountBlur: () => void;
  onChangeMethod: (value: "Dinheiro" | "PIX") => void;
  onSplitPayments: (value: boolean) => void;
  onPaymentSplit: (
    paymentId: string,
    field: "method" | "amount",
    value: string,
  ) => void;
  onAddPaymentSplit: () => void;
  onRemovePaymentSplit: (paymentId: string) => void;
  onExpirationDate: (value: string) => void;
  onQuote: () => void;
  onSale: () => void;
  onClear: () => void;
  onSuspend: (notes: string) => Promise<void>;
  onRecoverSuspended: (sale: SuspendedPosSale) => Promise<void>;
  onDeleteSuspended: (sale: SuspendedPosSale) => Promise<void>;
}) {
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [stockFilter, setStockFilter] = useState("disponiveis");
  const [closingOpen, setClosingOpen] = useState(false);
  const categoryOptions = useMemo(() => {
    const categories = groups.map((group) => group.category || "Sem categoria");

    return Array.from(new Set(categories)).sort((first, second) =>
      first.localeCompare(second, "pt-BR"),
    );
  }, [groups]);
  const displayedGroups = useMemo(() => {
    return groups.filter((group) => {
      const category = group.category || "Sem categoria";
      const totalStock = group.products.reduce(
        (totalStockInGroup, product) => totalStockInGroup + product.estoque,
        0,
      );
      const hasLowStock = group.products.some(
        (product) => product.estoque <= product.estoque_minimo,
      );

      return (
        (categoryFilter === "Todas" || category === categoryFilter) &&
        (stockFilter === "todos" ||
          (stockFilter === "disponiveis" && totalStock > 0) ||
          (stockFilter === "baixo" && hasLowStock))
      );
    });
  }, [categoryFilter, groups, stockFilter]);
  const splitCashTotal = payments
    .filter((payment) => payment.method === "Dinheiro")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const splitExcess = Math.max(0, -paymentDifference);
  const splitPaymentInvalid =
    paymentDifference >= 0.01 || splitExcess > splitCashTotal + 0.009;
  const changeDue = splitPayments
    ? splitPaymentInvalid
      ? 0
      : splitExcess
    : paymentMethod === "Dinheiro"
      ? Math.max(0, Number(paymentAmount || 0) - total)
      : 0;

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-4">
        <SuspendedSalesPanel
          sales={suspendedSales}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          customerName={
            tutors.find((tutor) => String(tutor.id) === tutorId)?.nome ||
            customerName ||
            "Consumidor"
          }
          processing={processing}
          onSuspend={onSuspend}
          onRecover={onRecoverSuspended}
          onDelete={onDeleteSuspended}
        />
        <label className="flex items-center gap-3 rounded-xl border bg-white px-4">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onBarcodeScan(event.currentTarget.value);
              }
            }}
            placeholder="Buscar ou bipar código de barras"
            className="min-w-0 flex-1 py-3 outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 rounded-xl border bg-white p-2 sm:grid-cols-3 sm:gap-3 sm:p-3">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="Todas">Todas as categorias</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="disponiveis">Somente com estoque</option>
            <option value="baixo">Estoque baixo</option>
            <option value="todos">Todos os produtos</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter("Todas");
              setStockFilter("disponiveis");
              onSearch("");
            }}
            className="col-span-2 rounded-xl border border-[#8A0EEA]/20 px-4 py-3 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 sm:col-span-1"
          >
            Limpar busca
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {displayedGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              Nenhum produto encontrado com os filtros atuais.
            </div>
          ) : (
            displayedGroups.map((group) => (
              <ProductSelectionModal
                key={group.key}
                name={group.name}
                category={group.category}
                products={group.products}
                onAdd={onAdd}
              />
            ))
          )}
        </div>
      </section>

      <aside className="h-fit rounded-xl border bg-white p-4 sm:p-5 xl:sticky xl:top-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart size={20} /> Carrinho
          </h2>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-red-600"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
              Selecione produtos para iniciar.
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="rounded-xl border p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {formatProductName(item.product)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(item.product.preco_venda)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuantity(item.product.id, -item.quantity)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={17} className="text-red-500" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQuantity(item.product.id, -1)}
                      className="rounded-lg border p-1"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-7 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQuantity(item.product.id, 1)}
                      className="rounded-lg border p-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong>
                    {formatCurrency(
                      Number(item.product.preco_venda) * item.quantity,
                    )}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <select
            value={tutorId}
            onChange={(event) => onTutor(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">Consumidor sem cadastro</option>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.nome}
              </option>
            ))}
          </select>
          {!tutorId && (
            <input
              value={customerName}
              onChange={(event) => onCustomerName(event.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="rounded-xl border p-3"
            />
          )}
          {false && !splitPayments && (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
              <select
                value={paymentMethod}
                onChange={(event) => onPaymentMethod(event.target.value)}
                className="rounded-xl border p-3"
              >
                {financialPaymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <label className="grid gap-1 text-xs font-medium text-slate-500">
                Valor recebido
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => onPaymentAmount(event.target.value)}
                  onBlur={onPaymentAmountBlur}
                  placeholder={formatCurrency(total)}
                  className="rounded-xl border p-3 text-sm text-slate-900"
                />
              </label>
              <p className="text-xs text-slate-500 sm:col-span-2">
                Opcional: se o valor for menor que o total, a segunda forma será
                aberta automaticamente.
              </p>
              {changeDue > 0 && (
                <div className="rounded-xl bg-emerald-50 p-3 text-center sm:col-span-2">
                  <p className="text-xs font-semibold text-emerald-700">
                    Troco para o cliente
                  </p>
                  <strong className="text-xl text-emerald-700">
                    {formatCurrency(changeDue)}
                  </strong>
                </div>
              )}
            </div>
          )}
          <div
            className={`hidden rounded-xl border p-3 ${splitPayments ? "border-purple-200 bg-purple-50/50" : ""}`}
          >
            <button
              type="button"
              onClick={() => onSplitPayments(!splitPayments)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm font-bold transition ${
                splitPayments ? "text-[#8A0EEA]" : "text-slate-700"
              }`}
            >
              <span>
                {splitPayments
                  ? "Pagamento com mais de uma forma"
                  : "Cliente vai usar mais de uma forma?"}
              </span>
              <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs shadow-sm">
                {splitPayments ? "Usar apenas uma" : "Dividir pagamento"}
              </span>
            </button>

            {splitPayments && (
              <div className="mt-3 space-y-2">
                {payments.map((payment) => {
                  const otherPaymentsTotal = payments.reduce(
                    (sum, item) =>
                      item.id === payment.id
                        ? sum
                        : sum + Number(item.amount || 0),
                    0,
                  );
                  const remaining = Math.max(0, total - otherPaymentsTotal);

                  return (
                    <div
                      key={payment.id}
                      className="grid gap-2 sm:grid-cols-[1fr_110px_auto_auto]"
                    >
                      <select
                        value={payment.method}
                        onChange={(event) =>
                          onPaymentSplit(
                            payment.id,
                            "method",
                            event.target.value,
                          )
                        }
                        className="rounded-lg border bg-white p-2 text-sm"
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
                          onPaymentSplit(
                            payment.id,
                            "amount",
                            event.target.value,
                          )
                        }
                        placeholder="Valor"
                        className="rounded-lg border bg-white p-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onPaymentSplit(
                            payment.id,
                            "amount",
                            remaining.toFixed(2),
                          )
                        }
                        className="rounded-lg border bg-white px-2 text-xs font-semibold text-[#8A0EEA]"
                      >
                        Restante
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePaymentSplit(payment.id)}
                        disabled={payments.length === 1}
                        aria-label="Remover forma de pagamento"
                        className="rounded-lg border bg-white p-2 text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={onAddPaymentSplit}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#8A0EEA]"
                >
                  <Plus size={15} /> Adicionar outra forma
                </button>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="text-slate-500">Pago</span>
                  <strong className="text-right">
                    {formatCurrency(paymentTotal)}
                  </strong>
                  <span className="text-slate-500">
                    {paymentDifference >= 0
                      ? "Falta"
                      : splitPaymentInvalid
                        ? "Excedeu sem dinheiro"
                        : "Troco"}
                  </span>
                  <strong
                    className={`text-right ${
                      splitPaymentInvalid ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(Math.abs(paymentDifference))}
                  </strong>
                </div>
                {changeDue > 0 && (
                  <div className="rounded-xl bg-emerald-100 p-3 text-center text-emerald-800">
                    <span className="text-sm font-semibold">Troco: </span>
                    <strong className="text-lg">
                      {formatCurrency(changeDue)}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>
          {changeDue > 0 && (
            <div className="hidden rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-bold text-emerald-900">
                Como entregar o troco de {formatCurrency(changeDue)}?
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["Dinheiro", "PIX"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => onChangeMethod(method)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                      changeMethod === method
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-white text-emerald-800"
                    }`}
                  >
                    Troco via {method}
                  </button>
                ))}
              </div>
              {changeMethod === "PIX" && (
                <p className="mt-2 text-xs text-emerald-800">
                  Use quando não houver dinheiro suficiente no caixa. O valor
                  ficará identificado na venda.
                </p>
              )}
            </div>
          )}
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Validade do orçamento
            <input
              type="date"
              value={expirationDate}
              onChange={(event) => onExpirationDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
        </div>
        <div className="mt-5 hidden rounded-2xl border border-purple-100 bg-purple-50/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-700">
              Ajustes da venda
            </span>
            <span className="text-xs font-semibold text-[#8A0EEA]">
              Limite: {discountLimitPercent}%
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Desconto (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                max={maxDiscountAmount}
                value={discount}
                onChange={(event) => onDiscount(event.target.value)}
                className={`rounded-xl border bg-white p-3 text-sm text-slate-900 ${discountIsInvalid ? "border-red-400" : ""}`}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-500">
              Acréscimo (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={surcharge}
                onChange={(event) => onSurcharge(event.target.value)}
                className="rounded-xl border bg-white p-3 text-sm text-slate-900"
              />
            </label>
          </div>
          {(Number(discount || 0) > 0 || Number(surcharge || 0) > 0) && (
            <input
              value={adjustmentReason}
              onChange={(event) => onAdjustmentReason(event.target.value)}
              placeholder="Motivo obrigatório"
              className="mt-2 w-full rounded-xl border bg-white p-3 text-sm"
            />
          )}
          {discountIsInvalid && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              Desconto máximo: {formatCurrency(maxDiscountAmount)}
            </p>
          )}
        </div>
        <div className="mt-5 space-y-2 border-t pt-4">
          {(Number(discount || 0) > 0 || Number(surcharge || 0) > 0) && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          )}
          {Number(discount || 0) > 0 && (
            <div className="flex justify-between text-sm font-medium text-emerald-700">
              <span>Desconto</span>
              <span>- {formatCurrency(Number(discount))}</span>
            </div>
          )}
          {Number(surcharge || 0) > 0 && (
            <div className="flex justify-between text-sm font-medium text-amber-700">
              <span>Acréscimo</span>
              <span>+ {formatCurrency(Number(surcharge))}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <strong className="text-2xl text-[#8A0EEA]">
              {formatCurrency(total)}
            </strong>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <button
            type="button"
            onClick={onQuote}
            disabled={processing || cart.length === 0}
            className="rounded-xl border py-3 font-semibold disabled:opacity-50"
          >
            Salvar orçamento
          </button>
          <button
            type="button"
            onClick={() => setClosingOpen(true)}
            disabled={processing || cart.length === 0 || discountIsInvalid}
            className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-50"
          >
            {processing ? "Processando..." : "Gravar / finalizar"}
          </button>
        </div>
      </aside>
      {closingOpen && cart.length > 0 && (
        <SaleClosingModal
          customerName={
            tutors.find((tutor) => String(tutor.id) === tutorId)?.nome ||
            customerName ||
            "Consumidor"
          }
          itemCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          subtotal={subtotal}
          total={total}
          discount={discount}
          surcharge={surcharge}
          adjustmentReason={adjustmentReason}
          discountLimitPercent={discountLimitPercent}
          maxDiscountAmount={maxDiscountAmount}
          discountIsInvalid={discountIsInvalid}
          paymentMethod={paymentMethod}
          paymentAmount={paymentAmount}
          changeMethod={changeMethod}
          splitPayments={splitPayments}
          payments={payments}
          paymentTotal={paymentTotal}
          paymentDifference={paymentDifference}
          splitPaymentInvalid={splitPaymentInvalid}
          changeDue={changeDue}
          processing={processing}
          onClose={() => setClosingOpen(false)}
          onDiscount={onDiscount}
          onSurcharge={onSurcharge}
          onAdjustmentReason={onAdjustmentReason}
          onPaymentMethod={onPaymentMethod}
          onPaymentAmount={onPaymentAmount}
          onPaymentAmountBlur={onPaymentAmountBlur}
          onChangeMethod={onChangeMethod}
          onSplitPayments={onSplitPayments}
          onPaymentSplit={onPaymentSplit}
          onAddPaymentSplit={onAddPaymentSplit}
          onRemovePaymentSplit={onRemovePaymentSplit}
          onConfirm={onSale}
        />
      )}
    </div>
  );
}

function SaleClosingModal({
  customerName,
  itemCount,
  subtotal,
  total,
  discount,
  surcharge,
  adjustmentReason,
  discountLimitPercent,
  maxDiscountAmount,
  discountIsInvalid,
  paymentMethod,
  paymentAmount,
  changeMethod,
  splitPayments,
  payments,
  paymentTotal,
  paymentDifference,
  splitPaymentInvalid,
  changeDue,
  processing,
  onClose,
  onDiscount,
  onSurcharge,
  onAdjustmentReason,
  onPaymentMethod,
  onPaymentAmount,
  onPaymentAmountBlur,
  onChangeMethod,
  onSplitPayments,
  onPaymentSplit,
  onAddPaymentSplit,
  onRemovePaymentSplit,
  onConfirm,
}: {
  customerName: string;
  itemCount: number;
  subtotal: number;
  total: number;
  discount: string;
  surcharge: string;
  adjustmentReason: string;
  discountLimitPercent: number;
  maxDiscountAmount: number;
  discountIsInvalid: boolean;
  paymentMethod: string;
  paymentAmount: string;
  changeMethod: "Dinheiro" | "PIX";
  splitPayments: boolean;
  payments: PaymentSplit[];
  paymentTotal: number;
  paymentDifference: number;
  splitPaymentInvalid: boolean;
  changeDue: number;
  processing: boolean;
  onClose: () => void;
  onDiscount: (value: string) => void;
  onSurcharge: (value: string) => void;
  onAdjustmentReason: (value: string) => void;
  onPaymentMethod: (value: string) => void;
  onPaymentAmount: (value: string) => void;
  onPaymentAmountBlur: () => void;
  onChangeMethod: (value: "Dinheiro" | "PIX") => void;
  onSplitPayments: (value: boolean) => void;
  onPaymentSplit: (
    paymentId: string,
    field: "method" | "amount",
    value: string,
  ) => void;
  onAddPaymentSplit: () => void;
  onRemovePaymentSplit: (paymentId: string) => void;
  onConfirm: () => void;
}) {
  const received = splitPayments
    ? paymentTotal
    : Number(paymentAmount || total);
  const missing = splitPayments
    ? Math.max(0, paymentDifference)
    : Math.max(0, total - Number(paymentAmount || total));
  const adjustmentNeedsReason =
    (Number(discount || 0) > 0 || Number(surcharge || 0) > 0) &&
    !adjustmentReason.trim();
  const canFinalize =
    !processing &&
    !discountIsInvalid &&
    !adjustmentNeedsReason &&
    (!splitPayments ? missing < 0.01 : !splitPaymentInvalid);
  const quickMethods = [
    { label: "Dinheiro", icon: <Banknote size={20} /> },
    { label: "PIX", icon: <span className="text-lg font-black">PIX</span> },
    { label: "Cartão de crédito", icon: <CreditCard size={20} /> },
    { label: "Cartão de débito", icon: <CreditCard size={20} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-closing-title"
    >
      <section className="flex max-h-[96vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="relative overflow-hidden bg-slate-900 px-5 py-5 text-white sm:px-7">
          <div className="absolute inset-y-0 left-0 w-2 bg-[#8A0EEA]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300">
                Fechamento da venda
              </p>
              <h2 id="sale-closing-title" className="mt-1 text-2xl font-black">
                Receber pagamento
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {customerName} · {itemCount} peça(s)
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              aria-label="Fechar finalização"
              className="rounded-xl border border-white/20 bg-white/10 p-2 hover:bg-white/20 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <ClosingMetric label="Valor da venda" value={total} highlight />
            <ClosingMetric label="Valor recebido" value={received} />
            <ClosingMetric
              label={changeDue > 0 ? "Troco" : "Falta"}
              value={changeDue > 0 ? changeDue : missing}
              tone={
                changeDue > 0 ? "success" : missing > 0 ? "danger" : "success"
              }
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900">Forma de pagamento</h3>
              <button
                type="button"
                onClick={() => onSplitPayments(!splitPayments)}
                className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-[#8A0EEA]"
              >
                {splitPayments ? "Usar uma forma" : "Dividir pagamento"}
              </button>
            </div>

            {!splitPayments ? (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickMethods.map((method) => (
                    <button
                      key={method.label}
                      type="button"
                      onClick={() => {
                        onPaymentMethod(method.label);
                        onPaymentAmount(total.toFixed(2));
                      }}
                      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-xs font-bold transition ${
                        paymentMethod === method.label
                          ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA] ring-2 ring-purple-100"
                          : "border-slate-200 text-slate-700 hover:border-purple-300"
                      }`}
                    >
                      {method.icon}
                      {method.label}
                    </button>
                  ))}
                </div>
                <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  Valor recebido
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => onPaymentAmount(event.target.value)}
                    onBlur={onPaymentAmountBlur}
                    placeholder={total.toFixed(2)}
                    className="rounded-2xl border border-slate-300 bg-amber-50 px-4 py-3 text-right text-xl font-black outline-none focus:border-[#8A0EEA] focus:ring-2 focus:ring-purple-100"
                  />
                </label>
              </>
            ) : (
              <div className="mt-3 space-y-3">
                {payments.map((payment) => {
                  const otherTotal = payments.reduce(
                    (sum, item) =>
                      item.id === payment.id
                        ? sum
                        : sum + Number(item.amount || 0),
                    0,
                  );
                  const remaining = Math.max(0, total - otherTotal);
                  return (
                    <div
                      key={payment.id}
                      className="grid gap-2 rounded-2xl border bg-slate-50 p-3 sm:grid-cols-[1fr_150px_auto_auto]"
                    >
                      <select
                        value={payment.method}
                        onChange={(event) =>
                          onPaymentSplit(
                            payment.id,
                            "method",
                            event.target.value,
                          )
                        }
                        className="rounded-xl border bg-white p-3 text-sm"
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
                          onPaymentSplit(
                            payment.id,
                            "amount",
                            event.target.value,
                          )
                        }
                        placeholder="Valor"
                        className="rounded-xl border bg-white p-3 text-right font-bold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onPaymentSplit(
                            payment.id,
                            "amount",
                            remaining.toFixed(2),
                          )
                        }
                        className="rounded-xl border bg-white px-3 text-xs font-bold text-[#8A0EEA]"
                      >
                        Restante
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemovePaymentSplit(payment.id)}
                        disabled={payments.length === 1}
                        aria-label="Remover forma"
                        className="rounded-xl border bg-white p-3 text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={onAddPaymentSplit}
                  className="inline-flex items-center gap-1 text-sm font-bold text-[#8A0EEA]"
                >
                  <Plus size={16} /> Adicionar forma
                </button>
              </div>
            )}
          </div>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer font-bold text-slate-800">
              Desconto ou acréscimo
            </summary>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                Desconto (limite {discountLimitPercent}%)
                <input
                  type="number"
                  min="0"
                  max={maxDiscountAmount}
                  step="0.01"
                  value={discount}
                  onChange={(event) => onDiscount(event.target.value)}
                  className="rounded-xl border bg-white p-3 text-sm text-slate-900"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                Acréscimo
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={surcharge}
                  onChange={(event) => onSurcharge(event.target.value)}
                  className="rounded-xl border bg-white p-3 text-sm text-slate-900"
                />
              </label>
            </div>
            {(Number(discount || 0) > 0 || Number(surcharge || 0) > 0) && (
              <input
                value={adjustmentReason}
                onChange={(event) => onAdjustmentReason(event.target.value)}
                placeholder="Motivo obrigatório"
                className="mt-3 w-full rounded-xl border bg-white p-3 text-sm"
              />
            )}
            <p className="mt-3 text-right text-xs text-slate-500">
              Subtotal {formatCurrency(subtotal)}
            </p>
          </details>

          {changeDue > 0 && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">
                Entregar troco de {formatCurrency(changeDue)} por:
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["Dinheiro", "PIX"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => onChangeMethod(method)}
                    className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                      changeMethod === method
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-white text-emerald-800"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="grid gap-3 border-t bg-slate-50 p-4 sm:grid-cols-2 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-xl border bg-white py-3 font-bold text-slate-700 disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canFinalize}
            className="rounded-xl bg-[#8A0EEA] py-3 font-black text-white shadow-lg shadow-purple-200 disabled:opacity-50"
          >
            {processing
              ? "Processando..."
              : `Finalizar · ${formatCurrency(total)}`}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ClosingMetric({
  label,
  value,
  highlight = false,
  tone,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  tone?: "success" | "danger";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight
          ? "border-purple-200 bg-purple-50"
          : tone === "success"
            ? "border-emerald-200 bg-emerald-50"
            : tone === "danger"
              ? "border-red-200 bg-red-50"
              : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <strong className="mt-1 block text-xl text-slate-900">
        {formatCurrency(value)}
      </strong>
    </div>
  );
}


