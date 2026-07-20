"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { normalizeFiscalCode, validateProductFiscalFields } from "@/lib/product-fiscal";
import type { NewProductInput, Product, ProductCategory } from "@/types/domain";

interface QuickProductModalProps {
  categories: ProductCategory[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
}

interface QuickVariation {
  id: number;
  tamanho: string;
  cor: string;
  sabor: string;
  codigo: string;
  precoVenda: string;
  estoque: string;
}

function createQuickVariation(id = 1): QuickVariation {
  return {
    id,
    tamanho: "",
    cor: "",
    sabor: "",
    codigo: "",
    precoVenda: "",
    estoque: "0",
  };
}

function generateProductCode(index: number) {
  return `PM${Date.now().toString().slice(-7)}${String(index + 1).padStart(2, "0")}`;
}

export function QuickProductModal({
  categories,
  onSave,
}: QuickProductModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [precoCusto, setPrecoCusto] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("0");
  const [ncm, setNcm] = useState("");
  const [cfop, setCfop] = useState("");
  const [origemMercadoria, setOrigemMercadoria] = useState("0");
  const [csosn, setCsosn] = useState("");
  const [unidadeComercial, setUnidadeComercial] = useState("UN");
  const [variations, setVariations] = useState<QuickVariation[]>([
    createQuickVariation(),
  ]);
  const [saving, setSaving] = useState(false);

  function reset() {
    setNome("");
    setCategoryId("");
    setPrecoCusto("");
    setEstoqueMinimo("0");
    setNcm("");
    setCfop("");
    setOrigemMercadoria("0");
    setCsosn("");
    setUnidadeComercial("UN");
    setVariations([createQuickVariation()]);
  }

  function updateVariation(
    id: number,
    field: keyof Omit<QuickVariation, "id">,
    value: string,
  ) {
    setVariations((current) =>
      current.map((variation) =>
        variation.id === id ? { ...variation, [field]: value } : variation,
      ),
    );
  }

  function addVariation() {
    setVariations((current) => [
      ...current,
      createQuickVariation(
        Math.max(...current.map((variation) => variation.id), 0) + 1,
      ),
    ]);
  }

  function removeVariation(id: number) {
    setVariations((current) =>
      current.length === 1
        ? current
        : current.filter((variation) => variation.id !== id),
    );
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

    const fiscalFields = { ncm, cfop, origem_mercadoria: origemMercadoria, csosn, unidade_comercial: unidadeComercial };
    const fiscalError = validateProductFiscalFields(fiscalFields, false);
    const fiscalPending = validateProductFiscalFields(fiscalFields) !== null;
    if (fiscalError) { toast.error(fiscalError); return; }

    const selectedCategory = categories.find(
      (category) => String(category.id) === categoryId,
    );

    const parsedCost = Number(precoCusto || 0);
    const parsedMinimumStock = Number(estoqueMinimo || 0);

    if (
      !Number.isFinite(parsedCost) ||
      !Number.isInteger(parsedMinimumStock) ||
      parsedCost < 0 ||
      parsedMinimumStock < 0
    ) {
      toast.error("Informe valor de compra e estoque minimo validos");
      return;
    }

    const parsedVariations = variations.map((variation, index) => ({
      ...variation,
      codigo: variation.codigo.trim() || generateProductCode(index),
      precoVendaNumber: Number(variation.precoVenda),
      estoqueNumber: Number(variation.estoque || 0),
    }));

    if (
      parsedVariations.some(
        (variation) =>
          !Number.isFinite(variation.precoVendaNumber) ||
          !Number.isInteger(variation.estoqueNumber) ||
          variation.precoVendaNumber <= 0 ||
          variation.estoqueNumber < 0,
      )
    ) {
      toast.error("Informe preco de venda e estoque validos nas linhas");
      return;
    }

    const repeatedCodes = parsedVariations
      .map((variation) => variation.codigo.toLowerCase())
      .filter((code, index, codes) => codes.indexOf(code) !== index);

    if (repeatedCodes.length > 0) {
      toast.error("Existem codigos repetidos nas variacoes");
      return;
    }

    const products: NewProductInput[] = parsedVariations.map((variation) => ({
      nome: nome.trim(),
      sku: variation.codigo,
      barcode: variation.codigo,
      profit_margin:
        parsedCost > 0
          ? ((variation.precoVendaNumber - parsedCost) / parsedCost) * 100
          : 0,
      category_id: Number(categoryId),
      categoria: selectedCategory?.nome,
      tamanho: variation.tamanho.trim() || undefined,
      cor: variation.cor.trim() || undefined,
      sabor: variation.sabor.trim() || undefined,
      preco_custo: parsedCost,
      preco_venda: variation.precoVendaNumber,
      estoque: variation.estoqueNumber,
      estoque_minimo: parsedMinimumStock,
      ncm,
      cfop,
      origem_mercadoria: origemMercadoria,
      csosn,
      unidade_comercial: unidadeComercial,
      ativo: true,
    }));

    setSaving(true);
    try {
      await onSave(products);
      if (fiscalPending) toast.warning("Produto salvo. Complete a tributação antes de emitir NFC-e.");
      reset();
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
        className="rounded-xl border border-[#8A0EEA] px-4 py-2 font-semibold text-[#8A0EEA]"
      >
        Produto rapido
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Produto rapido</h2>
                <p className="text-sm text-slate-500">
                  Preencha o basico e cadastre uma ou varias variacoes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="rounded-xl border px-4 py-2"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <h3 className="font-bold">Dados fiscais para NFC-e</h3>
              <p className="mt-1 text-sm text-slate-500">Use os dados confirmados pela contabilidade.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <QuickInput label="NCM" value={ncm} onChange={(value) => setNcm(normalizeFiscalCode(value, 8))} />
                <QuickInput label="CFOP" value={cfop} onChange={(value) => setCfop(normalizeFiscalCode(value, 4))} />
                <label className="grid gap-2 text-sm font-medium">Origem<select value={origemMercadoria} onChange={(event) => setOrigemMercadoria(event.target.value)} className="rounded-xl border bg-white p-3 font-normal"><option value="0">0 - Nacional</option><option value="1">1 - Importação direta</option><option value="2">2 - Mercado interno</option><option value="3">3 - Nacional, importado &gt; 40%</option><option value="4">4 - Processo básico</option><option value="5">5 - Nacional, importado ≤ 40%</option><option value="6">6 - Importado, sem similar</option><option value="7">7 - Interno, sem similar</option><option value="8">8 - Nacional, importado &gt; 70%</option></select></label>
                <QuickInput label="CSOSN / CST" value={csosn} onChange={(value) => setCsosn(normalizeFiscalCode(value, 3))} />
                <QuickInput label="Unidade" value={unidadeComercial} onChange={(value) => setUnidadeComercial(value.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6))} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <QuickInput
                label="Produto"
                value={nome}
                onChange={setNome}
                placeholder="Ex: Coleira nylon"
              />
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
              <QuickInput
                label="Valor de compra"
                type="number"
                value={precoCusto}
                onChange={setPrecoCusto}
                placeholder="0,00"
              />
              <QuickInput
                label="Estoque minimo"
                type="number"
                integer
                value={estoqueMinimo}
                onChange={setEstoqueMinimo}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold">Variacoes, preco e estoque</h3>
                <p className="text-sm text-slate-500">
                  Deixe tamanho, cor e sabor vazios para produto simples.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariation}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-[#8A0EEA]"
              >
                <Plus size={16} />
                Adicionar linha
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {variations.map((variation, index) => (
                <div
                  key={variation.id}
                  className="grid gap-3 rounded-xl border bg-slate-50 p-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_1fr_0.8fr_auto]"
                >
                  <QuickInput
                    label="Tamanho"
                    value={variation.tamanho}
                    onChange={(value) =>
                      updateVariation(variation.id, "tamanho", value)
                    }
                    placeholder={index === 0 ? "P, M, G..." : undefined}
                  />
                  <QuickInput
                    label="Cor"
                    value={variation.cor}
                    onChange={(value) =>
                      updateVariation(variation.id, "cor", value)
                    }
                  />
                  <QuickInput
                    label="Sabor"
                    value={variation.sabor}
                    onChange={(value) =>
                      updateVariation(variation.id, "sabor", value)
                    }
                  />
                  <QuickInput
                    label="Codigo"
                    value={variation.codigo}
                    onChange={(value) =>
                      updateVariation(variation.id, "codigo", value)
                    }
                    placeholder="Automatico"
                  />
                  <QuickInput
                    label="Venda"
                    type="number"
                    value={variation.precoVenda}
                    onChange={(value) =>
                      updateVariation(variation.id, "precoVenda", value)
                    }
                    placeholder="0,00"
                  />
                  <QuickInput
                    label="Estoque"
                    type="number"
                    integer
                    value={variation.estoque}
                    onChange={(value) =>
                      updateVariation(variation.id, "estoque", value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeVariation(variation.id)}
                    disabled={variations.length === 1}
                    aria-label={`Remover linha ${index + 1}`}
                    className="self-end rounded-xl border p-3 text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                className="rounded-xl border py-3 sm:flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-60 sm:flex-1"
              >
                {saving
                  ? "Salvando..."
                  : `Salvar ${variations.length} ${variations.length === 1 ? "produto" : "variacoes"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuickInput({
  label,
  value,
  type = "text",
  integer = false,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  integer?: boolean;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 rounded-xl border bg-white p-3 font-normal"
      />
    </label>
  );
}
