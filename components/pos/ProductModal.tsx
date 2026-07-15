"use client";

import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/formatters";
import type { NewProductInput, Product, ProductCategory } from "@/types/domain";

interface ProductModalProps {
  product?: Product;
  categories: ProductCategory[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
}

interface ProductVariationForm {
  id: number;
  tamanho: string;
  cor: string;
  sabor: string;
  barcode: string;
  precoCusto: string;
  margem: string;
  precoVenda: string;
  estoque: string;
  estoqueMinimo: string;
}

function createVariation(product?: Product): ProductVariationForm {
  const costPrice = Number(product?.preco_custo || 0);
  const salePrice = Number(product?.preco_venda || 0);
  const margin =
    product?.profit_margin !== undefined
      ? Number(product.profit_margin)
      : calculateMargin(costPrice, salePrice);

  return {
    id: 1,
    tamanho: product?.tamanho || "",
    cor: product?.cor || "",
    sabor: product?.sabor || "",
    barcode: product?.barcode || product?.sku || "",
    precoCusto: String(product?.preco_custo || ""),
    margem: costPrice > 0 && salePrice > 0 ? formatDecimal(margin) : "",
    precoVenda: String(product?.preco_venda || ""),
    estoque: String(product?.estoque ?? 0),
    estoqueMinimo: String(product?.estoque_minimo ?? 0),
  };
}

function createProductForm(product?: Product) {
  return {
    nome: product?.nome || "",
    categoryId: String(product?.category_id || ""),
    variations: [createVariation(product)],
    ativo: product?.ativo ?? true,
  };
}

function formatDecimal(value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return value.toFixed(2);
}

function calculateSalePrice(costPrice: number, margin: number) {
  return costPrice + costPrice * (margin / 100);
}

function calculateMargin(costPrice: number, salePrice: number) {
  if (costPrice <= 0) {
    return 0;
  }

  return ((salePrice - costPrice) / costPrice) * 100;
}

export function ProductModal({
  product,
  categories,
  onSave,
}: ProductModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(() => createProductForm(product).nome);
  const [categoryId, setCategoryId] = useState(
    () => createProductForm(product).categoryId,
  );
  const [variations, setVariations] = useState<ProductVariationForm[]>(
    () => createProductForm(product).variations,
  );
  const [ativo, setAtivo] = useState(() => createProductForm(product).ativo);
  const [saving, setSaving] = useState(false);

  const loadForm = useCallback((nextProduct?: Product) => {
    const nextForm = createProductForm(nextProduct);

    setNome(nextForm.nome);
    setCategoryId(nextForm.categoryId);
    setVariations(nextForm.variations);
    setAtivo(nextForm.ativo);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      loadForm(product);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadForm, open, product]);

  function handleClose() {
    loadForm(product);
    setOpen(false);
  }

  function updateVariation(
    id: number,
    field: keyof Omit<ProductVariationForm, "id">,
    value: string,
  ) {
    setVariations((current) =>
      current.map((variation) => {
        if (variation.id !== id) {
          return variation;
        }

        const next = { ...variation, [field]: value };

        const costPrice = Number(
          field === "precoCusto" ? value : next.precoCusto,
        );

        if (field === "margem") {
          const margin = Number(value);

          if (Number.isFinite(costPrice) && Number.isFinite(margin)) {
            next.precoVenda = formatDecimal(
              calculateSalePrice(costPrice, margin),
            );
          }
        }

        if (field === "precoCusto") {
          const margin = Number(next.margem);
          const salePrice = Number(next.precoVenda);

          if (Number.isFinite(costPrice) && Number.isFinite(margin)) {
            next.precoVenda = formatDecimal(
              calculateSalePrice(costPrice, margin),
            );
          } else if (Number.isFinite(costPrice) && Number.isFinite(salePrice)) {
            next.margem = formatDecimal(calculateMargin(costPrice, salePrice));
          }
        }

        if (field === "precoVenda") {
          const salePrice = Number(value);

          if (Number.isFinite(costPrice) && Number.isFinite(salePrice)) {
            next.margem = formatDecimal(calculateMargin(costPrice, salePrice));
          }
        }

        return next;
      }),
    );
  }

  function addVariation() {
    setVariations((current) => [
      ...current,
      {
        ...createVariation(),
        id: Math.max(...current.map((variation) => variation.id), 0) + 1,
      },
    ]);
  }

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }

    if (!categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    const parsedVariations = variations.map((variation) => ({
      ...variation,
      barcodeValue: variation.barcode.trim(),
      precoCustoNumber: Number(variation.precoCusto),
      margemNumber: Number(variation.margem || 0),
      precoVendaNumber: Number(variation.precoVenda),
      estoqueNumber: Number(variation.estoque),
      estoqueMinimoNumber: Number(variation.estoqueMinimo),
    }));

    if (
      parsedVariations.some(
        (variation) =>
          !Number.isFinite(variation.precoCustoNumber) ||
          !Number.isFinite(variation.precoVendaNumber) ||
          !Number.isInteger(variation.estoqueNumber) ||
          !Number.isInteger(variation.estoqueMinimoNumber) ||
          variation.precoCustoNumber < 0 ||
          variation.precoVendaNumber < 0 ||
          variation.estoqueNumber < 0 ||
          variation.estoqueMinimoNumber < 0,
      )
    ) {
      toast.error("Informe preços e estoques válidos em todas as variações");
      return;
    }

    const signatures = parsedVariations.map((variation) =>
      [variation.tamanho, variation.cor, variation.sabor]
        .map((value) => value.trim().toLowerCase())
        .join("|"),
    );

    if (new Set(signatures).size !== signatures.length) {
      toast.error("Existem variações repetidas");
      return;
    }

    const selectedCategory = categories.find(
      (category) => String(category.id) === categoryId,
    );

    const products = parsedVariations.map(
      (variation): NewProductInput | Product => ({
        ...(product ? { id: product.id } : {}),
        nome: nome.trim(),
        sku: variation.barcodeValue || product?.sku,
        barcode: variation.barcodeValue || product?.barcode || product?.sku,
        profit_margin: variation.margemNumber,
        category_id: Number(categoryId),
        categoria: selectedCategory?.nome,
        tamanho: variation.tamanho.trim() || undefined,
        cor: variation.cor.trim() || undefined,
        sabor: variation.sabor.trim() || undefined,
        preco_custo: variation.precoCustoNumber,
        preco_venda: variation.precoVendaNumber,
        estoque: variation.estoqueNumber,
        estoque_minimo: variation.estoqueMinimoNumber,
        ativo,
      }),
    );

    setSaving(true);
    try {
      await onSave(products);
      loadForm();
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
        onClick={() => {
          loadForm(product);
          setOpen(true);
        }}
        className={
          product
            ? "text-blue-600"
            : "rounded-xl bg-[#8A0EEA] px-4 py-2 text-white"
        }
      >
        {product ? "Editar" : "Novo produto"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">
              {product ? "Editar produto" : "Novo produto"}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ProductInput label="Nome" value={nome} onChange={setNome} />
              <label className="grid gap-2 text-sm font-medium">
                Categoria
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option value="">Selecione</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 self-end rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                />
                Produto ativo
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold">Variações e estoque</h3>
                <p className="text-sm text-slate-500">
                  Deixe tamanho, cor e sabor vazios para um produto simples.
                </p>
              </div>
              {!product && (
                <button
                  type="button"
                  onClick={addVariation}
                  className="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-[#8A0EEA]"
                >
                  <Plus size={17} />
                  Adicionar variação
                </button>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {variations.map((variation, index) => (
                <div
                  key={variation.id}
                  className="rounded-xl border bg-slate-50 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {product ? "Produto" : `Variação ${index + 1}`}
                    </span>
                    {!product && variations.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setVariations((current) =>
                            current.filter((item) => item.id !== variation.id),
                          )
                        }
                        aria-label={`Remover variação ${index + 1}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ProductInput
                      label="Tamanho"
                      value={variation.tamanho}
                      onChange={(value) =>
                        updateVariation(variation.id, "tamanho", value)
                      }
                    />
                    <ProductInput
                      label="Cor"
                      value={variation.cor}
                      onChange={(value) =>
                        updateVariation(variation.id, "cor", value)
                      }
                    />
                    <ProductInput
                      label="Sabor"
                      value={variation.sabor}
                      onChange={(value) =>
                        updateVariation(variation.id, "sabor", value)
                      }
                    />
                    <ProductInput
                      label="Código de barras"
                      value={variation.barcode}
                      onChange={(value) =>
                        updateVariation(variation.id, "barcode", value)
                      }
                    />
                    <ProductInput
                      label="Valor de compra"
                      type="number"
                      value={variation.precoCusto}
                      onChange={(value) =>
                        updateVariation(variation.id, "precoCusto", value)
                      }
                    />

                    <ProductInput
                      label="Margem %"
                      type="number"
                      value={variation.margem}
                      onChange={(value) =>
                        updateVariation(variation.id, "margem", value)
                      }
                    />

                    <ProductInput
                      label="Valor de venda"
                      type="number"
                      value={variation.precoVenda}
                      onChange={(value) =>
                        updateVariation(variation.id, "precoVenda", value)
                      }
                    />
                    <ProductInput
                      label="Estoque atual"
                      type="number"
                      integer
                      value={variation.estoque}
                      onChange={(value) =>
                        updateVariation(variation.id, "estoque", value)
                      }
                    />
                    <ProductInput
                      label="Estoque mínimo"
                      type="number"
                      integer
                      value={variation.estoqueMinimo}
                      onChange={(value) =>
                        updateVariation(variation.id, "estoqueMinimo", value)
                      }
                    />
                  </div>
                  <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
                    <span className="font-semibold">Lucro por unidade:</span>{" "}
                    {formatCurrency(
                      Math.max(
                        0,
                        Number(variation.precoVenda || 0) -
                          Number(variation.precoCusto || 0),
                      ),
                    )}{" "}
                    <span className="text-slate-400">
                      | Margem: {variation.margem || "0"}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
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
                {saving
                  ? "Salvando..."
                  : product
                    ? "Salvar"
                    : `Salvar ${variations.length} ${variations.length === 1 ? "produto" : "variações"}`}
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
  integer = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  integer?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? (integer ? "1" : "0.01") : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded-xl border bg-white p-3 font-normal"
      />
    </label>
  );
}
