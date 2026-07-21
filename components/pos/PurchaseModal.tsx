"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { Product, Supplier } from "@/types/domain";

interface PurchaseLine {
  id: number;
  productName: string;
  productId: string;
  quantity: string;
  unitCost: string;
}

interface PurchasePaymentLine {
  id: number;
  paymentMethod: string;
  amount: string;
}

export interface PurchaseInput {
  supplierId: number;
  documentNumber: string;
  purchaseDate: string;
  dueDate: string;
  payments: Array<{
    payment_method: string;
    amount: number;
  }>;
  notes: string;
  items: Array<{
    product_id: number;
    quantidade: number;
    custo_unitario: number;
  }>;
}

export function PurchaseModal({
  products,
  suppliers,
  onSave,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: PurchaseInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [dueDate, setDueDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [payments, setPayments] = useState<PurchasePaymentLine[]>([
    { id: 1, paymentMethod: "Boleto", amount: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      id: 1,
      productName: "",
      productId: "",
      quantity: "1",
      unitCost: "",
    },
  ]);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
        0,
      ),
    [lines],
  );
  const paymentTotal = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const paymentDifference = total - paymentTotal;

  function updateLine(
    id: number,
    field: keyof Omit<PurchaseLine, "id">,
    value: string,
  ) {
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    );
  }

  function addLine() {
    setLines((current) => [
      ...current,
      {
        id: Math.max(...current.map((line) => line.id), 0) + 1,
        productName: "",
        productId: "",
        quantity: "1",
        unitCost: "",
      },
    ]);
  }

  async function handleSave() {
    const parsedItems = lines.map((line) => ({
      product_id: Number(line.productId),
      quantidade: Number(line.quantity),
      custo_unitario: Number(line.unitCost),
    }));

    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }

    if (
      parsedItems.some(
        (item) =>
          !item.product_id ||
          !Number.isInteger(item.quantidade) ||
          item.quantidade <= 0 ||
          !Number.isFinite(item.custo_unitario) ||
          item.custo_unitario < 0,
      )
    ) {
      toast.error("Preencha corretamente os itens da compra");
      return;
    }

    const parsedPayments = payments.map((payment) => ({
      payment_method: payment.paymentMethod.trim(),
      amount:
        payments.length === 1 && payment.amount === ""
          ? Number(total.toFixed(2))
          : Number(payment.amount),
    }));

    if (
      total <= 0 ||
      parsedPayments.some(
        (payment) =>
          !payment.payment_method ||
          !Number.isFinite(payment.amount) ||
          payment.amount <= 0,
      ) ||
      Math.abs(
        parsedPayments.reduce((sum, payment) => sum + payment.amount, 0) -
          total,
      ) > 0.009
    ) {
      toast.error("A soma dos pagamentos deve ser igual ao total da compra");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        supplierId: Number(supplierId),
        documentNumber,
        purchaseDate,
        dueDate,
        payments: parsedPayments,
        notes,
        items: parsedItems,
      });
      setOpen(false);
      setSupplierId("");
      setDocumentNumber("");
      setNotes("");
      setPayments([{ id: 1, paymentMethod: "Boleto", amount: "" }]);
      setLines([
        {
          id: 1,
          productName: "",
          productId: "",
          quantity: "1",
          unitCost: "",
        },
      ]);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#8A0EEA] px-4 py-2 text-white"
      >
        Nova compra
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="mb-5 text-xl font-bold">Entrada de produtos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium">
                Fornecedor
                <select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option value="">Selecione</option>
                  {suppliers
                    .filter((supplier) => supplier.ativo)
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.nome}
                      </option>
                    ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Vencimento
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Nota / Documento
                <input
                  value={documentNumber}
                  onChange={(event) => setDocumentNumber(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Data da compra
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => setPurchaseDate(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
            </div>

            <div className="mt-5 space-y-3">
              {lines.map((line) => {
                const selectedProduct = products.find(
                  (product) => String(product.id) === line.productId,
                );
                const conversion = Math.max(
                  1,
                  Number(selectedProduct?.units_per_purchase || 1),
                );

                return (
                  <div
                    key={line.id}
                    className="grid gap-3 rounded-xl border p-3 lg:grid-cols-[minmax(150px,1fr)_minmax(180px,1.4fr)_100px_150px_40px]"
                  >
                    <select
                      value={line.productName}
                      onChange={(event) => {
                        updateLine(line.id, "productName", event.target.value);
                        updateLine(line.id, "productId", "");
                      }}
                      className="rounded-xl border p-3"
                    >
                      <option value="">Produto</option>
                      {Array.from(
                        new Set(
                          products
                            .filter((product) => product.ativo)
                            .map((product) => product.nome),
                        ),
                      ).map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={line.productId}
                      onChange={(event) =>
                        updateLine(line.id, "productId", event.target.value)
                      }
                      className="rounded-xl border p-3"
                    >
                      <option value="">Variação</option>
                      {products
                        .filter(
                          (product) =>
                            product.ativo && product.nome === line.productName,
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.sku} · {formatProductName(product)}
                          </option>
                        ))}
                    </select>
                    <label className="grid gap-1 text-xs font-medium text-slate-500">
                      Qtd. {selectedProduct?.purchase_unit || "UN"}
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.id, "quantity", event.target.value)
                        }
                        aria-label="Quantidade de compra"
                        className="rounded-xl border p-3 text-sm text-slate-900"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-slate-500">
                      Custo por {selectedProduct?.purchase_unit || "unidade"}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitCost}
                        onChange={(event) =>
                          updateLine(line.id, "unitCost", event.target.value)
                        }
                        placeholder="0,00"
                        className="rounded-xl border p-3 text-sm text-slate-900"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLines((current) =>
                          current.filter((item) => item.id !== line.id),
                        )
                      }
                      disabled={lines.length === 1}
                      aria-label="Remover item"
                      className="flex items-center justify-center rounded-xl border text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                    {selectedProduct && conversion > 1 && (
                      <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700 lg:col-span-5">
                        {line.quantity || 0} {selectedProduct.purchase_unit} ={" "}
                        {Number(line.quantity || 0) * conversion}{" "}
                        {selectedProduct.sale_unit} no estoque
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-[#8A0EEA]"
            >
              <Plus size={17} />
              Adicionar item
            </button>

            <section className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Formas de pagamento
                  </h3>
                  <p className="text-sm text-slate-500">
                    Divida o total entre duas ou mais formas, se necessário.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPayments((current) => [
                      ...current,
                      {
                        id: Math.max(...current.map((item) => item.id), 0) + 1,
                        paymentMethod: "PIX",
                        amount: "",
                      },
                    ])
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-[#8A0EEA]"
                >
                  <Plus size={16} /> Mais uma forma
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {payments.map((payment) => {
                  const otherPaymentsTotal = payments.reduce(
                    (sum, item) =>
                      item.id === payment.id
                        ? sum
                        : sum + Number(item.amount || 0),
                    0,
                  );
                  const remainingForPayment = Math.max(
                    0,
                    total - otherPaymentsTotal,
                  );

                  return (
                    <div
                      key={payment.id}
                      className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto_auto]"
                    >
                      <select
                        value={payment.paymentMethod}
                        onChange={(event) =>
                          setPayments((current) =>
                            current.map((item) =>
                              item.id === payment.id
                                ? {
                                    ...item,
                                    paymentMethod: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                        className="rounded-xl border bg-white p-3"
                        aria-label="Forma de pagamento da compra"
                      >
                        <option>Boleto</option>
                        <option>PIX</option>
                        <option>Transferência</option>
                        <option>Cartão de crédito</option>
                        <option>Cartão de débito</option>
                        <option>Dinheiro</option>
                      </select>
                      <input
                        type="number"
                        min="0.01"
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
                        placeholder={formatCurrency(remainingForPayment)}
                        aria-label="Valor desta forma de pagamento"
                        className="rounded-xl border bg-white p-3"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPayments((current) =>
                            current.map((item) =>
                              item.id === payment.id
                                ? {
                                    ...item,
                                    amount: remainingForPayment.toFixed(2),
                                  }
                                : item,
                            ),
                          )
                        }
                        className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-[#8A0EEA]"
                      >
                        Usar restante
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPayments((current) =>
                            current.filter((item) => item.id !== payment.id),
                          )
                        }
                        disabled={payments.length === 1}
                        aria-label="Remover forma de pagamento"
                        className="rounded-xl border bg-white p-3 text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-x-5 gap-y-1 text-sm">
                <span className="text-slate-500">
                  Informado: {formatCurrency(paymentTotal)}
                </span>
                <strong
                  className={
                    Math.abs(paymentDifference) <= 0.009
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {paymentDifference >= 0 ? "Falta" : "Excedeu"}:{" "}
                  {formatCurrency(Math.abs(paymentDifference))}
                </strong>
              </div>
            </section>

            <label className="mt-5 grid gap-2 text-sm font-medium">
              Observações
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="resize-none rounded-xl border p-3 font-normal"
              />
            </label>

            <div className="mt-5 flex items-center justify-between border-t pt-4">
              <span className="font-medium">Total da compra</span>
              <strong className="text-2xl text-[#8A0EEA]">
                {formatCurrency(total)}
              </strong>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2 sm:flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
              >
                {saving ? "Registrando..." : "Registrar compra"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
