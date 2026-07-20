"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { PosQuote, Product, Tutor } from "@/types/domain";

export interface QuoteUpdateInput {
  quoteId: number;
  tutorId: number | null;
  customerName: string;
  expirationDate: string | null;
  items: Array<{ product_id: number; quantidade: number; valor_unitario: number }>;
}

interface EditableItem {
  key: string;
  productId: string;
  quantity: string;
  price: string;
}

export function QuoteEditModal({ quote, products, tutors, onSave }: {
  quote: PosQuote;
  products: Product[];
  tutors: Tutor[];
  onSave: (input: QuoteUpdateInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tutorId, setTutorId] = useState(String(quote.tutor_id || ""));
  const [customerName, setCustomerName] = useState(quote.cliente_nome || "");
  const [expirationDate, setExpirationDate] = useState(quote.validade || "");
  const [items, setItems] = useState<EditableItem[]>(() =>
    (quote.pos_quote_items || []).map((item) => ({
      key: String(item.id),
      productId: String(item.product_id || ""),
      quantity: String(item.quantidade),
      price: String(item.valor_unitario),
    })),
  );

  const total = useMemo(() => items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0,
  ), [items]);

  function updateItem(key: string, field: keyof Omit<EditableItem, "key">, value: string) {
    setItems((current) => current.map((item) => {
      if (item.key !== key) return item;
      if (field === "productId") {
        const product = products.find((candidate) => String(candidate.id) === value);
        return { ...item, productId: value, price: product ? String(product.preco_venda) : item.price };
      }
      return { ...item, [field]: value };
    }));
  }

  async function handleSave() {
    const normalizedItems = items.map((item) => ({
      product_id: Number(item.productId),
      quantidade: Number(item.quantity),
      valor_unitario: Number(item.price),
    }));
    if (normalizedItems.length === 0 || normalizedItems.some((item) =>
      !Number.isInteger(item.product_id) || item.product_id <= 0 ||
      !Number.isInteger(item.quantidade) || item.quantidade <= 0 ||
      !Number.isFinite(item.valor_unitario) || item.valor_unitario < 0
    )) {
      toast.error("Confira os produtos, quantidades e valores");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        quoteId: quote.id,
        tutorId: tutorId ? Number(tutorId) : null,
        customerName: tutorId ? "" : customerName.trim() || "Consumidor",
        expirationDate: expirationDate || null,
        items: normalizedItems,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="font-semibold text-blue-600">Editar</button>
      {open && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
        <div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-bold">Editar orçamento #{String(quote.id).padStart(6, "0")}</h2><p className="text-sm text-slate-500">O total é recalculado automaticamente.</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-xl border p-2"><X size={19} /></button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">Tutor<select value={tutorId} onChange={(event) => setTutorId(event.target.value)} className="rounded-xl border p-3 font-normal"><option value="">Consumidor / avulso</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.nome}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-medium">Nome avulso<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} disabled={Boolean(tutorId)} className="rounded-xl border p-3 font-normal disabled:bg-slate-100" /></label>
            <label className="grid gap-2 text-sm font-medium">Validade<input type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} className="rounded-xl border p-3 font-normal" /></label>
          </div>

          <div className="mt-6 space-y-3">
            {items.map((item) => <div key={item.key} className="grid gap-3 rounded-xl border bg-slate-50 p-3 sm:grid-cols-[1fr_110px_140px_auto]">
              <label className="grid gap-1 text-xs font-medium text-slate-500">Produto<select value={item.productId} onChange={(event) => updateItem(item.key, "productId", event.target.value)} className="rounded-lg border bg-white p-3 text-sm text-slate-900"><option value="">Selecione</option>{products.filter((product) => product.ativo).map((product) => <option key={product.id} value={product.id}>{formatProductName(product)}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-medium text-slate-500">Quantidade<input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(item.key, "quantity", event.target.value)} className="rounded-lg border p-3 text-sm text-slate-900" /></label>
              <label className="grid gap-1 text-xs font-medium text-slate-500">Valor unitário<input type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateItem(item.key, "price", event.target.value)} className="rounded-lg border p-3 text-sm text-slate-900" /></label>
              <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.key !== item.key))} aria-label="Remover produto" className="self-end rounded-lg border p-3 text-red-600"><Trash2 size={18} /></button>
            </div>)}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setItems((current) => [...current, { key: `new-${Date.now()}`, productId: "", quantity: "1", price: "" }])} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold text-[#8A0EEA]"><Plus size={17} />Adicionar produto</button>
            <p className="text-lg font-bold">Total: <span className="text-[#8A0EEA]">{formatCurrency(total)}</span></p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border py-3">Cancelar</button><button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-60">{saving ? "Salvando..." : "Salvar alterações"}</button></div>
        </div>
      </div>}
    </>
  );
}
