import type { FiscalProductProfile, NfceBuildInput } from "@/lib/nfce/types";

export interface FiscalValidationError {
  field: string;
  message: string;
  productId?: number;
  productName?: string;
}

export function validateFiscalProduct(
  profile: FiscalProductProfile,
  taxRegime: "1" | "2" | "3",
) {
  const missing: string[] = [];
  if (!/^\d{8}$/.test(profile.ncm || "")) missing.push("NCM");
  if (!/^\d{4}$/.test(profile.cfop || "")) missing.push("CFOP");
  if (!/^\d$/.test(profile.origin || "")) missing.push("Origem da mercadoria");
  if (!profile.commercialUnit) missing.push("Unidade comercial");
  if (!profile.taxUnit) missing.push("Unidade tributável");
  if (taxRegime === "1") {
    if (!/^\d{3}$/.test(profile.csosn || "")) missing.push("CSOSN");
  } else if (!/^\d{2}$/.test(profile.cstIcms || "")) {
    missing.push("CST ICMS");
  }
  if (!/^\d{2}$/.test(profile.pisCst || "")) missing.push("CST PIS");
  if (!/^\d{2}$/.test(profile.cofinsCst || "")) missing.push("CST COFINS");
  if (!profile.accountantValidated) missing.push("Validação do contador");
  return missing;
}

export function validateNfceInput(
  input: NfceBuildInput,
): FiscalValidationError[] {
  const errors: FiscalValidationError[] = [];
  if (!/^\d{14}$/.test(input.issuer.cnpj)) {
    errors.push({ field: "cnpj", message: "CNPJ do emitente inválido." });
  }
  if (!/^\d{7}$/.test(input.municipalityCode)) {
    errors.push({
      field: "municipalityCode",
      message: "Código IBGE inválido.",
    });
  }
  if (!input.items.length)
    errors.push({ field: "items", message: "Venda sem itens." });

  input.items.forEach((item) => {
    validateFiscalProduct(item.profile, input.issuer.taxRegime).forEach(
      (field) =>
        errors.push({
          field,
          message: `Produto ${item.description}: ${field} não configurado.`,
          productId: item.productId,
          productName: item.description,
        }),
    );
  });

  const paymentTotal = input.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const itemTotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice - (item.discount || 0),
    0,
  );
  if (Math.abs(paymentTotal - itemTotal - (input.changeAmount || 0)) > 0.01) {
    errors.push({
      field: "payments",
      message: "Pagamentos, total e troco não fecham a venda.",
    });
  }
  return errors;
}
