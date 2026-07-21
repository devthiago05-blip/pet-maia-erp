"use client";

import { Package, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { Product } from "@/types/domain";

export function ProductSelectionModal({
  name,
  category,
  products,
  onAdd,
}: {
  name: string;
  category?: string;
  products: Product[];
  onAdd: (product: Product, quantity: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(String(products[0]?.id || ""));
  const [quantity, setQuantity] = useState("1");
  const selectedProduct = products.find(
    (product) => String(product.id) === productId,
  );
  const isBulkFeed = selectedProduct?.sale_unit === "100G";
  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.estoque, 0),
    [products],
  );
  const minimumPrice = Math.min(
    ...products.map((product) => Number(product.preco_venda)),
  );

  function handleAdd() {
    const parsedQuantity = Number(quantity);

    if (
      !selectedProduct ||
      !Number.isInteger(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      toast.error("Selecione a variação e informe uma quantidade válida");
      return;
    }

    if (parsedQuantity > selectedProduct.estoque) {
      toast.error("Quantidade maior que o estoque disponível");
      return;
    }

    onAdd(selectedProduct, parsedQuantity);
    setQuantity("1");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-w-0 rounded-xl border bg-white p-3 text-left transition hover:border-[#8A0EEA] sm:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <Package className="text-[#8A0EEA]" size={22} />
          <span className="text-xs font-medium text-slate-500">
            {totalStock} {products[0]?.sale_unit || "un."}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 font-bold leading-snug sm:mt-3">
          {name}
        </p>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 sm:text-sm">
          {category || "Sem categoria"} · {products.length}{" "}
          {products.length === 1 ? "opção" : "variações"}
        </p>
        <p className="mt-2 text-base font-bold text-[#8A0EEA] sm:text-lg">
          {products.length > 1 ? "A partir de " : ""}
          {formatCurrency(minimumPrice)}
          {products.length === 1 && products[0].sale_unit && (
            <span className="ml-1 text-xs font-medium text-slate-500">
              /{products[0].sale_unit}
            </span>
          )}
        </p>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-sm text-slate-500">
                  Escolha a variação e a quantidade
                  {isBulkFeed ? " de ração" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
              <label className="grid gap-2 text-sm font-medium">
                Variação
                <select
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                  className="min-w-0 rounded-xl border p-3 font-normal"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {formatProductName(product)} · {product.estoque}{" "}
                      {product.sale_unit || "un."}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {isBulkFeed ? "Porções de 100 g" : "Quantidade"}
                <input
                  type="number"
                  min="1"
                  max={selectedProduct?.estoque}
                  step="1"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
            </div>

            {selectedProduct && (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    {selectedProduct.sku} · {selectedProduct.estoque}{" "}
                    {selectedProduct.sale_unit || "un."} disponíveis
                  </span>
                  <strong className="text-[#8A0EEA]">
                    {formatCurrency(selectedProduct.preco_venda)} /
                    {selectedProduct.sale_unit || "un."}
                  </strong>
                </div>
                {isBulkFeed && Number(quantity) > 0 && (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-center text-sm font-bold text-emerald-700">
                    Peso: {Number(quantity) * 100} g · Total:{" "}
                    {formatCurrency(
                      Number(quantity) * Number(selectedProduct.preco_venda),
                    )}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedProduct || selectedProduct.estoque <= 0}
              className="mt-5 w-full rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-50"
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      )}
    </>
  );
}
