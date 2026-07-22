import type { Product } from "@/types/domain";

export function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(numericValue);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return date.toLocaleDateString("pt-BR");
}

export function normalizeProductName(value: string | null | undefined) {
  return (value || "").trim().toLocaleUpperCase("pt-BR");
}

export function formatProductName(product: Product) {
  const variation = [product.tamanho, product.cor, product.sabor].filter(
    Boolean,
  );

  return variation.length > 0
    ? `${normalizeProductName(product.nome)} - ${variation.join(" / ")}`
    : normalizeProductName(product.nome);
}
