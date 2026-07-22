"use client";

import {
  CheckCircle2,
  History,
  Link2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QuickProductModal } from "@/components/pos/QuickProductModal";
import { PurchaseDocumentImporter } from "@/components/purchases/PurchaseDocumentImporter";
import { formatCurrency, formatProductName } from "@/lib/formatters";
import {
  archivePurchaseDocument,
  fetchPurchaseItemMappings,
  normalizePurchaseDescription,
  type PurchaseDocumentFile,
  savePurchaseItemMapping,
} from "@/services/purchase-recognition";
import type {
  NewProductInput,
  Product,
  ProductCategory,
  ProductPurchase,
  Supplier,
} from "@/types/domain";
import type { RecognizedPurchaseDocument } from "@/types/purchase-recognition";

interface PurchaseLine {
  id: number;
  originalDescription: string;
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
  purchases,
  suppliers,
  categories,
  onProductSave,
  onSave,
  onDocumentArchived,
}: {
  products: Product[];
  purchases: ProductPurchase[];
  suppliers: Supplier[];
  categories: ProductCategory[];
  onProductSave: (products: Array<NewProductInput | Product>) => Promise<void>;
  onSave: (purchase: PurchaseInput) => Promise<number>;
  onDocumentArchived?: () => Promise<void>;
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
      originalDescription: "",
      productName: "",
      productId: "",
      quantity: "1",
      unitCost: "",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [importedDocument, setImportedDocument] =
    useState<PurchaseDocumentFile | null>(null);
  const [savedMappings, setSavedMappings] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    void fetchPurchaseItemMappings("pdv").then(({ data }) => {
      setSavedMappings(
        Object.fromEntries(
          (data || []).map((item) => [
            item.normalized_description,
            Number(item.target_id),
          ]),
        ),
      );
    });
  }, []);

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
  const unresolvedCount = lines.filter((line) => !line.productId).length;

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
        originalDescription: "",
        productName: "",
        productId: "",
        quantity: "1",
        unitCost: "",
      },
    ]);
  }

  function applyRecognizedDocument(
    document: RecognizedPurchaseDocument,
    source: PurchaseDocumentFile,
  ) {
    setImportedDocument(source);
    let exactMatchCount = 0;
    const recognizedLines = document.items.map((item, index) => {
      const mappedId =
        savedMappings[normalizePurchaseDescription(item.description)];
      const savedProduct = products.find(
        (candidate) => candidate.id === mappedId && candidate.ativo,
      );
      const exactProduct = savedProduct
        ? undefined
        : findExactProductMatch(item, products);
      const product = savedProduct || exactProduct;
      if (exactProduct) exactMatchCount += 1;
      return {
        id: index + 1,
        originalDescription: item.description,
        productName: product?.nome || "",
        productId: product ? String(product.id) : "",
        quantity: String(item.quantity || 1),
        unitCost: String(
          item.unitCost || item.total / Math.max(item.quantity, 1) || "",
        ),
      };
    });
    if (recognizedLines.length) setLines(recognizedLines);
    if (exactMatchCount > 0) {
      toast.success(
        `${exactMatchCount} produto(s) associado(s) automaticamente por código exato.`,
      );
    }
    if (document.documentNumber) setDocumentNumber(document.documentNumber);
    if (document.purchaseDate) setPurchaseDate(document.purchaseDate);
    if (document.dueDate) setDueDate(document.dueDate);
    const supplier = findBestMatch(
      document.supplierName || "",
      suppliers.filter((item) => item.ativo),
      (item) => `${item.nome} ${item.documento || ""}`,
    );
    if (supplier) setSupplierId(String(supplier.id));
    if (document.paymentMethod)
      setPayments([
        {
          id: 1,
          paymentMethod: normalizePayment(document.paymentMethod),
          amount: document.total ? String(document.total) : "",
        },
      ]);
    setNotes((current) =>
      [
        current,
        `Documento importado: ${source.file.name}`,
        ...document.warnings,
      ]
        .filter(Boolean)
        .join(" · "),
    );
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

    if (unresolvedCount > 0) {
      toast.error(
        `Associe ou cadastre os ${unresolvedCount} produto(s) pendente(s) antes de registrar a compra.`,
      );
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
      const purchaseId = await onSave({
        supplierId: Number(supplierId),
        documentNumber,
        purchaseDate,
        dueDate,
        payments: parsedPayments,
        notes,
        items: parsedItems,
      });
      if (importedDocument) {
        const supplier = suppliers.find(
          (item) => item.id === Number(supplierId),
        );
        try {
          await archivePurchaseDocument({
            document: importedDocument,
            destinationKind: "pdv",
            linkedRecordId: purchaseId,
            documentNumber,
            supplierName: supplier?.nome,
          });
          toast.success("Documento original arquivado com a compra.");
          await onDocumentArchived?.();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? `A compra foi salva, mas o arquivo não foi arquivado: ${error.message}`
              : "A compra foi salva, mas o arquivo não foi arquivado.",
          );
        }
      }
      setOpen(false);
      setSupplierId("");
      setDocumentNumber("");
      setNotes("");
      setImportedDocument(null);
      setPayments([{ id: 1, paymentMethod: "Boleto", amount: "" }]);
      setLines([
        {
          id: 1,
          originalDescription: "",
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
            <div className="mb-5">
              <h2 className="text-xl font-bold">Entrada de produtos</h2>
              <p className="text-sm text-slate-500">
                Importe a nota, associe cada item e confira o pagamento.
              </p>
            </div>

            <section className="rounded-2xl border p-4">
              <StepTitle
                number="1"
                title="Nota e fornecedor"
                description="Importe o XML, PDF ou foto. Os dados encontrados serão preenchidos abaixo."
              />
              <div className="mt-4">
                <PurchaseDocumentImporter
                  onRecognized={applyRecognizedDocument}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </section>

            <section className="mt-5 rounded-2xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <StepTitle
                  number="2"
                  title="Associar produtos"
                  description="Para cada item da nota, escolha o produto correspondente no ERP ou cadastre um novo."
                />
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${unresolvedCount ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {unresolvedCount
                    ? `${unresolvedCount} pendente(s)`
                    : "Todos associados"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {lines.map((line) => {
                  const selectedProduct = products.find(
                    (product) => String(product.id) === line.productId,
                  );
                  const conversion = Math.max(
                    1,
                    Number(selectedProduct?.units_per_purchase || 1),
                  );
                  const registeredPurchaseCost = selectedProduct
                    ? Number(selectedProduct.preco_custo || 0) * conversion
                    : 0;
                  const importedPurchaseCost = Number(line.unitCost || 0);
                  const costDifference =
                    importedPurchaseCost - registeredPurchaseCost;
                  const hasCostDifference =
                    Boolean(selectedProduct) &&
                    importedPurchaseCost > 0 &&
                    Math.abs(costDifference) >= 0.01;

                  return (
                    <div
                      key={line.id}
                      className={`grid gap-3 rounded-2xl border p-3 lg:grid-cols-[minmax(280px,1fr)_100px_150px_40px] ${line.productId ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}`}
                    >
                      {line.originalDescription && (
                        <div className="flex flex-col gap-3 rounded-xl bg-white p-3 lg:col-span-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Item encontrado na nota
                            </p>
                            <strong className="mt-1 block text-sm text-slate-900">
                              {line.originalDescription}
                            </strong>
                            <p
                              className={`mt-1 text-xs font-semibold ${line.productId ? "text-emerald-700" : "text-amber-700"}`}
                            >
                              {line.productId
                                ? "Produto associado"
                                : "Escolha um produto abaixo ou cadastre um novo"}
                            </p>
                          </div>
                          {!line.productId && (
                            <QuickProductModal
                              categories={categories}
                              onSave={onProductSave}
                              triggerLabel="Cadastrar este produto"
                              initialName={line.originalDescription}
                              initialCost={line.unitCost}
                              onCreated={() =>
                                toast.success(
                                  "Produto cadastrado. Agora selecione-o no campo de associação.",
                                )
                              }
                              className="shrink-0 rounded-xl bg-[#8A0EEA] px-4 py-2 text-sm font-semibold text-white"
                            />
                          )}
                        </div>
                      )}
                      <label className="grid gap-1 text-xs font-bold text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Link2 size={14} /> Produto correspondente no ERP
                        </span>
                        <ProductAssociationSearch
                          products={products}
                          value={line.productId}
                          pending={!line.productId}
                          sourceDescription={line.originalDescription}
                          onChange={(value) => {
                            const targetId = Number(value);
                            const product = products.find(
                              (item) => item.id === targetId,
                            );
                            updateLine(line.id, "productId", value);
                            updateLine(
                              line.id,
                              "productName",
                              product?.nome || "",
                            );
                            if (line.originalDescription && targetId) {
                              const key = normalizePurchaseDescription(
                                line.originalDescription,
                              );
                              setSavedMappings((current) => ({
                                ...current,
                                [key]: targetId,
                              }));
                              void savePurchaseItemMapping(
                                "pdv",
                                line.originalDescription,
                                targetId,
                              );
                            }
                          }}
                        />
                      </label>
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
                        className="flex min-h-11 items-center justify-center rounded-xl border bg-white text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={18} />
                      </button>
                      {selectedProduct && conversion > 1 && (
                        <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700 lg:col-span-4">
                          {line.quantity || 0} {selectedProduct.purchase_unit} ={" "}
                          {Number(line.quantity || 0) * conversion}{" "}
                          {selectedProduct.sale_unit} no estoque
                        </p>
                      )}
                      {hasCostDifference && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 lg:col-span-4">
                          <strong className="block font-bold">
                            Custo diferente do cadastro
                          </strong>
                          <span>
                            Cadastrado: {formatCurrency(registeredPurchaseCost)}
                            {" · "}Na nota:{" "}
                            {formatCurrency(importedPurchaseCost)}
                            {" · "}
                            {costDifference > 0 ? "Aumento" : "Redução"} de{" "}
                            {formatCurrency(Math.abs(costDifference))}
                            {registeredPurchaseCost > 0 &&
                              ` (${Math.abs((costDifference / registeredPurchaseCost) * 100).toFixed(1)}%)`}
                            . Apenas informativo; o custo cadastrado não será
                            alterado automaticamente.
                          </span>
                        </div>
                      )}
                      {selectedProduct && (
                        <ProductPriceHistory
                          product={selectedProduct}
                          purchases={purchases}
                          currentInvoiceCost={importedPurchaseCost}
                        />
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
            </section>

            <section className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <StepTitle
                number="3"
                title="Pagamento"
                description="Confira o total e informe uma ou mais formas de pagamento."
              />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="mt-3 text-sm text-slate-500">
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

            <details className="mt-5 rounded-2xl border bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-bold text-slate-700">
                Observações opcionais
              </summary>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border bg-white p-3 text-sm font-normal"
                placeholder="Informações adicionais sobre esta compra"
              />
            </details>

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

function StepTitle({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8A0EEA] text-sm font-bold text-white">
        {number}
      </span>
      <div>
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          {title}
          {number === "2" && (
            <CheckCircle2 size={17} className="text-emerald-600" />
          )}
        </h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ProductPriceHistory({
  product,
  purchases,
  currentInvoiceCost,
}: {
  product: Product;
  purchases: ProductPurchase[];
  currentInvoiceCost: number;
}) {
  const history = purchases
    .flatMap((purchase) =>
      (purchase.product_purchase_items || [])
        .filter((item) => item.product_id === product.id)
        .map((item) => ({
          purchaseId: purchase.id,
          date: purchase.data_compra,
          supplier: purchase.suppliers?.nome || "Fornecedor não informado",
          document: purchase.numero_documento,
          cost: Number(item.custo_unitario),
        })),
    )
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) ||
        right.purchaseId - left.purchaseId,
    );

  if (!history.length) return null;

  const last = history[0]!;
  const cheapest = history.reduce((best, item) =>
    item.cost < best.cost ? item : best,
  );
  const comparisonCost = currentInvoiceCost || last.cost;
  const difference = comparisonCost - last.cost;
  const variation = last.cost > 0 ? (difference / last.cost) * 100 : 0;

  return (
    <details className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 lg:col-span-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-sky-900">
        <span className="inline-flex items-center gap-2">
          <History size={16} /> Histórico de preços deste produto
        </span>
        <span className="text-xs font-semibold text-sky-700">
          Último: {formatCurrency(last.cost)}
        </span>
      </summary>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-white p-3">
          <span className="block text-slate-500">Última compra</span>
          <strong className="mt-1 block text-slate-900">
            {formatCurrency(last.cost)} · {last.supplier}
          </strong>
          <span className="text-slate-500">
            {formatPurchaseDate(last.date)}
          </span>
        </div>
        <div className="rounded-lg bg-white p-3">
          <span className="block text-slate-500">Menor preço recente</span>
          <strong className="mt-1 block text-emerald-700">
            {formatCurrency(cheapest.cost)} · {cheapest.supplier}
          </strong>
          <span className="text-slate-500">
            {formatPurchaseDate(cheapest.date)}
          </span>
        </div>
        <div className="rounded-lg bg-white p-3">
          <span className="block text-slate-500">
            Nota atual x última compra
          </span>
          <strong
            className={`mt-1 block ${difference > 0 ? "text-amber-700" : difference < 0 ? "text-emerald-700" : "text-slate-700"}`}
          >
            {difference === 0
              ? "Mesmo preço"
              : `${difference > 0 ? "Aumento" : "Redução"} de ${formatCurrency(Math.abs(difference))}`}
          </strong>
          {difference !== 0 && (
            <span className="text-slate-500">
              {Math.abs(variation).toFixed(1)}% de variação
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Fornecedor</th>
              <th className="px-3 py-2">Documento</th>
              <th className="px-3 py-2 text-right">Custo</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 5).map((item) => (
              <tr key={`${item.purchaseId}-${product.id}`} className="border-t">
                <td className="px-3 py-2">{formatPurchaseDate(item.date)}</td>
                <td className="px-3 py-2">{item.supplier}</td>
                <td className="px-3 py-2">{item.document || "—"}</td>
                <td className="px-3 py-2 text-right font-bold">
                  {formatCurrency(item.cost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function formatPurchaseDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function ProductAssociationSearch({
  products,
  value,
  pending,
  sourceDescription,
  onChange,
}: {
  products: Product[];
  value: string;
  pending: boolean;
  sourceDescription: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = products.find((product) => String(product.id) === value);
  const activeProducts = products.filter((product) => product.ativo);
  const normalizedQuery = normalize(query);
  const filtered = activeProducts
    .filter((product) => {
      if (!normalizedQuery) return true;
      return normalize(
        [
          product.nome,
          product.sku,
          product.barcode,
          product.categoria,
          product.tamanho,
          product.cor,
          product.sabor,
        ]
          .filter(Boolean)
          .join(" "),
      ).includes(normalizedQuery);
    })
    .map((product) => ({
      product,
      score: productMatchScore(normalizedQuery || sourceDescription, product),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.product.nome.localeCompare(right.product.nome, "pt-BR"),
    )
    .slice(0, 40);
  const selectedLabel = selected
    ? `${formatProductName(selected)} · ${selected.sku || selected.barcode || "sem código"}`
    : "";

  return (
    <div className="relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
      />
      <input
        value={open ? query : selectedLabel}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && filtered.length === 1) {
            event.preventDefault();
            onChange(String(filtered[0]!.product.id));
            setOpen(false);
          }
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Digite nome, código ou código de barras"
        className={`w-full rounded-xl border bg-white py-3 pl-10 pr-3 text-sm font-normal outline-none ${pending ? "border-amber-400 ring-2 ring-amber-100" : "border-emerald-300"}`}
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-white p-1 shadow-xl">
          {filtered.length ? (
            filtered.map(({ product, score }, index) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(String(product.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left hover:bg-purple-50 ${String(product.id) === value ? "bg-purple-50" : ""}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <strong className="block text-sm text-slate-800">
                    {formatProductName(product)}
                  </strong>
                  {!normalizedQuery && index < 3 && score > 0 && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Sugestão {index + 1}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-500">
                  {product.sku || product.barcode || "Sem código"}
                  {product.categoria ? ` · ${product.categoria}` : ""}
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-slate-500">
              Nenhum produto encontrado. Use “Cadastrar este produto”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function productMatchScore(source: string, product: Product) {
  const normalizedSource = normalize(source);
  if (!normalizedSource) return 0;

  const sourceWords = new Set(
    normalizedSource.split(" ").filter((word) => word.length > 1),
  );
  const name = normalize(product.nome);
  const sku = normalize(product.sku || "");
  const barcode = normalize(product.barcode || "");
  const details = normalize(
    [product.categoria, product.tamanho, product.cor, product.sabor]
      .filter(Boolean)
      .join(" "),
  );

  if (barcode && normalizedSource.includes(barcode)) return 10_000;
  if (sku && normalizedSource.includes(sku)) return 9_000;
  if (name === normalizedSource) return 8_000;

  const nameMatches = [...sourceWords].filter((word) =>
    name.includes(word),
  ).length;
  const detailMatches = [...sourceWords].filter((word) =>
    details.includes(word),
  ).length;
  const phraseBonus =
    name.length > 3 && normalizedSource.includes(name) ? 100 : 0;

  return phraseBonus + nameMatches * 12 + detailMatches * 3;
}

function findExactProductMatch(
  item: RecognizedPurchaseDocument["items"][number],
  products: Product[],
) {
  const activeProducts = products.filter((product) => product.ativo);
  const importedBarcode = normalizeProductCode(item.barcode || "");

  if (importedBarcode) {
    const barcodeMatch = activeProducts.find((product) =>
      [product.barcode, product.sku]
        .map((code) => normalizeProductCode(code || ""))
        .some((code) => code === importedBarcode),
    );
    if (barcodeMatch) return barcodeMatch;
  }

  const descriptionCodes = new Set(
    item.description
      .split(/\s+/)
      .map(normalizeProductCode)
      .filter((code) => code.length >= 4),
  );

  return activeProducts.find((product) =>
    [product.sku, product.barcode]
      .map((code) => normalizeProductCode(code || ""))
      .some((code) => code.length >= 4 && descriptionCodes.has(code)),
  );
}

function normalizeProductCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findBestMatch<T>(
  source: string,
  options: T[],
  label: (item: T) => string,
) {
  const normalizedSource = normalize(source);
  if (!normalizedSource) return undefined;
  const sourceWords = new Set(
    normalizedSource.split(" ").filter((word) => word.length > 2),
  );
  return options
    .map((option) => {
      const candidate = normalize(label(option));
      const matches = [...sourceWords].filter((word) =>
        candidate.includes(word),
      ).length;
      return {
        option,
        score:
          candidate === normalizedSource
            ? 100
            : matches / Math.max(sourceWords.size, 1),
      };
    })
    .sort((a, b) => b.score - a.score)
    .find((item) => item.score >= 0.5)?.option;
}

function normalizePayment(value: string) {
  const normalized = normalize(value);
  if (normalized.includes("pix")) return "PIX";
  if (normalized.includes("dinheiro")) return "Dinheiro";
  if (normalized.includes("debito")) return "Cartão de débito";
  if (normalized.includes("credito")) return "Cartão de crédito";
  if (normalized.includes("transfer")) return "Transferência";
  return "Boleto";
}
