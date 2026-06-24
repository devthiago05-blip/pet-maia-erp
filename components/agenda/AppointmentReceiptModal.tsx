"use client";

import { Check, Copy, MessageCircle, Share2, X } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency } from "@/lib/formatters";
import { createPixPayload } from "@/lib/pix";
import type { Appointment, ClinicSettings } from "@/types/domain";

interface AppointmentReceiptModalProps {
  appointment: Appointment;
  clinicSettings: ClinicSettings | null;
  formaPagamento: string;
  valor: number;
  onClose: () => void;
}

export function AppointmentReceiptModal({
  appointment,
  clinicSettings,
  formaPagamento,
  valor,
  onClose,
}: AppointmentReceiptModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  const petName = appointment.pets?.nome || "Pet";
  const tutorName = appointment.pets?.tutors?.nome || "Tutor";
  const tutorPhone = appointment.pets?.tutors?.telefone || "";
  const canGeneratePix =
    formaPagamento === "PIX" &&
    Boolean(
      clinicSettings?.pix_key &&
      clinicSettings.pix_recipient_name &&
      clinicSettings.pix_city,
    );

  const pixResult = useMemo(() => {
    if (!canGeneratePix || !clinicSettings) {
      return { code: "", error: "" };
    }

    try {
      return {
        code: createPixPayload({
          key: clinicSettings.pix_key || "",
          name: clinicSettings.pix_recipient_name || "",
          city: clinicSettings.pix_city || "",
          amount: valor,
          transactionId: `PET${appointment.id}`,
        }),
        error: "",
      };
    } catch (error) {
      return {
        code: "",
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o PIX.",
      };
    }
  }, [appointment.id, canGeneratePix, clinicSettings, valor]);
  const pixCode = pixResult.code;

  useEffect(() => {
    if (!pixCode) {
      return;
    }

    let active = true;

    QRCode.toDataURL(pixCode, { margin: 1, width: 280 })
      .then((url) => {
        if (active) {
          setQrCodeUrl(url);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Não foi possível gerar o QR Code PIX");
      });

    return () => {
      active = false;
    };
  }, [pixCode]);

  const receiptMessage = [
    `Olá, ${tutorName}!`,
    `O atendimento de ${petName} foi concluído.`,
    `Serviços: ${appointment.servico}.`,
    `Valor: ${formatCurrency(valor)}.`,
    `Forma de pagamento: ${formaPagamento}.`,
    pixCode ? "O código PIX será enviado em uma mensagem separada." : "",
    `Obrigado! ${clinicSettings?.nome || "PET MAIA ERP"}`,
  ]
    .filter(Boolean)
    .join("\n");

  async function handleCopyPix() {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const digits = tutorPhone.replace(/\D/g, "");
    const phone = digits.startsWith("55") ? digits : `55${digits}`;

    if (digits.length < 10) {
      toast.error("O tutor não possui um telefone válido");
      return;
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(receiptMessage)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(receiptMessage);
    setMessageCopied(true);
    toast.success("Mensagem do recibo copiada!");
    window.setTimeout(() => setMessageCopied(false), 2000);
  }

  async function handleShare() {
    if (!navigator.share) {
      await navigator.clipboard.writeText(receiptMessage);
      toast.success("Mensagem copiada para compartilhar");
      return;
    }

    try {
      const shareData: ShareData = {
        title: `Atendimento de ${petName}`,
        text: receiptMessage,
      };

      if (qrCodeUrl) {
        const blob = await fetch(qrCodeUrl).then((response) => response.blob());
        const file = new File([blob], `pix-${appointment.id}.png`, {
          type: "image/png",
        });

        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Não foi possível compartilhar o recibo");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white">
        <div className="flex items-center justify-between border-b p-4 sm:p-5">
          <div>
            <h2 className="text-xl font-bold">Atendimento concluído</h2>
            <p className="text-sm text-slate-500">
              Compartilhe a cobrança com o tutor
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4 text-sm">
            <p>
              <strong>Tutor:</strong> {tutorName}
            </p>
            <p>
              <strong>Pet:</strong> {petName}
            </p>
            <p>
              <strong>Serviços:</strong> {appointment.servico}
            </p>
            <p>
              <strong>Valor:</strong> {formatCurrency(valor)}
            </p>
          </div>

          {pixResult.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {pixResult.error} Revise os dados em Configurações.
            </div>
          ) : canGeneratePix && qrCodeUrl ? (
            <div className="text-center">
              <Image
                src={qrCodeUrl}
                alt="QR Code PIX"
                width={280}
                height={280}
                unoptimized
                className="mx-auto h-auto w-full max-w-[280px]"
              />
              <p className="mt-2 text-sm text-slate-500">
                Escaneie para pagar via PIX
              </p>
            </div>
          ) : formaPagamento === "PIX" ? (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Complete a chave PIX, beneficiário e cidade em Configurações para
              gerar o QR Code.
            </div>
          ) : null}

          {pixCode && (
            <div className="rounded-xl border bg-slate-50 p-3">
              <p className="mb-2 text-sm font-semibold">PIX copia e cola</p>
              <p className="max-h-24 overflow-y-auto break-all rounded-lg bg-white p-3 font-mono text-xs text-slate-600">
                {pixCode}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {pixCode && (
              <button
                type="button"
                onClick={handleCopyPix}
                className="flex items-center justify-center gap-2 rounded-xl border py-3"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copiado" : "Copiar PIX"}
              </button>
            )}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-white"
            >
              <MessageCircle size={18} />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-2 rounded-xl border py-3"
            >
              {messageCopied ? <Check size={18} /> : <Copy size={18} />}
              {messageCopied ? "Mensagem copiada" : "Copiar mensagem"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-3 text-white"
            >
              <Share2 size={18} />
              Compartilhar recibo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
