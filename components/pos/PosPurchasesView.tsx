"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  type NewPurchaseOrderInput,
  PurchaseOrdersPanel,
} from "@/components/pos/PurchaseOrdersPanel";
import { ReplenishmentPanel } from "@/components/pos/ReplenishmentPanel";
import { PurchaseDocumentActions } from "@/components/purchases/PurchaseDocumentActions";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type {
  PosSale,
  Product,
  ProductPurchase,
  PurchaseOrder,
  Supplier,
} from "@/types/domain";
import type { PurchaseDocumentArchive } from "@/types/purchase-recognition";
export function PurchasesView({
  purchases,
  purchaseDocuments,
  purchaseOrders,
  suppliers,
  products,
  sales,
  onCreateOrder,
  onOrderStatus,
  onOrderReceive,
  onDeletePurchase,
}: {
  purchases: ProductPurchase[];
  purchaseDocuments: PurchaseDocumentArchive[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  sales: PosSale[];
  onCreateOrder: (input: NewPurchaseOrderInput) => Promise<void>;
  onOrderStatus: (id: number, status: "Enviado" | "Cancelado") => Promise<void>;
  onOrderReceive: (
    id: number,
    receipts: Array<{ item_id: number; quantidade: number }>,
  ) => Promise<void>;
  onDeletePurchase: (id: number) => Promise<void>;
}) {
  const [supplierFilter, setSupplierFilter] = useState("");
  const [documentFilter, setDocumentFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [onlyWithFile, setOnlyWithFile] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] =
    useState<ProductPurchase | null>(null);
  const [deletingPurchase, setDeletingPurchase] = useState(false);

  const purchaseDocumentIds = useMemo(
    () => new Set(purchaseDocuments.map((item) => item.linked_record_id)),
    [purchaseDocuments],
  );
  const filteredPurchases = useMemo(
    () =>
      purchases.filter((purchase) => {
        const supplierName = purchase.suppliers?.nome?.toLowerCase() || "";
        const documentNumber = purchase.numero_documento?.toLowerCase() || "";
        return (
          (!supplierFilter ||
            supplierName.includes(supplierFilter.trim().toLowerCase())) &&
          (!documentFilter ||
            documentNumber.includes(documentFilter.trim().toLowerCase())) &&
          (!startDateFilter || purchase.data_compra >= startDateFilter) &&
          (!endDateFilter || purchase.data_compra <= endDateFilter) &&
          (!onlyWithFile || purchaseDocumentIds.has(purchase.id))
        );
      }),
    [
      documentFilter,
      endDateFilter,
      onlyWithFile,
      purchaseDocumentIds,
      purchases,
      startDateFilter,
      supplierFilter,
    ],
  );
  const supplierComparison = useMemo(() => {
    const minimumCostByProduct = new Map<number, number>();
    const suppliersByProduct = new Map<number, Set<string>>();

    filteredPurchases.forEach((purchase) => {
      purchase.product_purchase_items?.forEach((item) => {
        const cost = Number(item.custo_unitario);
        const supplierKey = String(
          purchase.supplier_id || purchase.suppliers?.nome || "unknown",
        );
        const currentMinimum = minimumCostByProduct.get(item.product_id);
        if (currentMinimum === undefined || cost < currentMinimum) {
          minimumCostByProduct.set(item.product_id, cost);
        }
        const productSuppliers =
          suppliersByProduct.get(item.product_id) || new Set<string>();
        productSuppliers.add(supplierKey);
        suppliersByProduct.set(item.product_id, productSuppliers);
      });
    });

    const comparison = new Map<
      string,
      {
        supplierId?: number;
        name: string;
        purchaseCount: number;
        total: number;
        productIds: Set<number>;
        bestPriceCount: number;
        comparedItemCount: number;
        lastPurchaseDate: string;
      }
    >();

    filteredPurchases.forEach((purchase) => {
      const name = purchase.suppliers?.nome || "Fornecedor não informado";
      const key = String(purchase.supplier_id || name);
      const current = comparison.get(key) || {
        supplierId: purchase.supplier_id,
        name,
        purchaseCount: 0,
        total: 0,
        productIds: new Set<number>(),
        bestPriceCount: 0,
        comparedItemCount: 0,
        lastPurchaseDate: "",
      };

      current.purchaseCount += 1;
      current.total += Number(purchase.total || 0);
      if (purchase.data_compra > current.lastPurchaseDate) {
        current.lastPurchaseDate = purchase.data_compra;
      }
      purchase.product_purchase_items?.forEach((item) => {
        const cost = Number(item.custo_unitario);
        const minimum = minimumCostByProduct.get(item.product_id);
        current.productIds.add(item.product_id);
        if ((suppliersByProduct.get(item.product_id)?.size || 0) > 1) {
          current.comparedItemCount += 1;
          if (minimum !== undefined && Math.abs(cost - minimum) < 0.01) {
            current.bestPriceCount += 1;
          }
        }
      });
      comparison.set(key, current);
    });

    return [...comparison.values()].sort(
      (left, right) =>
        right.bestPriceCount - left.bestPriceCount ||
        right.purchaseCount - left.purchaseCount ||
        right.total - left.total,
    );
  }, [filteredPurchases]);

  function clearPurchaseFilters() {
    setSupplierFilter("");
    setDocumentFilter("");
    setStartDateFilter("");
    setEndDateFilter("");
    setOnlyWithFile(false);
  }

  return (
    <div className="space-y-6">
      <ReplenishmentPanel
        products={products}
        sales={sales}
        purchases={purchases}
        suppliers={suppliers}
        onCreateOrder={onCreateOrder}
      />
      <PurchaseOrdersPanel
        orders={purchaseOrders}
        products={products}
        suppliers={suppliers}
        onCreate={onCreateOrder}
        onStatus={onOrderStatus}
        onReceive={onOrderReceive}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-slate-50/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <input
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
                placeholder="Filtrar fornecedor"
                className="rounded-xl border bg-white px-3 py-2 text-sm"
              />
              <input
                value={documentFilter}
                onChange={(event) => setDocumentFilter(event.target.value)}
                placeholder="Número da nota"
                className="rounded-xl border bg-white px-3 py-2 text-sm"
              />
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                De
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(event) => setStartDateFilter(event.target.value)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-600">
                Até
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(event) => setEndDateFilter(event.target.value)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-normal"
                />
              </label>
              <div className="flex items-end gap-2">
                <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={onlyWithFile}
                    onChange={(event) => setOnlyWithFile(event.target.checked)}
                    className="accent-[#8A0EEA]"
                  />
                  Com arquivo
                </label>
                <button
                  type="button"
                  onClick={clearPurchaseFilters}
                  className="min-h-10 rounded-xl border bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Limpar
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {filteredPurchases.length} de {purchases.length} compra(s)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">Número</th>
                  <th className="p-4 text-left">Fornecedor</th>
                  <th className="p-4 text-left">Documento</th>
                  <th className="p-4 text-left">Data</th>
                  <th className="p-4 text-left">Pagamento</th>
                  <th className="p-4 text-left">Total</th>
                  <th className="p-4 text-right">Arquivo e ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      Nenhuma compra encontrada com esses filtros.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-t">
                      <td className="p-4">
                        #{String(purchase.id).padStart(6, "0")}
                      </td>
                      <td className="p-4">{purchase.suppliers?.nome || "-"}</td>
                      <td className="p-4">
                        {purchase.numero_documento || "-"}
                      </td>
                      <td className="p-4">
                        {formatDate(purchase.data_compra)}
                      </td>
                      <td className="p-4">
                        {purchase.product_purchase_payments?.length ? (
                          <div className="space-y-1">
                            {purchase.product_purchase_payments.map(
                              (payment, index) => (
                                <p
                                  key={`${purchase.id}-${payment.payment_method}-${index}`}
                                  className="text-sm whitespace-nowrap"
                                >
                                  {payment.payment_method}:{" "}
                                  <strong>
                                    {formatCurrency(payment.amount)}
                                  </strong>
                                </p>
                              ),
                            )}
                          </div>
                        ) : (
                          purchase.forma_pagamento || "-"
                        )}
                      </td>
                      <td className="p-4">{formatCurrency(purchase.total)}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <PurchaseDocumentActions
                            document={purchaseDocuments.find(
                              (document) =>
                                document.linked_record_id === purchase.id,
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setPurchaseToDelete(purchase)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Excluir importação
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

        <aside className="self-start rounded-xl border bg-white p-4 xl:sticky xl:top-4">
          <h2 className="font-bold">Comparativo de fornecedores</h2>
          <p className="mt-1 text-xs text-slate-500">
            Resultado baseado nas compras exibidas pelos filtros.
          </p>
          <div className="mt-3 space-y-3">
            {supplierComparison.length === 0 ? (
              <p className="py-4 text-sm text-slate-500">
                Nenhuma compra disponível para comparar.
              </p>
            ) : (
              supplierComparison.map((supplier, index) => (
                <div
                  key={`${supplier.supplierId || "unknown"}-${supplier.name}`}
                  className={`rounded-xl border p-3 ${index === 0 ? "border-emerald-200 bg-emerald-50/60" : "bg-slate-50/60"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">
                        {supplier.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Última compra: {formatDate(supplier.lastPurchaseDate)}
                      </p>
                    </div>
                    {index === 0 && supplier.bestPriceCount > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                        Melhor custo
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-white p-2">
                      <span className="block text-slate-500">Compras</span>
                      <strong>{supplier.purchaseCount}</strong>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <span className="block text-slate-500">Total</span>
                      <strong>{formatCurrency(supplier.total)}</strong>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <span className="block text-slate-500">Ticket médio</span>
                      <strong>
                        {formatCurrency(
                          supplier.total / supplier.purchaseCount,
                        )}
                      </strong>
                    </div>
                    <div className="rounded-lg bg-white p-2">
                      <span className="block text-slate-500">Produtos</span>
                      <strong>{supplier.productIds.size}</strong>
                    </div>
                  </div>
                  {supplier.comparedItemCount > 0 && (
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      Menor custo em {supplier.bestPriceCount} de{" "}
                      {supplier.comparedItemCount} item(ns) comparado(s)
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
      <ConfirmationDialog
        isOpen={Boolean(purchaseToDelete)}
        title="Excluir importação de compra?"
        description={`A compra #${String(purchaseToDelete?.id || "").padStart(6, "0")} será excluída. O estoque recebido e os títulos financeiros vinculados serão revertidos. A operação será bloqueada se o estoque já utilizado não puder ser devolvido.`}
        confirmText={deletingPurchase ? "Excluindo..." : "Excluir e reverter"}
        onCancel={() => {
          if (!deletingPurchase) setPurchaseToDelete(null);
        }}
        onConfirm={() => {
          if (!purchaseToDelete || deletingPurchase) return;
          setDeletingPurchase(true);
          void onDeletePurchase(purchaseToDelete.id)
            .then(() => setPurchaseToDelete(null))
            .finally(() => setDeletingPurchase(false));
        }}
      />
    </div>
  );
}


