"use client";

import {
  AlertTriangle,
  Barcode,
  Boxes,
  CalendarClock,
  ClipboardCheck,
  Download,
  History,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  adjustProductStock,
  fetchProductBatches,
  fetchStockMovements,
  fetchStockProducts,
} from "@/services/stock";
import type {
  Product,
  ProductBatch,
  ProductStockMovement,
  ProductStockMovementKind,
} from "@/types/domain";

type StockView = "saldo" | "historico" | "lotes";
type StockFilter = "todos" | "baixo";
type AdjustmentKind = Exclude<
  ProductStockMovementKind,
  "sistema" | "edicao"
>;

const movementLabels: Record<ProductStockMovementKind, string> = {
  entrada: "Entrada",
  saida: "Saída",
  inventario: "Inventário",
  perda: "Perda",
  vencido: "Vencido",
  sistema: "Sistema",
  edicao: "Edição",
};

function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

function daysUntil(date?: string) {
  if (!date) return null;
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${date}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function downloadCsv(movements: ProductStockMovement[]) {
  const lines = [
    ["Data", "Produto", "Tipo", "Variacao", "Anterior", "Atual", "Lote", "Validade", "Motivo"],
    ...movements.map((movement) => [
      formatDateTime(movement.created_at),
      movement.products?.nome || `Produto ${movement.product_id}`,
      movementLabels[movement.movement_kind],
      movement.quantity_delta,
      movement.previous_stock,
      movement.resulting_stock,
      movement.batch_number || "",
      movement.expiration_date || "",
      movement.reason,
    ]),
  ];
  const csv = lines
    .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `historico-estoque-${todayIso()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<ProductStockMovement[]>([]);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [view, setView] = useState<StockView>("saldo");
  const [stockFilter, setStockFilter] = useState<StockFilter>("todos");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  async function loadData() {
    setLoading(true);
    const [productsResponse, movementsResponse, batchesResponse] =
      await Promise.all([
        fetchStockProducts(),
        fetchStockMovements(),
        fetchProductBatches(),
      ]);

    const error =
      productsResponse.error || movementsResponse.error || batchesResponse.error;
    if (error) {
      console.error(error);
      toast.error("Não foi possível carregar o estoque");
    }

    setProducts((productsResponse.data || []) as Product[]);
    setMovements((movementsResponse.data || []) as ProductStockMovement[]);
    setBatches((batchesResponse.data || []) as ProductBatch[]);
    setLoading(false);
  }

  useMountEffect(() => {
    loadData();
  });

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus =
        stockFilter === "todos" || product.estoque <= product.estoque_minimo;

      return (
        product.ativo &&
        matchesStatus &&
        (!term ||
          product.nome.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term) ||
          product.barcode?.toLowerCase().includes(term) ||
          product.categoria?.toLowerCase().includes(term))
      );
    });
  }, [products, search, stockFilter]);

  const filteredMovements = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movements.filter(
      (movement) =>
        !term ||
        movement.products?.nome.toLowerCase().includes(term) ||
        movement.products?.sku?.toLowerCase().includes(term) ||
        movement.products?.barcode?.toLowerCase().includes(term) ||
        movement.reason.toLowerCase().includes(term) ||
        movement.batch_number?.toLowerCase().includes(term),
    );
  }, [movements, search]);

  const filteredBatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return batches.filter(
      (batch) =>
        !term ||
        batch.products?.nome.toLowerCase().includes(term) ||
        batch.batch_number.toLowerCase().includes(term) ||
        batch.products?.barcode?.toLowerCase().includes(term),
    );
  }, [batches, search]);

  const lowStock = products.filter(
    (product) => product.ativo && product.estoque <= product.estoque_minimo,
  );
  const expiringBatches = batches.filter((batch) => {
    const days = daysUntil(batch.expiration_date);
    return days !== null && days <= 30;
  });
  const stockValue = products.reduce(
    (total, product) => total + product.estoque * Number(product.preco_custo || 0),
    0,
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50 pb-20 md:pb-0">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Controle de estoque</h2>
              <p className="text-sm text-slate-500">
                Inventário físico, ajustes, movimentações, lotes e validade.
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric icon={Boxes} label="Itens ativos" value={products.filter((p) => p.ativo).length} />
            <Metric icon={AlertTriangle} label="Estoque baixo" value={lowStock.length} warning={lowStock.length > 0} />
            <Metric icon={CalendarClock} label="Lotes até 30 dias" value={expiringBatches.length} warning={expiringBatches.length > 0} />
            <Metric icon={PackageSearch} label="Valor em estoque" value={stockValue} currency />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por produto, SKU, lote ou ler código de barras"
                className="w-full rounded-xl border py-3 pr-10 pl-10 text-sm"
                autoComplete="off"
              />
              <Barcode className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400" size={19} />
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {([
                ["saldo", "Saldos"],
                ["historico", "Histórico"],
                ["lotes", "Lotes"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setView(id)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
                    view === id ? "bg-[#8A0EEA] text-white" : "text-slate-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {view === "saldo" && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStockFilter("todos")}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  stockFilter === "todos"
                    ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Todos ({products.filter((product) => product.ativo).length})
              </button>
              <button
                type="button"
                onClick={() => setStockFilter("baixo")}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  stockFilter === "baixo"
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                Estoque baixo ({lowStock.length})
              </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">Carregando estoque...</div>
          ) : view === "saldo" ? (
            <StockBalances products={filteredProducts} onAdjust={setAdjusting} />
          ) : view === "historico" ? (
            <StockHistory movements={filteredMovements} onExport={() => downloadCsv(filteredMovements)} />
          ) : (
            <BatchList batches={filteredBatches} />
          )}
        </div>
      </main>

      {adjusting && (
        <AdjustmentDialog
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={async () => {
            setAdjusting(null);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, warning, currency }: { icon: typeof Boxes; label: string; value: number; warning?: boolean; currency?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${warning ? "border-amber-200" : ""}`}>
      <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm"><Icon size={17} />{label}</div>
      <p className={`mt-2 text-xl font-bold sm:text-2xl ${warning ? "text-amber-700" : ""}`}>
        {currency ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value) : value}
      </p>
    </div>
  );
}

function StockBalances({ products, onAdjust }: { products: Product[]; onAdjust: (product: Product) => void }) {
  if (products.length === 0) return <Empty text="Nenhum produto encontrado." />;
  return (
    <section className="overflow-hidden rounded-2xl border bg-white">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50 text-sm"><tr><th className="p-4 text-left">Produto</th><th className="p-4 text-left">Código</th><th className="p-4 text-right">Atual</th><th className="p-4 text-right">Mínimo</th><th className="p-4 text-left">Situação</th><th className="p-4 text-right">Ação</th></tr></thead>
          <tbody>{products.map((product) => <ProductRow key={product.id} product={product} onAdjust={onAdjust} />)}</tbody>
        </table>
      </div>
      <div className="divide-y md:hidden">
        {products.map((product) => {
          const low = product.estoque <= product.estoque_minimo;
          return <div key={product.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{product.nome}</p><p className="text-xs text-slate-500">{product.barcode || product.sku || "Sem código"}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${low ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{low ? "Baixo" : "Normal"}</span></div><div className="mt-3 flex items-end justify-between"><div><p className="text-xs text-slate-500">Estoque atual</p><p className="text-2xl font-bold">{product.estoque}</p><p className="text-xs text-slate-500">Mínimo: {product.estoque_minimo}</p></div><button type="button" onClick={() => onAdjust(product)} className="inline-flex items-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2 text-sm font-semibold text-white"><ClipboardCheck size={16} />Contar / ajustar</button></div></div>;
        })}
      </div>
    </section>
  );
}

function ProductRow({ product, onAdjust }: { product: Product; onAdjust: (product: Product) => void }) {
  const low = product.estoque <= product.estoque_minimo;
  return <tr className="border-t"><td className="p-4"><p className="font-semibold">{product.nome}</p><p className="text-xs text-slate-500">{product.categoria || "Sem categoria"}</p></td><td className="p-4 text-sm">{product.barcode || product.sku || "-"}</td><td className="p-4 text-right text-lg font-bold">{product.estoque}</td><td className="p-4 text-right">{product.estoque_minimo}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${low ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{low ? "Estoque baixo" : "Normal"}</span></td><td className="p-4 text-right"><button type="button" onClick={() => onAdjust(product)} className="rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50">Contar / ajustar</button></td></tr>;
}

function StockHistory({ movements, onExport }: { movements: ProductStockMovement[]; onExport: () => void }) {
  return <section className="overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b p-4"><div><h3 className="font-bold">Histórico de movimentações</h3><p className="text-xs text-slate-500">Inclui ajustes e alterações automáticas de saldo.</p></div><button type="button" onClick={onExport} disabled={movements.length === 0} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-40"><Download size={16} />CSV</button></div>{movements.length === 0 ? <Empty text="Nenhuma movimentação encontrada." /> : <><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px]"><thead className="bg-slate-50 text-sm"><tr><th className="p-4 text-left">Data</th><th className="p-4 text-left">Produto</th><th className="p-4 text-left">Tipo</th><th className="p-4 text-right">Variação</th><th className="p-4 text-right">Saldo</th><th className="p-4 text-left">Lote</th><th className="p-4 text-left">Motivo</th></tr></thead><tbody>{movements.map((movement) => <MovementRow key={movement.id} movement={movement} />)}</tbody></table></div><div className="divide-y md:hidden">{movements.map((movement) => <MovementCard key={movement.id} movement={movement} />)}</div></>}</section>;
}

function MovementRow({ movement }: { movement: ProductStockMovement }) {
  return <tr className="border-t text-sm"><td className="p-4 whitespace-nowrap">{formatDateTime(movement.created_at)}</td><td className="p-4 font-semibold">{movement.products?.nome || `Produto ${movement.product_id}`}</td><td className="p-4">{movementLabels[movement.movement_kind]}</td><td className={`p-4 text-right font-bold ${movement.quantity_delta > 0 ? "text-emerald-600" : "text-red-600"}`}>{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta}</td><td className="p-4 text-right">{movement.previous_stock} → {movement.resulting_stock}</td><td className="p-4">{movement.batch_number || "-"}</td><td className="max-w-[260px] p-4">{movement.reason}</td></tr>;
}

function MovementCard({ movement }: { movement: ProductStockMovement }) {
  return <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{movement.products?.nome || `Produto ${movement.product_id}`}</p><p className="text-xs text-slate-500">{formatDateTime(movement.created_at)} · {movementLabels[movement.movement_kind]}</p></div><strong className={movement.quantity_delta > 0 ? "text-emerald-600" : "text-red-600"}>{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta}</strong></div><p className="mt-2 text-sm">{movement.reason}</p><div className="mt-2 flex gap-3 text-xs text-slate-500"><span>Saldo: {movement.previous_stock} → {movement.resulting_stock}</span>{movement.batch_number && <span>Lote: {movement.batch_number}</span>}</div></div>;
}

function BatchList({ batches }: { batches: ProductBatch[] }) {
  if (batches.length === 0) return <Empty text="Nenhum lote ativo cadastrado." />;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{batches.map((batch) => { const days = daysUntil(batch.expiration_date); const urgent = days !== null && days <= 30; return <div key={batch.id} className={`rounded-2xl border bg-white p-4 ${urgent ? "border-amber-300" : ""}`}><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{batch.products?.nome || `Produto ${batch.product_id}`}</p><p className="text-sm text-slate-500">Lote {batch.batch_number}</p></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-sm font-bold">{batch.quantity} un.</span></div><div className="mt-4 flex items-center gap-2 text-sm"><CalendarClock size={16} className={urgent ? "text-amber-600" : "text-slate-400"} />{batch.expiration_date ? <span className={urgent ? "font-semibold text-amber-700" : ""}>{new Date(`${batch.expiration_date}T00:00:00`).toLocaleDateString("pt-BR")}{days !== null && ` · ${days < 0 ? `${Math.abs(days)} dia(s) vencido` : `${days} dia(s)`}`}</span> : <span className="text-slate-500">Sem validade informada</span>}</div></div>; })}</div>;
}

function AdjustmentDialog({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => Promise<void> }) {
  const [mode, setMode] = useState<"contagem" | "movimento">("contagem");
  const [countedStock, setCountedStock] = useState(String(product.estoque));
  const [kind, setKind] = useState<AdjustmentKind>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [batch, setBatch] = useState("");
  const [expiration, setExpiration] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const delta = mode === "contagem" ? Number(countedStock) - product.estoque : (kind === "entrada" ? 1 : -1) * Number(quantity);
    if (!Number.isInteger(delta) || delta === 0) return toast.error("Informe uma quantidade diferente do saldo atual");
    if (!reason.trim()) return toast.error("Informe o motivo do ajuste");
    setSaving(true);
    const { error } = await adjustProductStock({ productId: product.id, quantityDelta: delta, kind: mode === "contagem" ? "inventario" : kind, reason: reason.trim(), batchNumber: batch.trim() || undefined, expirationDate: expiration || undefined });
    setSaving(false);
    if (error) { console.error(error); toast.error(error.message || "Erro ao ajustar estoque"); return; }
    toast.success("Estoque atualizado e registrado no histórico");
    await onSaved();
  }

  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold">Ajustar estoque</h3><p className="text-sm text-slate-500">{product.nome} · saldo atual {product.estoque}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100" aria-label="Fechar"><X size={20} /></button></div><div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setMode("contagem")} className={`rounded-lg py-2 text-sm font-semibold ${mode === "contagem" ? "bg-white shadow-sm" : ""}`}>Inventário físico</button><button type="button" onClick={() => setMode("movimento")} className={`rounded-lg py-2 text-sm font-semibold ${mode === "movimento" ? "bg-white shadow-sm" : ""}`}>Entrada / saída</button></div><div className="mt-5 grid gap-4">{mode === "contagem" ? <label className="grid gap-1 text-sm font-medium">Quantidade contada<input type="number" min="0" step="1" value={countedStock} onChange={(event) => setCountedStock(event.target.value)} className="rounded-xl border p-3 text-lg font-bold" /></label> : <div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-sm font-medium">Tipo<select value={kind} onChange={(event) => setKind(event.target.value as AdjustmentKind)} className="rounded-xl border p-3"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="perda">Perda</option><option value="vencido">Vencido</option></select></label><label className="grid gap-1 text-sm font-medium">Quantidade<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="rounded-xl border p-3" /></label></div>}<label className="grid gap-1 text-sm font-medium">Motivo obrigatório<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex.: contagem mensal, avaria ou entrada da nota 123" className="min-h-20 rounded-xl border p-3" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Lote (opcional)<input value={batch} onChange={(event) => setBatch(event.target.value)} className="rounded-xl border p-3" /></label><label className="grid gap-1 text-sm font-medium">Validade (opcional)<input type="date" value={expiration} onChange={(event) => setExpiration(event.target.value)} className="rounded-xl border p-3" /></label></div><div className="rounded-xl bg-purple-50 p-3 text-sm text-purple-800">Novo saldo: <strong>{mode === "contagem" ? Number(countedStock || 0) : product.estoque + (kind === "entrada" ? 1 : -1) * Number(quantity || 0)}</strong></div><button type="button" onClick={submit} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-5 py-3 font-semibold text-white disabled:opacity-50"><Plus size={18} />{saving ? "Salvando..." : "Registrar ajuste"}</button></div></div></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border bg-white p-8 text-center text-slate-500"><History className="mx-auto mb-3" size={28} /><p>{text}</p></div>;
}
