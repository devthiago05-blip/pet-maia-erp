import type { FinancialEntryType } from "@/types/domain";

export const financialPaymentMethods = [
  "PIX",
  "Dinheiro",
  "Cartao de debito",
  "Cartao de credito",
  "Transferencia",
  "Boleto",
  "Outro",
];

export const financialDescriptionSuggestions: Record<
  FinancialEntryType,
  string[]
> = {
  Receita: [
    "Banho",
    "Tosa",
    "Consulta",
    "Vacina",
    "Venda de produto",
    "Ajuste financeiro",
  ],
  Despesa: [
    "Manutencao de maquinas",
    "Afiacao de lamina",
    "Manutencao predial",
    "Compra de pecas",
    "Compra de insumos",
    "Diaria tosador",
  ],
};
