const sensitiveKeys = /password|senha|token|csc|private|card_number|cvv|pin/i;

export function sanitizeFiscalMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeFiscalMetadata);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !sensitiveKeys.test(key))
        .map(([key, entry]) => [key, sanitizeFiscalMetadata(entry)]),
    );
  }
  return value;
}

export function fiscalLog(
  action: string,
  metadata: Record<string, unknown> = {},
) {
  console.info(
    `[NFCE][MOCK][${action.toUpperCase()}]`,
    sanitizeFiscalMetadata(metadata),
  );
}
