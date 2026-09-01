"use client";

import { Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { PrintMetric, Summary } from "@/components/pos/pos-page-shared";
import { ProductModal } from "@/components/pos/ProductModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCurrency, formatDate, formatProductName } from "@/lib/formatters";
import { isProductFiscalReady } from "@/lib/product-fiscal";
import { formatPackStock } from "@/lib/product-stock";
import type {
  NewProductInput,
  PosSale,
  Product,
  ProductCategory,
} from "@/types/domain";
function StockTurnoverDashboard({
  products,
  sales,
}: {
  products: Product[];
  sales: PosSale[];
}) {
  const [reportToPrint, setReportToPrint] = useState(false);

  const report = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const soldByProduct = new Map<
      number,
      { quantity: number; revenue: number }
    >();

    sales
      .filter(
        (sale) =>
          sale.status !== "Cancelada" &&
          new Date(sale.created_at) >= cutoffDate,
      )
      .forEach((sale) => {
        sale.pos_sale_items?.forEach((item) => {
          if (!item.product_id) {
            return;
          }

          const current = soldByProduct.get(item.product_id) || {
            quantity: 0,
            revenue: 0,
          };
          soldByProduct.set(item.product_id, {
            quantity: current.quantity + Number(item.quantidade || 0),
            revenue: current.revenue + Number(item.subtotal || 0),
          });
        });
      });

    const rows = products
      .map((product) => ({
        product,
        quantitySold: soldByProduct.get(product.id)?.quantity || 0,
        revenue: soldByProduct.get(product.id)?.revenue || 0,
      }))
      .sort((first, second) => second.quantitySold - first.quantitySold);

    return {
      rows,
      lowStock: rows.filter(
        ({ product }) => product.estoque <= product.estoque_minimo,
      ),
      noMovement: rows.filter(({ quantitySold }) => quantitySold === 0),
      unitsSold: rows.reduce((sum, row) => sum + row.quantitySold, 0),
      revenue: rows.reduce((sum, row) => sum + row.revenue, 0),
      inventoryCost: products.reduce(
        (sum, product) =>
          sum + Number(product.preco_custo || 0) * Number(product.estoque || 0),
        0,
      ),
    };
  }, [products, sales]);

  function printReport() {
    setReportToPrint(true);
    window.addEventListener("afterprint", () => setReportToPrint(false), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      <section className="mb-6 space-y-4 rounded-xl border bg-white p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Estoque e giro de produtos</h2>
            <p className="text-sm text-slate-500">
              Vendas e movimentação dos últimos 30 dias.
            </p>
          </div>
          <button
            type="button"
            onClick={printReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
          >
            <Printer size={16} />
            Imprimir relatório
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Summary label="Produtos ativos" value={products.length} />
          <Summary label="Estoque baixo" value={report.lowStock.length} />
          <Summary label="Sem giro" value={report.noMovement.length} />
          <Summary label="Unidades vendidas" value={report.unitsSold} />
          <Summary
            label="Custo em estoque"
            value={report.inventoryCost}
            currency
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-red-50 p-3 font-semibold text-red-700">
              Reposição necessária
            </div>
            <div className="max-h-64 overflow-y-auto">
              {report.lowStock.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  Nenhum produto com estoque baixo.
                </p>
              ) : (
                report.lowStock.map(({ product }) => (
                  <div
                    key={product.id}
                    className="flex justify-between gap-3 border-b p-3 text-sm last:border-b-0"
                  >
                    <span>{formatProductName(product)}</span>
                    <strong className="text-red-600">
                      {product.estoque} / mín. {product.estoque_minimo}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-purple-50 p-3 font-semibold text-[#8A0EEA]">
              Produtos com maior giro
            </div>
            <div className="max-h-64 overflow-y-auto">
              {report.rows.slice(0, 10).map((row) => (
                <div
                  key={row.product.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 border-b p-3 text-sm last:border-b-0"
                >
                  <span>{formatProductName(row.product)}</span>
                  <strong>{row.quantitySold} un.</strong>
                  <strong>{formatCurrency(row.revenue)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {reportToPrint && (
        <section className="document-print-area hidden bg-white p-8 text-slate-950 print:block">
          <header className="border-b-4 border-[#8A0EEA] pb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
              Clínica Veterinária Pet Maia
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              Relatório de estoque e giro
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Últimos 30 dias · Emitido em{" "}
              {formatDate(new Date().toISOString())}
            </p>
          </header>

          <div className="mt-6 grid grid-cols-5 gap-3">
            <PrintMetric label="Produtos" textValue={String(products.length)} />
            <PrintMetric
              label="Estoque baixo"
              textValue={String(report.lowStock.length)}
            />
            <PrintMetric
              label="Sem giro"
              textValue={String(report.noMovement.length)}
            />
            <PrintMetric
              label="Unidades vendidas"
              textValue={String(report.unitsSold)}
            />
            <PrintMetric
              label="Custo em estoque"
              value={report.inventoryCost}
            />
          </div>

          <table className="mt-6 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border p-2">Produto</th>
                <th className="border p-2">Categoria</th>
                <th className="border p-2">Estoque</th>
                <th className="border p-2">Mínimo</th>
                <th className="border p-2">Vendidos</th>
                <th className="border p-2">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.product.id}>
                  <td className="border p-2">
                    {formatProductName(row.product)}
                  </td>
                  <td className="border p-2">{row.product.categoria || "-"}</td>
                  <td className="border p-2">{row.product.estoque}</td>
                  <td className="border p-2">{row.product.estoque_minimo}</td>
                  <td className="border p-2">{row.quantitySold}</td>
                  <td className="border p-2">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

export function ProductsView({
  products,
  categories,
  sales,
  onSave,
  onDelete,
  onBulkDelete,
}: {
  products: Product[];
  categories: ProductCategory[];
  sales: PosSale[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
  onBulkDelete: (productIds: number[]) => Promise<void>;
}) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "active" | "inactive" | "all"
  >("active");
  const activeProducts = products.filter((product) => product.ativo);
  const inactiveProducts = products.filter((product) => !product.ativo);
  const normalizedProductSearch = productSearch
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");
  const visibleProducts = products.filter((product) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? product.ativo : !product.ativo);
    if (!matchesStatus) return false;
    if (!normalizedProductSearch) return true;

    return [
      product.nome,
      product.sku,
      product.barcode,
      product.categoria,
      product.tamanho,
      product.cor,
      product.sabor,
    ]
      .filter(Boolean)
      .join(" ")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedProductSearch);
  });
  const selectableProducts = visibleProducts;
  const allVisibleSelected =
    selectableProducts.length > 0 &&
    selectableProducts.every((product) =>
      selectedProductIds.includes(product.id),
    );

  function toggleProductSelection(productId: number) {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleAllVisible() {
    const visibleIds = selectableProducts.map((product) => product.id);
    setSelectedProductIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  }

  async function handleConfirmBulkDelete() {
    if (selectedProductIds.length === 0) return;

    setDeleting(true);
    try {
      await onBulkDelete(selectedProductIds);
      setSelectedProductIds([]);
      setBulkDeleteOpen(false);
    } catch {
      return;
    } finally {
      setDeleting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!productToDelete) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(productToDelete);
      setSelectedProductIds((current) =>
        current.filter((id) => id !== productToDelete.id),
      );
      setProductToDelete(null);
    } catch {
      return;
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <StockTurnoverDashboard products={activeProducts} sales={sales} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Catálogo de produtos</h2>
          <p className="text-sm text-slate-500">
            Consulte, edite, desative ou reative produtos.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {visibleProducts.length}
        </span>
      </div>

      <label className="relative block">
        <Search
          size={20}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={productSearch}
          onChange={(event) => {
            setProductSearch(event.target.value);
            setSelectedProductIds([]);
          }}
          placeholder="Buscar por nome, código, categoria ou variação"
          aria-label="Buscar produtos no catálogo"
          className="min-h-12 w-full rounded-xl border bg-white pr-4 pl-12 text-base outline-none transition focus:border-[#8A0EEA] focus:ring-2 focus:ring-purple-100"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto rounded-xl border bg-white p-2">
        {(
          [
            ["active", `Ativos (${activeProducts.length})`],
            ["inactive", `Inativos (${inactiveProducts.length})`],
            ["all", `Todos (${products.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatusFilter(value);
              setSelectedProductIds([]);
            }}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              statusFilter === value
                ? "bg-[#8A0EEA] text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectableProducts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50 p-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              className="size-4 accent-[#8A0EEA]"
            />
            Selecionar todos visíveis
          </label>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={selectedProductIds.length === 0}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Excluir selecionados ({selectedProductIds.length})
          </button>
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {visibleProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Nenhum produto encontrado neste filtro.
          </div>
        ) : (
          visibleProducts.map((product) => {
            const lowStock = product.estoque <= product.estoque_minimo;
            const fiscalReady = isProductFiscalReady(product);
            const packStock = formatPackStock(product);

            return (
              <article
                key={product.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${!product.ativo ? "border-slate-300 opacity-80" : ""}`}
              >
                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                    className="size-5 accent-[#8A0EEA]"
                  />
                  Selecionar
                </label>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-slate-900">
                      {formatProductName(product)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.barcode || product.sku || "Sem código"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.categoria || "Sem categoria"}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-[#8A0EEA]">
                    {formatCurrency(product.preco_venda)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Estoque atual</p>
                    <p
                      className={`text-xl font-bold ${lowStock ? "text-red-600" : "text-slate-900"}`}
                    >
                      {packStock?.summary || product.estoque}
                    </p>
                    {packStock && (
                      <p className="mt-1 text-xs text-slate-500">
                        {packStock.detail}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      lowStock
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {lowStock ? "Estoque baixo" : "Estoque normal"}
                  </span>
                </div>
                <span
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fiscalReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
                >
                  {fiscalReady ? "Fiscal completo" : "Fiscal pendente"}
                </span>
                {!product.ativo && (
                  <span className="mt-3 ml-2 inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Inativo — edite para reativar
                  </span>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                  <div className="flex min-h-10 items-center justify-center rounded-xl bg-purple-50 font-semibold text-[#8A0EEA]">
                    <ProductModal
                      product={product}
                      categories={categories}
                      onSave={onSave}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
                    className="min-h-10 rounded-xl bg-red-50 font-semibold text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="w-12 p-4 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    disabled={selectableProducts.length === 0}
                    aria-label="Selecionar todos os produtos visíveis"
                    className="size-4 accent-[#8A0EEA]"
                  />
                </th>
                <th className="p-4 text-left">Produto</th>
                <th className="p-4 text-left">Categoria</th>
                <th className="p-4 text-left">Venda</th>
                <th className="p-4 text-left">Estoque</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhum produto encontrado neste filtro.
                  </td>
                </tr>
              ) : (
                visibleProducts.map((product) => {
                  const packStock = formatPackStock(product);

                  return (
                    <tr
                      key={product.id}
                      className={`border-t ${!product.ativo ? "bg-slate-50 text-slate-500" : ""}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          aria-label={`Selecionar ${formatProductName(product)}`}
                          className="size-4 accent-[#8A0EEA]"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-medium">
                          {formatProductName(product)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.barcode || product.sku || "Sem código"}
                        </p>
                      </td>
                      <td className="p-4">{product.categoria || "-"}</td>
                      <td className="p-4">
                        {formatCurrency(product.preco_venda)}
                      </td>
                      <td
                        className={`p-4 font-medium ${product.estoque <= product.estoque_minimo ? "text-red-600" : ""}`}
                      >
                        <span className="block">
                          {packStock?.summary || product.estoque}
                        </span>
                        {packStock && (
                          <span className="mt-1 block text-xs font-normal text-slate-500">
                            {packStock.detail}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1">
                          <span>{product.ativo ? "Ativo" : "Inativo"}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isProductFiscalReady(product) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
                          >
                            {isProductFiscalReady(product)
                              ? "Fiscal completo"
                              : "Fiscal pendente"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-3">
                          <ProductModal
                            product={product}
                            categories={categories}
                            onSave={onSave}
                          />
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="text-red-600"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(productToDelete)}
        title="Excluir produto"
        description={
          productToDelete?.ativo
            ? `Deseja retirar ${formatProductName(productToDelete)} do catálogo? Ele ficará disponível na aba Inativos.`
            : `Deseja excluir ${productToDelete ? formatProductName(productToDelete) : "este produto"} definitivamente? Esta ação não pode ser desfeita.`
        }
        confirmText={deleting ? "Excluindo..." : "Excluir"}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setProductToDelete(null);
          }
        }}
      />
      <ConfirmationDialog
        isOpen={bulkDeleteOpen}
        title="Excluir produtos selecionados"
        description={`Deseja retirar ${selectedProductIds.length} produto${selectedProductIds.length === 1 ? "" : "s"} do catálogo? O histórico de compras e vendas será preservado.`}
        confirmText={deleting ? "Excluindo..." : "Excluir selecionados"}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => {
          if (!deleting) setBulkDeleteOpen(false);
        }}
      />
    </>
  );
}


