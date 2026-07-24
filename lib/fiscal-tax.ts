import type { ClinicSettings, Product } from "@/types/domain";

export type FiscalReviewLevel = "ready" | "suggestion" | "blocked";

export interface FiscalProductAssessment {
  productId: number;
  productName: string;
  level: FiscalReviewLevel;
  current: {
    ncm: string | null;
    cfop: string | null;
    origem: string | null;
    csosn: string | null;
    unidade: string | null;
  };
  suggestions: Array<{
    field: "ncm" | "cfop" | "csosn";
    value: string;
    reason: string;
    confidence: "alta" | "condicional";
  }>;
  pending: string[];
}

const PET_FOOD_PATTERN =
  /\b(ração|racao|sach[eê]|pat[eê]|petisco|snack|cookie|stick|alimento|dog chow|pedigree)\b/i;

function valid(value: string | null | undefined, pattern: RegExp) {
  return pattern.test(value?.trim() || "");
}

export function assessProductFiscal(
  product: Pick<
    Product,
    | "id"
    | "nome"
    | "categoria"
    | "ncm"
    | "cfop"
    | "origem_mercadoria"
    | "csosn"
    | "unidade_comercial"
  >,
  settings: Pick<ClinicSettings, "regime_tributario" | "uf">,
): FiscalProductAssessment {
  const suggestions: FiscalProductAssessment["suggestions"] = [];
  const pending: string[] = [];
  const descriptor = `${product.nome} ${product.categoria || ""}`;

  if (!valid(product.ncm, /^\d{8}$/)) {
    if (PET_FOOD_PATTERN.test(descriptor) && !/pazinha|coleira|peitoral/i.test(descriptor)) {
      suggestions.push({
        field: "ncm",
        value: "23091000",
        reason:
          "O nome indica alimento para cães ou gatos acondicionado para venda a retalho. Confirmar composição e embalagem.",
        confidence: "alta",
      });
    } else {
      pending.push("NCM precisa ser obtido na NF-e de compra ou confirmado pela contabilidade");
    }
  }

  if (!valid(product.cfop, /^\d{4}$/)) {
    suggestions.push({
      field: "cfop",
      value: "5102",
      reason:
        "Hipótese para venda interna de mercadoria adquirida de terceiros. Não usar se houver fabricação, ST ou operação diferente.",
      confidence: "condicional",
    });
  }

  if (!valid(product.origem_mercadoria, /^\d$/)) {
    pending.push("Origem da mercadoria");
  }

  if (!valid(product.csosn, /^\d{3}$/)) {
    if (settings.regime_tributario === "1") {
      suggestions.push({
        field: "csosn",
        value: "102",
        reason:
          "Hipótese de venda no Simples Nacional sem permissão de crédito. Produtos com substituição tributária podem exigir CSOSN 500.",
        confidence: "condicional",
      });
    } else {
      pending.push("CSOSN/CST depende do regime tributário e da situação do ICMS");
    }
  }

  if (!valid(product.unidade_comercial, /^[A-Z]{1,6}$/)) {
    pending.push("Unidade comercial");
  }

  pending.push("CST de PIS/COFINS e enquadramento CBS/IBS de 2026");
  pending.push("CEST e benefício fiscal, quando aplicáveis");

  const baseReady =
    valid(product.ncm, /^\d{8}$/) &&
    valid(product.cfop, /^\d{4}$/) &&
    valid(product.origem_mercadoria, /^\d$/) &&
    valid(product.csosn, /^\d{3}$/) &&
    valid(product.unidade_comercial, /^[A-Z]{1,6}$/);

  return {
    productId: product.id,
    productName: product.nome,
    level: baseReady ? "ready" : suggestions.length ? "suggestion" : "blocked",
    current: {
      ncm: product.ncm?.trim() || null,
      cfop: product.cfop?.trim() || null,
      origem: product.origem_mercadoria?.trim() || null,
      csosn: product.csosn?.trim() || null,
      unidade: product.unidade_comercial?.trim() || null,
    },
    suggestions,
    pending,
  };
}

export interface TaxCalculationInput {
  quantity: number;
  unitPrice: number;
  discount?: number;
  freight?: number;
  otherExpenses?: number;
  icmsRate?: number;
  pisRate?: number;
  cofinsRate?: number;
  cbsRate?: number;
  ibsStateRate?: number;
  ibsMunicipalRate?: number;
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function percent(base: number, rate = 0) {
  return money((base * rate) / 100);
}

export function calculateItemTaxes(input: TaxCalculationInput) {
  const gross = money(input.quantity * input.unitPrice);
  const taxableBase = money(
    Math.max(
      0,
      gross -
        Math.max(0, input.discount || 0) +
        Math.max(0, input.freight || 0) +
        Math.max(0, input.otherExpenses || 0),
    ),
  );

  return {
    gross,
    taxableBase,
    icms: percent(taxableBase, input.icmsRate),
    pis: percent(taxableBase, input.pisRate),
    cofins: percent(taxableBase, input.cofinsRate),
    cbs: percent(taxableBase, input.cbsRate),
    ibsState: percent(taxableBase, input.ibsStateRate),
    ibsMunicipal: percent(taxableBase, input.ibsMunicipalRate),
  };
}
