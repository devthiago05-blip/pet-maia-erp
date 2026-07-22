"use client";

import { Download, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { normalizeProductName } from "@/lib/formatters";
import type { NewProductInput, Product, ProductCategory } from "@/types/domain";

interface ProductCsvImportModalProps {
  categories: ProductCategory[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
}

interface ImportedProductRow {
  rowNumber: number;
  nome: string;
  categoria: string;
  codigo: string;
  tamanho: string;
  cor: string;
  sabor: string;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
}

const csvHeaders = [
  "nome",
  "categoria",
  "codigo",
  "tamanho",
  "cor",
  "sabor",
  "preco_custo",
  "preco_venda",
  "estoque",
  "estoque_minimo",
];

const csvExampleRows = [
  [
    "Coleira nylon",
    "Acessorios",
    "",
    "P",
    "Vermelha",
    "",
    "10,00",
    "24,90",
    "5",
    "1",
  ],
  [
    "Petisco arroz",
    "Alimentos",
    "",
    "",
    "",
    "Frango",
    "4,00",
    "9,90",
    "12",
    "2",
  ],
];

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function parseNumber(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized || 0);
}

function parseCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === delimiter && !insideQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function generateImportCode(rowNumber: number) {
  return `PM${Date.now().toString().slice(-7)}${String(rowNumber).padStart(3, "0")}`;
}

function buildTemplateCsv() {
  return [csvHeaders, ...csvExampleRows]
    .map((row) => row.map((value) => `"${value}"`).join(";"))
    .join("\n");
}

export function ProductCsvImportModal({
  categories,
  onSave,
}: ProductCsvImportModalProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportedProductRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryByName = useMemo(() => {
    const map = new Map<string, ProductCategory>();

    categories.forEach((category) => {
      map.set(category.nome.trim().toLowerCase(), category);
    });

    return map;
  }, [categories]);

  const invalidCategoryRows = rows.filter(
    (row) => !categoryByName.get(row.categoria.trim().toLowerCase()),
  );

  function reset() {
    setRows([]);
    setFileName("");
  }

  function downloadTemplate() {
    const blob = new Blob([buildTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "modelo-produtos-pdv.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(content: string) {
    const lines = content
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      toast.error("O CSV precisa ter cabecalho e ao menos uma linha");
      return;
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
    const requiredHeaders = ["nome", "categoria", "preco_venda"];
    const missingHeaders = requiredHeaders.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      toast.error(
        `Colunas obrigatorias ausentes: ${missingHeaders.join(", ")}`,
      );
      return;
    }

    const parsedRows = lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line, delimiter);
      const data = new Map<string, string>();

      headers.forEach((header, headerIndex) => {
        data.set(header, values[headerIndex] || "");
      });

      return {
        rowNumber: index + 2,
        nome: data.get("nome") || "",
        categoria: data.get("categoria") || "",
        codigo: data.get("codigo") || "",
        tamanho: data.get("tamanho") || "",
        cor: data.get("cor") || "",
        sabor: data.get("sabor") || "",
        precoCusto: parseNumber(data.get("preco_custo") || "0"),
        precoVenda: parseNumber(data.get("preco_venda") || "0"),
        estoque: parseNumber(data.get("estoque") || "0"),
        estoqueMinimo: parseNumber(data.get("estoque_minimo") || "0"),
      };
    });

    const invalidRows = parsedRows.filter(
      (row) =>
        !row.nome.trim() ||
        !row.categoria.trim() ||
        !Number.isFinite(row.precoCusto) ||
        !Number.isFinite(row.precoVenda) ||
        !Number.isInteger(row.estoque) ||
        !Number.isInteger(row.estoqueMinimo) ||
        row.precoCusto < 0 ||
        row.precoVenda <= 0 ||
        row.estoque < 0 ||
        row.estoqueMinimo < 0,
    );

    if (invalidRows.length > 0) {
      toast.error(
        `Revise nome, categoria, preco e estoque nas linhas: ${invalidRows
          .map((row) => row.rowNumber)
          .join(", ")}`,
      );
      return;
    }

    setRows(parsedRows);
    toast.success(`${parsedRows.length} produtos carregados para revisao`);
  }

  function handleFile(file?: File) {
    if (!file) {
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => parseCsv(String(reader.result || ""));
    reader.onerror = () => toast.error("Nao foi possivel ler o arquivo");
    reader.readAsText(file, "utf-8");
  }

  async function handleSave() {
    if (rows.length === 0) {
      toast.error("Importe um CSV antes de salvar");
      return;
    }

    if (invalidCategoryRows.length > 0) {
      toast.error("Corrija categorias que nao existem antes de salvar");
      return;
    }

    const products: NewProductInput[] = rows.map((row) => {
      const category = categoryByName.get(row.categoria.trim().toLowerCase());
      const code = row.codigo.trim() || generateImportCode(row.rowNumber);

      return {
        nome: normalizeProductName(row.nome),
        sku: code,
        barcode: code,
        profit_margin:
          row.precoCusto > 0
            ? ((row.precoVenda - row.precoCusto) / row.precoCusto) * 100
            : 0,
        category_id: category?.id,
        categoria: category?.nome || row.categoria.trim(),
        tamanho: row.tamanho.trim() || undefined,
        cor: row.cor.trim() || undefined,
        sabor: row.sabor.trim() || undefined,
        preco_custo: row.precoCusto,
        preco_venda: row.precoVenda,
        estoque: row.estoque,
        estoque_minimo: row.estoqueMinimo,
        ativo: true,
      };
    });

    setSaving(true);
    try {
      await onSave(products);
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
        className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold"
      >
        <Upload size={16} />
        Importar CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Importar produtos CSV</h2>
                <p className="text-sm text-slate-500">
                  Use separador ponto e virgula. Categorias precisam existir no
                  PDV.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
              >
                <Download size={16} />
                Baixar modelo
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-dashed p-4">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="w-full rounded-xl border bg-white p-3"
              />
              <p className="mt-2 text-xs text-slate-500">
                Colunas: nome, categoria, codigo, tamanho, cor, sabor,
                preco_custo, preco_venda, estoque, estoque_minimo.
              </p>
              {fileName && (
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Arquivo: {fileName}
                </p>
              )}
            </div>

            {invalidCategoryRows.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Categorias nao encontradas nas linhas:{" "}
                {invalidCategoryRows.map((row) => row.rowNumber).join(", ")}.
              </div>
            )}

            <div className="mt-4 overflow-hidden rounded-xl border">
              <div className="flex items-center justify-between border-b bg-slate-50 p-3">
                <h3 className="font-bold">Previa da importacao</h3>
                <span className="text-sm text-slate-500">
                  {rows.length} linhas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-white">
                    <tr>
                      <th className="p-3 text-left">Linha</th>
                      <th className="p-3 text-left">Produto</th>
                      <th className="p-3 text-left">Categoria</th>
                      <th className="p-3 text-left">Codigo</th>
                      <th className="p-3 text-left">Variacao</th>
                      <th className="p-3 text-right">Compra</th>
                      <th className="p-3 text-right">Venda</th>
                      <th className="p-3 text-right">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-6 text-center text-slate-500"
                        >
                          Nenhum arquivo carregado.
                        </td>
                      </tr>
                    ) : (
                      rows.slice(0, 80).map((row) => (
                        <tr key={row.rowNumber} className="border-t">
                          <td className="p-3">{row.rowNumber}</td>
                          <td className="p-3">{row.nome}</td>
                          <td className="p-3">{row.categoria}</td>
                          <td className="p-3">{row.codigo || "Automatico"}</td>
                          <td className="p-3">
                            {[row.tamanho, row.cor, row.sabor]
                              .filter(Boolean)
                              .join(" / ") || "-"}
                          </td>
                          <td className="p-3 text-right">
                            {row.precoCusto.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            {row.precoVenda.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">{row.estoque}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {rows.length > 80 && (
                <p className="border-t p-3 text-sm text-slate-500">
                  Mostrando as primeiras 80 linhas de {rows.length}.
                </p>
              )}
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
                disabled={
                  saving || rows.length === 0 || invalidCategoryRows.length > 0
                }
                className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-60 sm:flex-1"
              >
                {saving ? "Importando..." : `Importar ${rows.length} produtos`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
