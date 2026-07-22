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
  "Exames e procedimento de risco": {
    title: "Consentimento para exames e procedimentos de risco",
    content:
      "Declaro que fui informado sobre os exames e/ou procedimentos diagnósticos indicados, incluindo finalidade, preparo, riscos de reações adversas, complicações e alternativas. Autorizo sua realização e eventuais medidas de emergência necessárias à proteção do paciente.",
  },
  "Procedimento terapêutico": {
    title: "Consentimento para procedimento terapêutico",
    content:
      "Declaro que recebi explicações claras sobre o tratamento ou procedimento indicado, benefícios esperados, riscos, alternativas, possibilidade de mudança de conduta e cuidados posteriores. Autorizo sua realização no paciente.",
  },
  Cirurgia: {
    title: "Consentimento para procedimento cirúrgico",
    content:
      "Declaro que fui informado sobre a cirurgia indicada, técnica proposta, benefícios, riscos, possíveis complicações, alternativas e cuidados pré e pós-operatórios. Autorizo o procedimento e as medidas adicionais indispensáveis diante de intercorrências.",
  },
  "Anestesia e sedação": {
    title: "Consentimento para anestesia e sedação",
    content:
      "Declaro que fui informado sobre o protocolo anestésico ou sedativo, necessidade de jejum e exames, monitoramento, riscos inerentes, possíveis reações e intercorrências. Autorizo a anestesia, sedação e medidas de suporte ou emergência necessárias.",
  },
  "Internação e tratamento": {
    title: "Consentimento para internação e tratamento",
    content:
      "Autorizo a internação e o tratamento clínico ou pós-cirúrgico do paciente. Declaro ter recebido informações sobre motivo, cuidados previstos, exames, medicações, monitoramento, riscos, atualizações clínicas e estimativa inicial de custos.",
  },
  "Transfusão de sangue": {
    title: "Consentimento para transfusão sanguínea",
    content:
      "Declaro que fui informado sobre a indicação de transfusão de sangue ou hemocomponentes, benefícios, compatibilidade, riscos de reações imediatas ou tardias, transmissão de agentes e necessidade de monitoramento. Autorizo sua realização.",
  },
  Odontologia: {
    title: "Consentimento para procedimento odontológico",
    content:
      "Declaro que fui informado sobre avaliação e tratamento odontológico, necessidade de anestesia, radiografias, limpeza, extrações que se mostrarem indicadas, riscos e cuidados posteriores. Autorizo os procedimentos descritos e necessários.",
  },
  "Reprodução e obstetrícia": {
    title: "Consentimento para procedimento reprodutivo ou obstétrico",
    content:
      "Declaro que fui informado sobre o atendimento reprodutivo ou obstétrico indicado, riscos para a fêmea e os filhotes, possibilidade de cesariana, perdas fetais, esterilização emergencial quando indispensável e cuidados posteriores. Autorizo a conduta descrita.",
  },
  "Isolamento infectocontagioso": {
    title: "Ciência e autorização para isolamento",
    content:
      "Declaro que fui informado sobre a suspeita ou confirmação de doença infectocontagiosa, necessidade de isolamento, medidas de biossegurança, limitações de visita, riscos de transmissão e custos adicionais. Autorizo os cuidados necessários.",
  },
  Eutanásia: {
    title: "Consentimento livre e esclarecido para eutanásia",
    content:
      "Declaro que recebi esclarecimentos sobre o estado clínico, prognóstico, alternativas possíveis, finalidade e etapas da eutanásia. Após sanar minhas dúvidas, autorizo livremente a realização do procedimento pelo médico-veterinário, visando evitar sofrimento incompatível com o bem-estar do animal.",
  },
  "Retirada do corpo": {
    title: "Termo de retirada do corpo de animal em óbito",
    content:
      "Declaro que fui informado sobre as opções de destinação legal e sanitariamente adequadas e solicito a retirada do corpo do animal, assumindo a responsabilidade por seu transporte e destinação conforme a legislação aplicável.",
  },
  "Destinação e cremação": {
    title: "Autorização para destinação do corpo",
    content:
      "Autorizo a destinação do corpo do animal conforme a opção registrada neste documento, incluindo cremação individual, cremação coletiva ou serviço autorizado. Declaro ciência das condições, prazos, identificação e possibilidade ou não de devolução das cinzas.",
  },
  Necropsia: {
    title: "Consentimento para necropsia",
    content:
      "Autorizo a realização de necropsia e, quando necessário, coleta e envio de amostras para exames complementares. Declaro ciência da finalidade diagnóstica, das alterações decorrentes do procedimento, dos prazos e da destinação posterior do corpo.",
  },
  "Doação para ensino e pesquisa": {
    title: "Consentimento para doação do corpo para ensino e pesquisa",
    content:
      "Autorizo a doação do corpo do animal para atividades de ensino e/ou pesquisa autorizadas, após receber esclarecimentos sobre finalidade, uso, conservação, impossibilidade de devolução e destinação final ética e sanitariamente adequada.",
  },
  "Pesquisa clínica": {
    title: "Consentimento para participação em pesquisa clínica",
    content:
      "Declaro que recebi informações sobre objetivo, métodos, duração, benefícios, riscos, custos, confidencialidade e liberdade para retirar o animal da pesquisa sem penalidade. Autorizo voluntariamente sua participação conforme o protocolo apresentado.",
  },
  "Retirada sem alta": {
    title: "Termo de retirada do animal sem alta médica",
    content:
      "Solicito a retirada do paciente antes da alta médica, apesar das orientações recebidas. Declaro ciência dos riscos da interrupção do acompanhamento ou tratamento, possíveis agravamentos e cuidados recomendados, assumindo a responsabilidade por esta decisão.",
  },
  "Recusa de tratamento": {
    title: "Termo de recusa de tratamento",
    content:
      "Declaro que recebi orientação sobre o tratamento recomendado, riscos da não realização e possíveis consequências, e opto por recusá-lo neste momento.",
  },
  "Transporte e remoção": {
    title: "Consentimento para transporte ou remoção",
    content:
      "Autorizo o transporte ou a remoção do paciente para outro serviço, declarando ciência de seu estado clínico, riscos durante o deslocamento, necessidade de suporte, destino informado e responsabilidade pelo acompanhamento conforme combinado.",
  },
  "Uso de imagem e dados": {
    title: "Autorização de uso de imagem e dados clínicos",
    content:
      "Autorizo o uso de imagens e informações clínicas do animal para a finalidade especificada neste documento, preservando os dados pessoais do responsável quando aplicável. Estou ciente de que a autorização pode ser delimitada ou revogada para usos futuros.",
  },
  Outro: {
    title: "Consentimento clínico",
    content:
      "Declaro que recebi informações em linguagem clara sobre o ato descrito abaixo, seus objetivos, riscos, alternativas e cuidados, tive oportunidade de esclarecer dúvidas e manifesto minha decisão livremente.",
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
  const [type, setType] = useState<ClinicalConsent["consent_type"]>(
    "Procedimento terapêutico",
  );
  const [title, setTitle] = useState(
    consentTexts["Procedimento terapêutico"].title,
  );
  const [content, setContent] = useState(
    consentTexts["Procedimento terapêutico"].content,
  );
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
            20 modelos para autorizações, internações, altas, óbito e outros
            atos.
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
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
                Modelo editável. O médico-veterinário deve adaptar o texto ao
                caso, explicar riscos e alternativas e confirmar a versão
                adotada pelo responsável técnico.
              </div>
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
