function normalizePixText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

function emv(id: string, value: string) {
  const length = new TextEncoder().encode(value).length;
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string) {
  const bytes = new TextEncoder().encode(value);
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createPixPayload({
  key,
  name,
  city,
  amount,
  transactionId,
}: {
  key: string;
  name: string;
  city: string;
  amount: number;
  transactionId: string;
}) {
  const normalizedKey = key.trim();
  const normalizedName = normalizePixText(name, 25);
  const normalizedCity = normalizePixText(city, 15);
  const normalizedTransactionId =
    normalizePixText(transactionId, 25).replace(/\s/g, "") || "***";

  if (!normalizedKey || !normalizedName || !normalizedCity) {
    throw new Error("Dados PIX incompletos.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor PIX inválido.");
  }

  const merchantAccount = emv(
    "26",
    `${emv("00", "BR.GOV.BCB.PIX")}${emv("01", normalizedKey)}`,
  );
  const additionalData = emv("62", emv("05", normalizedTransactionId));
  const payloadWithoutCrc = [
    emv("00", "01"),
    merchantAccount,
    emv("52", "0000"),
    emv("53", "986"),
    emv("54", amount.toFixed(2)),
    emv("58", "BR"),
    emv("59", normalizedName),
    emv("60", normalizedCity),
    additionalData,
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}
