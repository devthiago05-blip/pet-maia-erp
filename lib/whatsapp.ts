export function normalizeBrazilianWhatsAppPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith("55")
  ) {
    return digits;
  }

  return "";
}

export function createTutorWhatsAppUrl(
  phone?: string | null,
  tutorName?: string,
) {
  const normalizedPhone = normalizeBrazilianWhatsAppPhone(phone);

  if (!normalizedPhone) {
    return "";
  }

  const firstName = tutorName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${firstName}!` : "Olá!";
  const message = `${greeting} Aqui é da Pet Maia. Como podemos ajudar?`;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
