import type { Product } from "@/types/domain";

export type ProductFiscalFields = Pick<
  Product,
  "ncm" | "cfop" | "origem_mercadoria" | "csosn" | "unidade_comercial"
>;

export function normalizeFiscalCode(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function validateProductFiscalFields(fields: ProductFiscalFields, required = true) {
  if ((required || fields.ncm) && !/^\d{8}$/.test(fields.ncm || "")) return "O NCM deve ter 8 dígitos";
  if ((required || fields.cfop) && !/^\d{4}$/.test(fields.cfop || "")) return "O CFOP deve ter 4 dígitos";
  if ((required || fields.origem_mercadoria) && !/^\d$/.test(fields.origem_mercadoria || "")) return "Selecione a origem da mercadoria";
  if ((required || fields.csosn) && !/^\d{2,3}$/.test(fields.csosn || "")) return "O CSOSN/CST deve ter 2 ou 3 dígitos";
  if ((required || fields.unidade_comercial) && !/^[A-Z]{1,6}$/.test(fields.unidade_comercial || "")) return "Informe uma unidade comercial válida";
  return null;
}

export function isProductFiscalReady(product: ProductFiscalFields) {
  return validateProductFiscalFields(product) === null;
}
