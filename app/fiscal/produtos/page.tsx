"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { useMountEffect } from "@/hooks/useMountEffect";
import { fiscalApi } from "@/services/fiscal-module";

interface FiscalProfileRow extends Record<
  string,
  string | number | boolean | null | undefined
> {
  ncm?: string;
  cfop?: string;
  csosn?: string;
  cst_icms?: string;
  tax_status?: "complete" | "incomplete" | "review";
}

interface FiscalProductRow {
  id: number;
  nome: string;
  sku?: string;
  barcode?: string;
  ncm?: string;
  cfop?: string;
  origem_mercadoria?: string;
  csosn?: string;
  unidade_comercial?: string;
  fiscal_product_profiles?: FiscalProfileRow[];
}

interface FiscalProductsResponse {
  products: FiscalProductRow[];
}

const fields = [
  ["gtin", "GTIN / código de barras"],
  ["ncm", "NCM"],
  ["cest", "CEST"],
  ["cfop", "CFOP"],
  ["cst_icms", "CST ICMS"],
  ["csosn", "CSOSN"],
  ["origin", "Origem"],
  ["commercial_unit", "Unidade comercial"],
  ["tax_unit", "Unidade tributável"],
  ["icms_rate", "Alíquota ICMS"],
  ["icms_base_mode", "Base ICMS"],
  ["icms_base_reduction", "Redução base ICMS"],
  ["pis_cst", "CST PIS"],
  ["pis_rate", "Alíquota PIS"],
  ["cofins_cst", "CST COFINS"],
  ["cofins_rate", "Alíquota COFINS"],
  ["ipi_cst", "CST IPI"],
  ["ipi_rate", "Alíquota IPI"],
  ["fiscal_benefit_code", "Benefício fiscal"],
  ["anp_code", "Código ANP"],
] as const;

export default function FiscalProductsPage() {
  const [products, setProducts] = useState<FiscalProductRow[]>([]);
  const [selected, setSelected] = useState<FiscalProductRow | null>(null);
  const [form, setForm] = useState<FiscalProfileRow>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  async function load() {
    const result = await fiscalApi<FiscalProductsResponse>(
      "/api/fiscal/products",
    );
    setProducts(result.products || []);
  }
  useMountEffect(() => {
    void load().catch((error) => toast.error(error.message));
  });
  const visible = useMemo(
    () =>
      products.filter((product) => {
        const profile = product.fiscal_product_profiles?.[0];
        const haystack =
          `${product.nome} ${product.sku || ""} ${product.barcode || ""} ${profile?.ncm || product.ncm || ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
        if (filter === "complete") return profile?.tax_status === "complete";
        if (filter === "incomplete")
          return !profile || profile.tax_status === "incomplete";
        if (filter === "no_ncm") return !(profile?.ncm || product.ncm);
        if (filter === "no_cfop") return !(profile?.cfop || product.cfop);
        if (filter === "no_tax") return !profile?.csosn && !profile?.cst_icms;
        return true;
      }),
    [products, search, filter],
  );
  function edit(product: FiscalProductRow) {
    const profile = product.fiscal_product_profiles?.[0] || {};
    setSelected(product);
    setForm({
      ...profile,
      product_id: product.id,
      gtin: profile.gtin || product.barcode || "",
      ncm: profile.ncm || product.ncm || "",
      cfop: profile.cfop || product.cfop || "",
      origin: profile.origin || product.origem_mercadoria || "",
      csosn: profile.csosn || product.csosn || "",
      commercial_unit:
        profile.commercial_unit || product.unidade_comercial || "UN",
      tax_unit: profile.tax_unit || product.unidade_comercial || "UN",
    });
  }
  async function save() {
    await fiscalApi("/api/fiscal/products", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    toast.success("Cadastro fiscal salvo para revisão.");
    setSelected(null);
    await load();
  }
  return (
    <FiscalShell
      title="Produtos fiscais"
      description="Complete e revise a tributação por produto"
    >
      <div className="rounded-2xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, SKU, código de barras ou NCM"
            className="rounded-xl border px-3 py-2"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="all">Todos</option>
            <option value="complete">Completos</option>
            <option value="incomplete">Incompletos</option>
            <option value="no_ncm">Sem NCM</option>
            <option value="no_cfop">Sem CFOP</option>
            <option value="no_tax">Sem tributação</option>
          </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Produto</th>
                <th>SKU/GTIN</th>
                <th>NCM</th>
                <th>CFOP</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((product) => {
                const profile = product.fiscal_product_profiles?.[0];
                return (
                  <tr key={product.id} className="border-b">
                    <td className="p-3 font-semibold">{product.nome}</td>
                    <td>{product.sku || product.barcode || "—"}</td>
                    <td>{profile?.ncm || product.ncm || "—"}</td>
                    <td>{profile?.cfop || product.cfop || "—"}</td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${profile?.tax_status === "complete" ? "bg-emerald-100 text-emerald-700" : profile?.tax_status === "review" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700"}`}
                      >
                        {profile?.tax_status === "complete"
                          ? "Fiscal completo"
                          : profile?.tax_status === "review"
                            ? "Precisa revisão"
                            : "Fiscal incompleto"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => edit(product)}
                        className="rounded-lg bg-purple-600 px-3 py-2 font-semibold text-white"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Fiscal — {selected.nome}</h2>
            <p className="mt-1 text-sm text-amber-700">
              Valores são editáveis e precisam de confirmação do contador.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {fields.map(([key, label]) => (
                <label key={key} className="text-sm font-semibold">
                  {label}
                  <input
                    value={String(form[key] ?? "")}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"
                  />
                </label>
              ))}
            </div>
            <label className="mt-3 block text-sm font-semibold">
              Informações adicionais
              <textarea
                value={String(form.additional_info || "")}
                onChange={(e) =>
                  setForm({ ...form, additional_info: e.target.value })
                }
                className="mt-1 w-full rounded-lg border p-3"
              />
            </label>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">
                Situação fiscal
                <select
                  value={form.tax_status || "incomplete"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tax_status: e.target.value as
                        | "complete"
                        | "incomplete"
                        | "review",
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-2"
                >
                  <option value="incomplete">Fiscal incompleto</option>
                  <option value="review">Precisa revisão</option>
                  <option value="complete">Fiscal completo</option>
                </select>
              </label>
              <label className="flex items-center gap-2 self-end rounded-lg border p-3">
                <input
                  type="checkbox"
                  checked={form.accountant_validated === true}
                  onChange={(e) =>
                    setForm({ ...form, accountant_validated: e.target.checked })
                  }
                />{" "}
                Confirmado pelo contador
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="rounded-xl bg-purple-600 px-4 py-2 font-bold text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </FiscalShell>
  );
}
