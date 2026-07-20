"use client";

import { PackagePlus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { PurchaseInput } from "@/components/pos/PurchaseModal";
import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { PosSale, Product, ProductPurchase, Supplier } from "@/types/domain";

interface Suggestion {
  product: Product;
  sold30: number;
  suggested: number;
  supplierId?: number;
  lastCost: number;
}

export function ReplenishmentPanel({ products, sales, purchases, suppliers, onSave }: {
  products: Product[];
  sales: PosSale[];
  purchases: ProductPurchase[];
  suppliers: Supplier[];
  onSave: (purchase: PurchaseInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [costs, setCosts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [referenceTimestamp] = useState(() => Date.now());

  const suggestions = useMemo<Suggestion[]>(() => {
    const since = referenceTimestamp - 30 * 86400000;
    const sold = new Map<number, number>();
    sales.filter((sale) => sale.status !== "Cancelada" && new Date(sale.created_at).getTime() >= since)
      .forEach((sale) => sale.pos_sale_items?.forEach((item) => {
        if (item.product_id) sold.set(item.product_id, (sold.get(item.product_id) || 0) + item.quantidade);
      }));

    return products.filter((product) => product.ativo)
      .map((product) => {
        const sold30 = sold.get(product.id) || 0;
        let supplierId: number | undefined;
        let lastCost = Number(product.preco_custo || 0);
        for (const purchase of purchases) {
          const item = purchase.product_purchase_items?.find((candidate) => candidate.product_id === product.id);
          if (item) { supplierId = purchase.supplier_id; lastCost = Number(item.custo_unitario); break; }
        }
        const safetyTarget = Math.max(product.estoque_minimo, Math.ceil(sold30 * 1.2));
        return { product, sold30, suggested: Math.max(1, safetyTarget - product.estoque), supplierId, lastCost };
      })
      .filter((item) =>
        item.product.estoque <= item.product.estoque_minimo &&
        (item.product.estoque_minimo > 0 || item.sold30 > 0),
      )
      .sort((a, b) => (a.product.estoque - a.product.estoque_minimo) - (b.product.estoque - b.product.estoque_minimo));
  }, [products, purchases, referenceTimestamp, sales]);

  function startPurchase() {
    if (suggestions.length === 0) return;
    const firstSupplier = suggestions.find((item) => item.supplierId)?.supplierId;
    setSupplierId(firstSupplier ? String(firstSupplier) : "");
    setSelected(Object.fromEntries(suggestions.map((item) => [item.product.id, !firstSupplier || item.supplierId === firstSupplier])));
    setQuantities(Object.fromEntries(suggestions.map((item) => [item.product.id, String(item.suggested)])));
    setCosts(Object.fromEntries(suggestions.map((item) => [item.product.id, String(item.lastCost)])));
    setOpen(true);
  }

  async function submit() {
    const chosen = suggestions.filter((item) => selected[item.product.id]);
    if (!supplierId || chosen.length === 0) { toast.error("Selecione fornecedor e produtos"); return; }
    const items = chosen.map((item) => ({ product_id: item.product.id, quantidade: Number(quantities[item.product.id]), custo_unitario: Number(costs[item.product.id]) }));
    if (items.some((item) => !Number.isInteger(item.quantidade) || item.quantidade <= 0 || !Number.isFinite(item.custo_unitario) || item.custo_unitario < 0)) { toast.error("Confira quantidades e custos"); return; }
    const today = new Date().toLocaleDateString("en-CA");
    setSaving(true);
    try {
      await onSave({ supplierId: Number(supplierId), documentNumber: "", purchaseDate: today, dueDate: today, paymentMethod: "Boleto", notes: "Reposição sugerida pelo giro de 30 dias e estoque mínimo", items });
      setOpen(false);
    } finally { setSaving(false); }
  }

  return <>
    <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 font-bold text-slate-900"><Sparkles size={19} className="text-[#8A0EEA]" /> Reposição inteligente</h2><p className="mt-1 text-sm text-slate-500">Considera estoque mínimo, vendas dos últimos 30 dias e último fornecedor.</p></div>
        <button type="button" onClick={startPurchase} disabled={suggestions.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-3 font-semibold text-white disabled:bg-slate-300"><PackagePlus size={18} />Preparar reposição ({suggestions.length})</button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {suggestions.slice(0, 4).map((item) => <div key={item.product.id} className="rounded-xl border bg-white p-3"><p className="font-semibold">{formatProductName(item.product)}</p><div className="mt-2 grid grid-cols-2 gap-1 text-sm"><span className="text-slate-500">Estoque</span><strong className="text-right text-red-600">{item.product.estoque}</strong><span className="text-slate-500">Vendas 30d</span><strong className="text-right">{item.sold30}</strong><span className="text-slate-500">Sugestão</span><strong className="text-right text-[#8A0EEA]">+{item.suggested}</strong></div></div>)}
        {suggestions.length === 0 && <p className="text-sm text-emerald-700">Nenhum produto abaixo do estoque mínimo.</p>}
      </div>
    </section>

    {open && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6"><h2 className="text-xl font-bold">Registrar reposição sugerida</h2><p className="text-sm text-slate-500">Marque apenas os produtos deste fornecedor. Ao salvar, o estoque será atualizado como recebido.</p>
      <label className="mt-4 grid gap-2 text-sm font-medium sm:max-w-sm">Fornecedor<select value={supplierId} onChange={(event) => { const value=event.target.value; setSupplierId(value); setSelected(Object.fromEntries(suggestions.map((item) => [item.product.id, !item.supplierId || String(item.supplierId)===value]))); }} className="rounded-xl border p-3 font-normal"><option value="">Selecione</option>{suppliers.filter((supplier) => supplier.ativo).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.nome}</option>)}</select></label>
      <div className="mt-4 space-y-3">{suggestions.map((item) => <div key={item.product.id} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[auto_1fr_110px_140px]"><input type="checkbox" checked={Boolean(selected[item.product.id])} onChange={(event) => setSelected((current) => ({...current,[item.product.id]:event.target.checked}))} className="size-5 self-center accent-[#8A0EEA]" /><div><p className="font-semibold">{formatProductName(item.product)}</p><p className="text-xs text-slate-500">Estoque {item.product.estoque} · vendeu {item.sold30} · último custo {formatCurrency(item.lastCost)}</p></div><label className="grid gap-1 text-xs text-slate-500">Quantidade<input type="number" min="1" value={quantities[item.product.id] || ""} onChange={(event) => setQuantities((current) => ({...current,[item.product.id]:event.target.value}))} className="rounded-lg border p-2 text-slate-900" /></label><label className="grid gap-1 text-xs text-slate-500">Custo unitário<input type="number" min="0" step="0.01" value={costs[item.product.id] || ""} onChange={(event) => setCosts((current) => ({...current,[item.product.id]:event.target.value}))} className="rounded-lg border p-2 text-slate-900" /></label></div>)}</div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border py-3">Cancelar</button><button type="button" onClick={() => void submit()} disabled={saving} className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-60">{saving ? "Registrando..." : "Confirmar recebimento"}</button></div>
    </div></div>}
  </>;
}
