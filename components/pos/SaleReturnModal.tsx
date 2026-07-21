"use client";

import { RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/formatters";
import type { PosSale } from "@/types/domain";

export function SaleReturnModal({
  sale,
  onSave,
}: {
  sale: PosSale;
  onSave: (input: {
    type: "Devolução" | "Troca";
    reason: string;
    items: Array<{ sale_item_id: number; quantity: number }>;
  }) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Devolução" | "Troca">("Devolução");
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const available = useMemo(
    () =>
      (sale.pos_sale_items || [])
        .map((item) => ({
          ...item,
          remaining:
            item.quantidade -
            (sale.pos_sale_returns || [])
              .flatMap((entry) => entry.pos_sale_return_items || [])
              .filter((returned) => returned.sale_item_id === item.id)
              .reduce((sum, returned) => sum + returned.quantity, 0),
        }))
        .filter((item) => item.remaining > 0),
    [sale],
  );
  const total = available.reduce(
    (sum, item) =>
      sum + (quantities[item.id] || 0) * Number(item.valor_unitario),
    0,
  );

  async function submit() {
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({ sale_item_id: Number(id), quantity }));
    if (!reason.trim() || items.length === 0) {
      toast.warning("Selecione os itens e informe o motivo.");
      return;
    }
    setSaving(true);
    const success = await onSave({ type, reason, items });
    setSaving(false);
    if (success) {
      setOpen(false);
      setReason("");
      setQuantities({});
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={available.length === 0}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1 font-semibold text-amber-700 disabled:text-slate-400"
      >
        <RotateCcw size={16} />
        Trocar/devolver
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Troca ou devolução</h2>
                <p className="text-sm text-slate-500">
                  Venda #{String(sale.id).padStart(6, "0")}
                </p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fechar">
                <X />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {(["Devolução", "Troca"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setType(option)}
                  className={`rounded-xl border p-3 font-semibold ${type === option ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-5 space-y-2">
              {available.map((item) => (
                <label
                  key={item.id}
                  className="grid grid-cols-[1fr_5rem] items-center gap-3 rounded-xl border p-3"
                >
                  <span>
                    <b>{item.descricao}</b>
                    <small className="block text-slate-500">
                      Disponível: {item.remaining} ·{" "}
                      {formatCurrency(item.valor_unitario)}
                    </small>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={item.remaining}
                    value={quantities[item.id] || 0}
                    onChange={(event) =>
                      setQuantities((current) => ({
                        ...current,
                        [item.id]: Math.min(
                          item.remaining,
                          Math.max(0, Number(event.target.value)),
                        ),
                      }))
                    }
                    className="rounded-lg border p-2 text-center"
                  />
                </label>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold">
              Motivo
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border p-3 font-normal"
                placeholder="Ex.: produto incompatível"
              />
            </label>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-sm text-slate-500">
                {type === "Troca"
                  ? "Crédito para a nova venda"
                  : "Valor a devolver"}
              </p>
              <p className="text-xl font-bold">{formatCurrency(total)}</p>
            </div>
            {type === "Devolução" && (
              <p className="mt-2 text-xs text-amber-700">
                A devolução exige caixa aberto e registra a saída
                automaticamente.
              </p>
            )}
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="mt-5 w-full rounded-xl bg-[#8A0EEA] p-3 font-bold text-white disabled:opacity-60"
            >
              {saving ? "Registrando..." : `Confirmar ${type.toLowerCase()}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
