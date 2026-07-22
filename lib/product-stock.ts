import type { Product } from "@/types/domain";

type PackStockProduct = Pick<
  Product,
  "estoque" | "nome" | "purchase_unit" | "sale_unit" | "units_per_purchase"
>;

function normalizeUnit(unit: string | undefined, fallback: string) {
  return unit?.trim().toUpperCase() || fallback;
}

function pluralizeUnit(unit: string, quantity: number) {
  if (quantity === 1) return unit;
  const plurals: Record<string, string> = {
    PACK: "PACKS",
    PACOTE: "PACOTES",
    CAIXA: "CAIXAS",
    FARDO: "FARDOS",
    CARTELA: "CARTELAS",
    COMPRIMIDO: "COMPRIMIDOS",
    CÁPSULA: "CÁPSULAS",
    FRASCO: "FRASCOS",
    AMPOLA: "AMPOLAS",
    SACHÊ: "SACHÊS",
    UN: "UN",
  };
  return plurals[unit] || unit;
}

function openContainerLabel(unit: string) {
  const feminine = ["CAIXA", "CARTELA"].includes(unit);
  return `${feminine ? "na" : "no"} ${unit.toLowerCase()} ${feminine ? "aberta" : "aberto"}`;
}

export function getPackStockBreakdown(product: PackStockProduct) {
  const stock = Math.max(0, Number(product.estoque || 0));
  const unitsPerPack = Math.max(1, Number(product.units_per_purchase || 1));
  const purchaseUnit = normalizeUnit(product.purchase_unit, "UN");
  const fiscalSaleUnit = normalizeUnit(product.sale_unit, "UN");
  const saleUnit =
    fiscalSaleUnit === "UN" && /sach[eê]/i.test(product.nome)
      ? "SACHÊ"
      : fiscalSaleUnit;
  const isPack =
    unitsPerPack > 1 &&
    purchaseUnit !== fiscalSaleUnit &&
    ["PACK", "PACOTE", "CAIXA", "FARDO", "FRASCO"].includes(purchaseUnit);

  if (!isPack) return null;

  const packsInStock = stock === 0 ? 0 : Math.ceil(stock / unitsPerPack);
  const fullPacks = Math.floor(stock / unitsPerPack);
  const unitsInOpenPack = stock % unitsPerPack;

  return {
    stock,
    unitsPerPack,
    purchaseUnit,
    saleUnit,
    packsInStock,
    fullPacks,
    unitsInOpenPack,
  };
}

export function formatPackStock(product: PackStockProduct) {
  const breakdown = getPackStockBreakdown(product);
  if (!breakdown) return null;

  const { packsInStock, purchaseUnit, saleUnit, stock, unitsInOpenPack } =
    breakdown;
  const packLabel = pluralizeUnit(purchaseUnit, packsInStock);
  const saleLabel = pluralizeUnit(saleUnit, stock);

  return {
    summary: `${packsInStock} ${packLabel} · ${stock} ${saleLabel}`,
    detail:
      packsInStock > 0 && unitsInOpenPack > 0
        ? `${unitsInOpenPack} ${pluralizeUnit(saleUnit, unitsInOpenPack)} ${openContainerLabel(purchaseUnit)}`
        : `${breakdown.unitsPerPack} ${pluralizeUnit(saleUnit, breakdown.unitsPerPack)} por ${purchaseUnit.toLowerCase()}`,
  };
}

export function formatFractionalSale(product: PackStockProduct) {
  const breakdown = getPackStockBreakdown(product);
  if (!breakdown) {
    const saleUnit = normalizeUnit(product.sale_unit, "UN");
    return {
      name: product.nome,
      stock: `${product.estoque} ${pluralizeUnit(saleUnit, product.estoque)}`,
      unit: saleUnit,
    };
  }

  const replacements: Record<string, string> = {
    PACK: breakdown.saleUnit,
    PACOTE: breakdown.saleUnit,
    CAIXA: breakdown.saleUnit,
    FARDO: breakdown.saleUnit,
    FRASCO: breakdown.saleUnit,
  };
  const purchasePattern = new RegExp(`^${breakdown.purchaseUnit}\\s+`, "i");
  const saleName = purchasePattern.test(product.nome)
    ? product.nome.replace(
        purchasePattern,
        `${replacements[breakdown.purchaseUnit]} `,
      )
    : product.nome;

  return {
    name: saleName,
    stock: `${breakdown.stock} ${pluralizeUnit(breakdown.saleUnit, breakdown.stock)}`,
    unit: breakdown.saleUnit,
  };
}
