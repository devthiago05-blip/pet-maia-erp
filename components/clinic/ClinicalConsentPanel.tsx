"use client";

import { Eraser, FileSignature, Printer, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { formatDate } from "@/lib/formatters";
import type {
  ClinicalConsent,
  ClinicalConsentInput,
  Pet,
} from "@/types/domain";

const consentTexts: Record<
  ClinicalConsent["consent_type"],
  { title: string; content: string }
> = {
  Procedimento: {
    title: "Autorização para procedimento",
    content:
      "Declaro que recebi explicações sobre o procedimento indicado, seus benefícios, riscos, alternativas e cuidados posteriores, e autorizo sua realização no paciente.",
  },
  "Anestesia e cirurgia": {
    title: "Consentimento anestésico e cirúrgico",
    content:
      "Declaro que fui informado sobre o procedimento anestésico e/ou cirúrgico indicado, seus riscos, exames recomendados, possíveis intercorrências e cuidados pós-operatórios, e autorizo sua realização.",
  },
  Internação: {
    title: "Autorização para internação",
    content:
      "Autorizo a internação do paciente e os cuidados necessários durante o período, declarando ter recebido informações sobre acompanhamento, medicações, exames e custos estimados.",
  },
  "Recusa de tratamento": {
    title: "Termo de recusa de tratamento",
    content:
      "Declaro que recebi orientação sobre o tratamento recomendado, riscos da não realização e possíveis consequências, e opto por recusá-lo neste momento.",
  },
  Outro: {
    title: "Consentimento clínico",
    content:
      "Declaro que recebi as informações necessárias, tive oportunidade de esclarecer dúvidas e manifesto minha decisão conforme descrito neste documento.",
  },
};

export function ClinicalConsentPanel({
  pet,
  consents,
  professionalName,
  clinicalRecordId,
  onSave,
}: {
  pet: Pet;
  consents: ClinicalConsent[];
  professionalName: string;
  clinicalRecordId?: number;
  onSave: (input: ClinicalConsentInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ClinicalConsent | null>(null);
  const [type, setType] =
    useState<ClinicalConsent["consent_type"]>("Procedimento");
  const [title, setTitle] = useState(consentTexts.Procedimento.title);
  const [content, setContent] = useState(consentTexts.Procedimento.content);
  const [signerName, setSignerName] = useState(pet.tutors?.nome || "");
  const [signerDocument, setSignerDocument] = useState("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const signed = useRef(false);

  function selectType(value: ClinicalConsent["consent_type"]) {
    setType(value);
    setTitle(consentTexts[value].title);
    setContent(consentTexts[value].content);
  }
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (event.currentTarget.width / rect.width),
      y:
        (event.clientY - rect.top) * (event.currentTarget.height / rect.height),
    };
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    signed.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    ctx?.beginPath();
    ctx?.moveTo(p.x, p.y);
  }
  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = event.currentTarget.getContext("2d");
    const p = point(event);
    if (ctx) {
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    signed.current = false;
  }
  async function save() {
    if (
      !title.trim() ||
      !content.trim() ||
      !signerName.trim() ||
      !signed.current ||
      !canvasRef.current
    ) {
      toast.error("Preencha o documento e peça a assinatura do responsável");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        petId: pet.id,
        clinicalRecordId,
        consentType: type,
        title: title.trim(),
        content: content.trim(),
        signerName: signerName.trim(),
        signerDocument: signerDocument.trim(),
        signatureDataUrl: canvasRef.current.toDataURL("image/png"),
        professionalName,
      });
      setOpen(false);
      clear();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-b bg-violet-50/50 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSignature className="text-[#8A0EEA]" size={21} />
            <h4 className="font-bold">Consentimentos assinados</h4>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Autorizações, internações e recusas com assinatura do tutor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white"
        >
          Novo consentimento
        </button>
      </div>
      {consents.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed bg-white p-4 text-center text-sm text-slate-500">
          Nenhum consentimento assinado.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {consents.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setPreview(item)}
              className="rounded-xl border bg-white p-4 text-left hover:border-violet-300"
            >
              <span className="text-xs font-semibold uppercase text-[#8A0EEA]">
                {item.consent_type}
              </span>
              <p className="mt-1 font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                Assinado por {item.signer_name} em {formatDate(item.signed_at)}
              </p>
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 sm:p-6">
          <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white">
            <header className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-bold">Novo consentimento</h2>
              <button aria-label="Fechar" onClick={() => setOpen(false)}>
                <X />
              </button>
            </header>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
              <label className="grid gap-2 text-sm font-medium">
                Tipo
                <select
                  value={type}
                  onChange={(e) =>
                    selectType(
                      e.target.value as ClinicalConsent["consent_type"],
                    )
                  }
                  className="rounded-xl border p-3"
                >
                  {Object.keys(consentTexts).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Título
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border p-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Texto aceito
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="rounded-xl border p-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Responsável que assina
                <input
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="rounded-xl border p-3"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                CPF/RG (opcional)
                <input
                  value={signerDocument}
                  onChange={(e) => setSignerDocument(e.target.value)}
                  className="rounded-xl border p-3"
                />
              </label>
              <div className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Assinatura do responsável
                  </span>
                  <button
                    type="button"
                    onClick={clear}
                    className="flex items-center gap-1 text-sm text-slate-600"
                  >
                    <Eraser size={16} /> Limpar
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={220}
                  onPointerDown={start}
                  onPointerMove={draw}
                  onPointerUp={() => (drawing.current = false)}
                  onPointerCancel={() => (drawing.current = false)}
                  className="h-44 w-full touch-none rounded-xl border-2 border-dashed bg-slate-50"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Assine com o dedo, caneta touchpad ou mouse.
                </p>
              </div>
            </div>
            <footer className="grid gap-3 border-t p-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-3"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="rounded-xl bg-emerald-600 py-3 font-medium text-white disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Finalizar e guardar assinatura"}
              </button>
            </footer>
          </div>
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 p-3 sm:p-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white">
            <header className="flex items-center justify-between border-b p-4 print:hidden">
              <h2 className="font-bold">Consentimento assinado</h2>
              <button aria-label="Fechar" onClick={() => setPreview(null)}>
                <X />
              </button>
            </header>
            <div className="receipt-print-area space-y-6 p-6 sm:p-10">
              <BrandLogo className="mx-auto max-w-[240px]" />
              <div className="text-sm">
                <p>
                  <b>Paciente:</b> {pet.nome}
                </p>
                <p>
                  <b>Tutor:</b> {pet.tutors?.nome || "-"}
                </p>
                <p>
                  <b>Data:</b> {formatDate(preview.signed_at)}
                </p>
              </div>
              <h3 className="text-center text-xl font-bold">{preview.title}</h3>
              <p className="whitespace-pre-wrap leading-7">{preview.content}</p>
              <div className="pt-8 text-center">
                <Image
                  src={preview.signature_data_url}
                  alt="Assinatura do responsável"
                  width={480}
                  height={120}
                  unoptimized
                  className="mx-auto h-24 max-w-full object-contain"
                />
                <div className="mx-auto w-72 border-t pt-2 text-sm">
                  {preview.signer_name}
                  {preview.signer_document
                    ? ` · ${preview.signer_document}`
                    : ""}
                </div>
              </div>
              <p className="text-center text-xs text-slate-500">
                Registrado por {preview.professional_name}
              </p>
            </div>
            <footer className="border-t p-4 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-3 text-white"
              >
                <Printer size={18} />
                Imprimir / salvar PDF
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
