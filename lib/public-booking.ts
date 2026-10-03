export function digitsOnly(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

export function normalizeDdd(value?: string | null) {
  const digits = digitsOnly(value);

  return /^\d{2}$/.test(digits) ? digits : "";
}

export function normalizeLastNinePhone(value?: string | null) {
  const digits = digitsOnly(value);

  if (/^9\d{8}$/.test(digits)) {
    return digits;
  }

  return "";
}

export function getBrazilianPhoneParts(value?: string | null) {
  let digits = digitsOnly(value);

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  const lastNine =
    digits.length >= 9 && digits.slice(-9).startsWith("9")
      ? digits.slice(-9)
      : "";
  const ddd = digits.length >= 11 ? digits.slice(-11, -9) : "";

  return { ddd, lastNine };
}

export function formatBrazilianMobilePhone(ddd: string, lastNine: string) {
  return `(${ddd}) ${lastNine.slice(0, 5)}-${lastNine.slice(5)}`;
}

export function phoneMatchesPublicBookingInput(
  storedPhone: string | null | undefined,
  lastNine: string,
  ddd?: string,
) {
  const phoneParts = getBrazilianPhoneParts(storedPhone);

  if (phoneParts.lastNine !== lastNine) {
    return false;
  }

  return !ddd || phoneParts.ddd === ddd;
}

