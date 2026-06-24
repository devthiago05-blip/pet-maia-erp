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
