"use client";

import {
  Barcode,
  ClipboardCheck,
  FilePenLine,
  History,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatProductName } from "@/lib/formatters";
import type {
  Product,
  ProductStocktake,
  ProductStocktakeDraft,
} from "@/types/domain";

interface StocktakeItem {
  product: Product;
  countedQuantity: string;
}

interface StocktakeViewProps {
  products: Product[];
  stocktakes: ProductStocktake[];
  draft: ProductStocktakeDraft | null;
  processing: boolean;
  onComplete: (input: {
    items: Array<{ product_id: number; counted_quantity: number }>;
    notes: string;
  }) => Promise<boolean>;
  onSaveDraft: (input: {
    items: Array<{ product_id: number; counted_quantity: number | null }>;
    notes: string;
  }) => Promise<boolean>;
  onDeleteDraft: () => Promise<boolean>;
}

function restoreDraftItems(
  draft: ProductStocktakeDraft | null,
  products: Product[],
): StocktakeItem[] {
  if (!draft) {
    return [];
  }

  return draft.items.flatMap((draftItem) => {
    const product = products.find((item) => item.id === draftItem.product_id);
    if (!product || !product.ativo) {
      return [];
    }

    return [
      {
        product,
        countedQuantity:
          draftItem.counted_quantity === null
            ? ""
            : String(draftItem.counted_quantity),
      },
    ];
  });
}

export function StocktakeView({
  products,
  stocktakes,
  draft,
  processing,
  onComplete,
  onSaveDraft,
  onDeleteDraft,
}: StocktakeViewProps) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StocktakeItem[]>(() =>
    restoreDraftItems(draft, products),
  );
  const [notes, setNotes] = useState(draft?.notes || "");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [discardConfirmationOpen, setDiscardConfirmationOpen] = useState(false);
  const [selectedStocktake, setSelectedStocktake] =
    useState<ProductStocktake | null>(null);

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

  async function saveDraft() {
    if (items.length === 0) {
      toast.error("Adicione ao menos um produto ao rascunho");
      return;
    }

    await onSaveDraft({
      items: items.map((item) => ({
        product_id: item.product.id,
        counted_quantity:
          item.countedQuantity === "" ? null : Number(item.countedQuantity),
      })),
      notes,
    });
  }

  async function discardDraft() {
    setDiscardConfirmationOpen(false);
    const deleted = await onDeleteDraft();
    if (deleted) {
      setItems([]);
      setNotes("");
      setSearch("");
    }
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

        {draft && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <span>
              <strong>Rascunho recuperado.</strong> Último salvamento em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(draft.updated_at))}.
            </span>
            <button
              type="button"
              onClick={() => setDiscardConfirmationOpen(true)}
              disabled={processing}
              className="shrink-0 font-bold text-red-700 hover:underline disabled:opacity-50"
            >
              Descartar rascunho
            </button>
          </div>
        )}

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
          <>
          <div className="divide-y md:hidden">
            {items.map((item) => {
              const hasCount = item.countedQuantity !== "";
              const difference = hasCount
                ? Number(item.countedQuantity) - item.product.estoque
                : null;

              return (
                <article key={item.product.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-bold text-slate-900">
                        {formatProductName(item.product)}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.product.barcode || item.product.sku || "Sem código"}
                      </p>
                    </div>
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
                      className="rounded-lg bg-red-50 p-2 text-red-600"
                      aria-label={`Remover ${item.product.nome} do balanço`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_1.2fr] items-end gap-3 rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="text-xs text-slate-500">Estoque atual</p>
                      <p className="text-2xl font-bold">{item.product.estoque}</p>
                    </div>
                    <label className="grid gap-1 text-xs font-semibold text-slate-600">
                      Contagem física
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
                        className="w-full rounded-lg border bg-white px-3 py-2 text-center text-lg font-bold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-500">Diferença encontrada</span>
                    <span
                      className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 font-bold ${
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
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hidden w-full overflow-x-auto md:block">
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
          </>
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
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={processing || items.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-200 px-5 py-3 font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FilePenLine size={20} />
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={requestCompletion}
            disabled={processing || items.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClipboardCheck size={20} />
            {processing ? "Processando..." : "Finalizar balanço"}
          </button>
        </div>
      </div>

      <StocktakeHistory
        stocktakes={stocktakes}
        selected={selectedStocktake}
        onSelect={setSelectedStocktake}
      />

      <ConfirmationDialog
        isOpen={confirmationOpen}
        title="Finalizar balanço de estoque"
        description={`O estoque de ${items.length} produto(s) será substituído pela contagem física informada. Faltas: ${summary.shortage}. Sobras: ${summary.surplus}. Deseja continuar?`}
        confirmText="Aplicar balanço"
        cancelText="Revisar"
        onConfirm={completeStocktake}
        onCancel={() => setConfirmationOpen(false)}
      />

      <ConfirmationDialog
        isOpen={discardConfirmationOpen}
        title="Descartar rascunho"
        description="A contagem salva será apagada. Nenhuma quantidade do estoque será alterada. Deseja continuar?"
        confirmText="Descartar"
        cancelText="Manter rascunho"
        onConfirm={discardDraft}
        onCancel={() => setDiscardConfirmationOpen(false)}
      />
    </section>
  );
}

function StocktakeHistory({
  stocktakes,
  selected,
  onSelect,
}: {
  stocktakes: ProductStocktake[];
  selected: ProductStocktake | null;
  onSelect: (stocktake: ProductStocktake | null) => void;
}) {
  function printStocktake(stocktake: ProductStocktake) {
    onSelect(stocktake);
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
            <History size={22} />
          </div>
          <div>
            <h2 className="font-bold">Histórico de balanços</h2>
            <p className="text-sm text-slate-500">
              Últimos 50 balanços finalizados.
            </p>
          </div>
        </div>

        {stocktakes.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
            Nenhum balanço registrado ainda. O próximo aparecerá aqui.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {stocktakes.map((stocktake) => (
              <article
                key={stocktake.id}
                className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  <HistoryField label="Balanço" value={`#${stocktake.id}`} />
                  <HistoryField
                    label="Data"
                    value={new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(stocktake.created_at))}
                  />
                  <HistoryField
                    label="Responsável"
                    value={stocktake.user_profiles?.nome || "Usuário"}
                  />
                  <HistoryField
                    label="Produtos"
                    value={String(stocktake.product_count)}
                  />
                  <HistoryField
                    label="Diferença"
                    value={
                      stocktake.total_difference > 0
                        ? `+${stocktake.total_difference}`
                        : String(stocktake.total_difference)
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(stocktake)}
                  className="rounded-lg border px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50"
                >
                  Ver detalhes
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4 print:static print:block print:bg-white print:p-0">
          <section className="document-print-area max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6 print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:p-8 print:shadow-none">
            <header className="flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
                  Clínica Veterinária Pet Maia
                </p>
                <h1 className="mt-1 text-2xl font-black">
                  Balanço de estoque #{selected.id}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(selected.created_at))}
                  {" · "}
                  {selected.user_profiles?.nome || "Usuário"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 print:hidden"
                aria-label="Fechar detalhes do balanço"
              >
                <X size={20} />
              </button>
            </header>

            <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StocktakeSummary label="Produtos" value={selected.product_count} />
              <StocktakeSummary label="Alterados" value={selected.changed_count} />
              <StocktakeSummary label="Sem alteração" value={selected.unchanged_count} />
              <StocktakeSummary
                label="Diferença líquida"
                value={selected.total_difference}
                tone={selected.total_difference < 0 ? "danger" : "success"}
                signed
              />
            </div>

            {selected.notes && (
              <p className="mb-5 rounded-xl bg-slate-50 p-3 text-sm">
                <strong>Observação:</strong> {selected.notes}
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[660px] border-collapse text-sm print:min-w-0 print:text-xs">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="border p-2">Produto</th>
                    <th className="border p-2">Código</th>
                    <th className="border p-2 text-center">Anterior</th>
                    <th className="border p-2 text-center">Contado</th>
                    <th className="border p-2 text-center">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {(selected.product_stocktake_items || []).map((item) => (
                    <tr key={item.id}>
                      <td className="border p-2 font-medium">{item.product_name}</td>
                      <td className="border p-2">{item.product_code || "-"}</td>
                      <td className="border p-2 text-center">{item.previous_quantity}</td>
                      <td className="border p-2 text-center">{item.counted_quantity}</td>
                      <td className="border p-2 text-center font-bold">
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="rounded-xl border px-4 py-2 font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => printStocktake(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 font-bold text-white"
              >
                <Printer size={18} /> Imprimir relatório
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function HistoryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 font-semibold text-slate-800">{value}</p>
    </div>
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
