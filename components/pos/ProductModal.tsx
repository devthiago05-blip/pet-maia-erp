"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewProductInput, Product } from "@/types/domain";

interface ProductModalProps {
  product?: Product;
  onSave: (product: NewProductInput | Product) => Promise<void>;
}

export function ProductModal({ product, onSave }: ProductModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(product?.nome || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [categoria, setCategoria] = useState(product?.categoria || "");
  const [precoCusto, setPrecoCusto] = useState(
    String(product?.preco_custo || ""),
  );
  const [precoVenda, setPrecoVenda] = useState(
    String(product?.preco_venda || ""),
  );
  const [estoque, setEstoque] = useState(String(product?.estoque ?? 0));
  const [estoqueMinimo, setEstoqueMinimo] = useState(
    String(product?.estoque_minimo ?? 0),
  );
  const [ativo, setAtivo] = useState(product?.ativo ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const values = {
      preco_custo: Number(precoCusto),
      preco_venda: Number(precoVenda),
      estoque: Number(estoque),
      estoque_minimo: Number(estoqueMinimo),
    };

    if (!nome.trim() || !Number.isFinite(values.preco_venda)) {
      toast.error("Informe nome e preço de venda");
      return;
    }

    if (
      Object.values(values).some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      toast.error("Informe preços e estoques válidos");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...(product ? { id: product.id } : {}),
        nome: nome.trim(),
        sku: sku.trim() || undefined,
        categoria: categoria.trim() || undefined,
        ...values,
        ativo,
      } as NewProductInput | Product);
      setOpen(false);
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
        className={
          product
            ? "text-blue-600"
            : "rounded-xl bg-[#8A0EEA] px-4 py-2 text-white"
        }
      >
        {product ? "Editar" : "Novo produto"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="mb-5 text-xl font-bold">
              {product ? "Editar produto" : "Novo produto"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ProductInput label="Nome" value={nome} onChange={setNome} />
              <ProductInput
                label="SKU / Código"
                value={sku}
                onChange={setSku}
              />
              <ProductInput
                label="Categoria"
                value={categoria}
                onChange={setCategoria}
              />
              <ProductInput
                label="Preço de custo"
                type="number"
                value={precoCusto}
                onChange={setPrecoCusto}
              />
              <ProductInput
                label="Preço de venda"
                type="number"
                value={precoVenda}
                onChange={setPrecoVenda}
              />
              <ProductInput
                label="Estoque atual"
                type="number"
                value={estoque}
                onChange={setEstoque}
              />
              <ProductInput
                label="Estoque mínimo"
                type="number"
                value={estoqueMinimo}
                onChange={setEstoqueMinimo}
              />
              <label className="flex items-center gap-3 self-end rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                />
                Produto ativo
              </label>
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
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
