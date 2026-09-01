function digits(value: string | number, length: number) {
  return String(value).replace(/\D/g, "").padStart(length, "0").slice(-length);
}

export function calculateAccessKeyDigit(base43: string) {
  if (!/^\d{43}$/.test(base43))
    throw new Error("Base da chave deve ter 43 dígitos.");
  let weight = 2;
  let sum = 0;
  for (let index = base43.length - 1; index >= 0; index -= 1) {
    sum += Number(base43[index]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  return remainder === 0 || remainder === 1 ? 0 : 11 - remainder;
}

export function generateNfceAccessKey(input: {
  ufCode: string;
  issuedAt: Date;
  cnpj: string;
  series: number;
  number: number;
  emissionType?: number;
  numericCode?: string;
}) {
  const year = String(input.issuedAt.getFullYear()).slice(-2);
  const month = String(input.issuedAt.getMonth() + 1).padStart(2, "0");
  const numericCode = digits(
    input.numericCode || `${input.number}${input.series}`,
    8,
  );
  const base = [
    digits(input.ufCode, 2),
    `${year}${month}`,
    digits(input.cnpj, 14),
    "65",
    digits(input.series, 3),
    digits(input.number, 9),
    digits(input.emissionType || 1, 1),
    numericCode,
  ].join("");
  return `${base}${calculateAccessKeyDigit(base)}`;
}
