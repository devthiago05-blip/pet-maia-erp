const legacyPlaceholderPhones = new Set(["85999999999", "5585999999999"]);

export function normalizeTutorPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";

  if (digits.length === 13 && digits.startsWith("55")) {
    return digits.slice(2);
  }

  return digits;
}

export function isLegacyPlaceholderPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";
  return legacyPlaceholderPhones.has(digits);
}

export function isTutorWithoutPhone(phone?: string | null) {
  return !normalizeTutorPhone(phone) || isLegacyPlaceholderPhone(phone);
}

export function formatTutorPhoneInput(phone: string) {
  const digits = normalizeTutorPhone(phone).slice(0, 11);

  return digits
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function tutorPhonesMatch(
  firstPhone?: string | null,
  secondPhone?: string | null,
) {
  const first = normalizeTutorPhone(firstPhone);
  const second = normalizeTutorPhone(secondPhone);

  return Boolean(
    first &&
    second &&
    !isLegacyPlaceholderPhone(firstPhone) &&
    !isLegacyPlaceholderPhone(secondPhone) &&
    first === second,
  );
}
