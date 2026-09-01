export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatXmlDecimal(value: number, decimals = 2) {
  return value.toFixed(decimals);
}

export function calculateNfceTotals(
  items: Array<{ quantity: number; unitPrice: number; discount?: number }>,
) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const discount = roundMoney(
    items.reduce((sum, item) => sum + Math.max(0, item.discount || 0), 0),
  );
  return {
    subtotal,
    discount,
    total: roundMoney(Math.max(0, subtotal - discount)),
  };
}
