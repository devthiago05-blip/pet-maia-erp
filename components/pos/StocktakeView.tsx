"use client";

import { Barcode, ClipboardCheck, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatProductName } from "@/lib/formatters";
import type { Product } from "@/types/domain";

interface StocktakeItem {
  product: Product;
  countedQuantity: string;
}

interface StocktakeViewProps {
  products: Product[];
  processing: boolean;
  onComplete: (input: {
    items: Array<{ product_id: number; counted_quantity: number }>;
    notes: string;
  }) => Promise<boolean>;
}

export function StocktakeView({
  products,
  processing,
  onComplete,
}: StocktakeViewProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [notes, setNotes] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return [];
    }

    return products
      .filter(
        (product) =>
          product.ativo &&
          !items.some((item) => item.product.id === product.id) &&
          (product.nome.toLowerCase().includes(term) ||
            product.sku?.toLowerCase().includes(term) ||
            product.barcode?.toLowerCase().includes(term)),
      )
      .slice(0, 8);
  }, [items, products, search]);

  const summary = items.reduce(
    (totals, item) => {
      if (item.countedQuantity === "") {
        return totals;
      }

      const difference = Number(item.countedQuantity) - item.product.estoque;
      totals.difference += difference;

      if (difference > 0) {
        totals.surplus += difference;
      } else if (difference < 0) {
        totals.shortage += Math.abs(difference);
      } else {
        totals.unchanged += 1;
      }

      return totals;
    },
    { difference: 0, surplus: 0, shortage: 0, unchanged: 0 },
  );

  const pendingCount = items.filter(
    (item) => item.countedQuantity === "",
  ).length;

  function addProduct(product: Product) {
    setItems((current) => [
      ...current,
      { product, countedQuantity: "" },
    ]);
    setSearch("");
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const code = search.trim().toLowerCase();
    const exactProduct = products.find(
      (product) =>
        product.ativo &&
        !items.some((item) => item.product.id === product.id) &&
        (product.barcode?.trim().toLowerCase() === code ||
          product.sku?.trim().toLowerCase() === code),
    );

    if (exactProduct) {
      addProduct(exactProduct);
      return;
    }

    if (availableProducts.length === 1) {
      addProduct(availableProducts[0]);
    }
  }

  function updateQuantity(productId: number, value: string) {
    if (value !== "" && (!/^\d+$/.test(value) || Number(value) < 0)) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, countedQuantity: value }
          : item,
      ),
    );
  }

  function requestCompletion() {
    if (items.length === 0) {
      toast.error("Adicione ao menos um produto ao balanço");
      return;
    }

    if (pendingCount > 0) {
      toast.error(`Informe a contagem de ${pendingCount} produto(s)`);
      return;
    }

    setConfirmationOpen(true);
  }

  async function completeStocktake() {
    setConfirmationOpen(false);
    const completed = await onComplete({
      items: items.map((item) => ({
        product_id: item.product.id,
        counted_quantity: Number(item.countedQuantity),
      })),
      notes,
    });

    if (completed) {
      setItems([]);
      setNotes("");
      setSearch("");
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">Balanço de estoque</h2>
            <p className="mt-1 text-sm text-slate-500">
              Informe a quantidade física. Ao finalizar, ela substituirá o
              estoque atual dos produtos incluídos.
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3">
            <Search size={18} className="shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Buscar ou ler código de barras..."
              className="min-w-0 flex-1 bg-transparent py-3 outline-none"
            />
            <Barcode size={20} className="shrink-0 text-slate-400" />
          </div>

          {search.trim() && (
            <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border bg-white p-2 shadow-xl">
              {availableProducts.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">
                  Nenhum produto disponível para adicionar.
                </p>
              ) : (
                availableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg p-3 text-left hover:bg-violet-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {formatProductName(product)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {product.barcode || product.sku || "Sem código"}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-violet-700">
                      <Plus size={16} /> Adicionar
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StocktakeSummary label="Produtos" value={items.length} />
        <StocktakeSummary label="Sobras" value={summary.surplus} tone="success" />
        <StocktakeSummary label="Faltas" value={summary.shortage} tone="danger" />
        <StocktakeSummary
          label="Diferença líquida"
          value={summary.difference}
          tone={summary.difference < 0 ? "danger" : "success"}
          signed
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Busque um produto para começar o balanço.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 text-sm text-slate-600">
                <tr>
                  <th className="p-4 text-left">Produto</th>
                  <th className="p-4 text-left">Código</th>
                  <th className="p-4 text-center">Estoque atual</th>
                  <th className="p-4 text-center">Contagem física</th>
                  <th className="p-4 text-center">Diferença</th>
                  <th className="p-4 text-center">Remover</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const hasCount = item.countedQuantity !== "";
                  const difference = hasCount
                    ? Number(item.countedQuantity) - item.product.estoque
                    : null;

                  return (
                    <tr key={item.product.id} className="border-t">
                      <td className="p-4 font-semibold">
                        {formatProductName(item.product)}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {item.product.barcode || item.product.sku || "-"}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {item.product.estoque}
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={item.countedQuantity}
                          onChange={(event) =>
                            updateQuantity(item.product.id, event.target.value)
                          }
                          aria-label={`Contagem física de ${item.product.nome}`}
                          className="w-28 rounded-lg border px-3 py-2 text-center font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        />
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-sm font-bold ${
                            difference === null || difference === 0
                              ? "bg-slate-100 text-slate-600"
                              : difference > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {difference === null
                            ? "-"
                            : difference > 0
                              ? `+${difference}`
                              : difference}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setItems((current) =>
                              current.filter(
                                (currentItem) =>
                                  currentItem.product.id !== item.product.id,
                              ),
                            )
                          }
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Remover ${item.product.nome} do balanço`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <label className="grid min-w-0 gap-2 text-sm font-semibold">
          Observação do balanço
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ex: Contagem geral realizada no fechamento do mês"
            rows={3}
            className="w-full min-w-0 resize-y rounded-xl border p-3 font-normal"
          />
        </label>
        <button
          type="button"
          onClick={requestCompletion}
          disabled={processing || items.length === 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
        >
          <ClipboardCheck size={20} />
          {processing ? "Finalizando..." : "Finalizar balanço"}
        </button>
      </div>

      <ConfirmationDialog
        isOpen={confirmationOpen}
        title="Finalizar balanço de estoque"
        description={`O estoque de ${items.length} produto(s) será substituído pela contagem física informada. Faltas: ${summary.shortage}. Sobras: ${summary.surplus}. Deseja continuar?`}
        confirmText="Aplicar balanço"
        cancelText="Revisar"
        onConfirm={completeStocktake}
        onCancel={() => setConfirmationOpen(false)}
      />
    </section>
  );
}

function StocktakeSummary({
  label,
  value,
  tone = "neutral",
  signed = false,
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "danger";
  signed?: boolean;
}) {
  const classes = {
    neutral: "border-slate-200 bg-white text-slate-900",
    success: "border-emerald-100 bg-emerald-50 text-emerald-800",
    danger: "border-red-100 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-2xl border p-4 ${classes[tone]}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">
        {signed && value > 0 ? `+${value}` : value}
      </p>
    </div>
  );
}
