"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { Product, Supplier } from "@/types/domain";

interface PurchaseLine {
  id: number;
  productId: string;
  quantity: string;
  unitCost: string;
}

export interface PurchaseInput {
  supplierId: number;
  documentNumber: string;
  purchaseDate: string;
  notes: string;
  items: Array<{
    product_id: number;
    quantidade: number;
    custo_unitario: number;
  }>;
}

export function PurchaseModal({
  products,
  suppliers,
  onSave,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: PurchaseInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([
    { id: 1, productId: "", quantity: "1", unitCost: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + Number(line.quantity || 0) * Number(line.unitCost || 0),
        0,
      ),
    [lines],
  );

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
        productId: "",
        quantity: "1",
        unitCost: "",
      },
    ]);
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

    setSaving(true);

    try {
      await onSave({
        supplierId: Number(supplierId),
        documentNumber,
        purchaseDate,
        notes,
        items: parsedItems,
      });
      setOpen(false);
      setSupplierId("");
      setDocumentNumber("");
      setNotes("");
      setLines([{ id: 1, productId: "", quantity: "1", unitCost: "" }]);
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
            <h2 className="mb-5 text-xl font-bold">Entrada de produtos</h2>
            <div className="grid gap-4 sm:grid-cols-3">
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

            <div className="mt-5 space-y-3">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[minmax(0,1fr)_120px_160px_40px]"
                >
                  <select
                    value={line.productId}
                    onChange={(event) =>
                      updateLine(line.id, "productId", event.target.value)
                    }
                    className="rounded-xl border p-3"
                  >
                    <option value="">Produto</option>
                    {products
                      .filter((product) => product.ativo)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} · {formatProductName(product)}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.id, "quantity", event.target.value)
                    }
                    aria-label="Quantidade"
                    className="rounded-xl border p-3"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(event) =>
                      updateLine(line.id, "unitCost", event.target.value)
                    }
                    placeholder="Custo unitário"
                    className="rounded-xl border p-3"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((item) => item.id !== line.id),
                      )
                    }
                    disabled={lines.length === 1}
                    aria-label="Remover item"
                    className="flex items-center justify-center rounded-xl border text-red-600 disabled:opacity-30"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-[#8A0EEA]"
            >
              <Plus size={17} />
              Adicionar item
            </button>

            <label className="mt-5 grid gap-2 text-sm font-medium">
              Observações
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="resize-none rounded-xl border p-3 font-normal"
              />
            </label>

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
