import { MessageCircle } from "lucide-react";

import { isTutorWithoutPhone } from "@/lib/tutor-phone";
import { createTutorWhatsAppUrl } from "@/lib/whatsapp";

interface WhatsAppPhoneLinkProps {
  phone?: string | null;
  tutorName?: string;
  className?: string;
  compact?: boolean;
}

export function WhatsAppPhoneLink({
  phone,
  tutorName,
  className = "",
  compact = false,
}: WhatsAppPhoneLinkProps) {
  const normalizedPhone = phone?.trim();
  const whatsappUrl = createTutorWhatsAppUrl(normalizedPhone, tutorName);

  if (isTutorWithoutPhone(normalizedPhone)) {
    return <span className={className}>Sem número</span>;
  }

  if (!whatsappUrl) {
    return <span className={className}>{normalizedPhone}</span>;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir conversa no WhatsApp"
      aria-label={`Abrir conversa com ${tutorName || normalizedPhone} no WhatsApp`}
      className={`inline-flex max-w-full items-center gap-1.5 font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition hover:text-emerald-900 ${className}`}
    >
      <MessageCircle size={compact ? 14 : 16} className="shrink-0" />
      <span className={compact ? "truncate" : "break-words"}>
        {normalizedPhone}
      </span>
    </a>
  );
}
