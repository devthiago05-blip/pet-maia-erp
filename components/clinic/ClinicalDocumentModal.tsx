"use client";

import { Printer, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { formatDate } from "@/lib/formatters";
import type {
  ClinicalDocument,
  ClinicalDocumentInput,
  Pet,
} from "@/types/domain";

const documentTemplates: Array<{
  id: string;
  type: ClinicalDocument["document_type"];
  title: string;
  content: string;
}> = [
  {
    id: "health-certificate",
    type: "Atestado",
    title: "Atestado de saúde animal",
    content:
      "Atesto, para os devidos fins, que o paciente {pet}, sob responsabilidade de {tutor}, foi avaliado nesta data.\n\nCondição clínica e observações:\n",
  },
  {
    id: "attendance",
    type: "Declaração",
    title: "Declaração de comparecimento",
    content:
      "Declaro que {tutor} compareceu à Clínica Veterinária Pet Maia nesta data, acompanhando o paciente {pet}, para atendimento veterinário.",
  },
  {
    id: "procedure-authorization",
    type: "Declaração",
    title: "Autorização para procedimento",
    content:
      "Eu, {tutor}, responsável pelo paciente {pet}, autorizo a realização do procedimento descrito abaixo, após receber esclarecimentos sobre benefícios, riscos e cuidados.\n\nProcedimento autorizado:\n",
  },
  {
    id: "anesthesia-authorization",
    type: "Declaração",
    title: "Autorização anestésica e cirúrgica",
    content:
      "Eu, {tutor}, responsável pelo paciente {pet}, autorizo o procedimento anestésico e/ou cirúrgico indicado, declarando ter recebido esclarecimentos sobre riscos, exames e cuidados necessários.\n\nProcedimento:\n",
  },
  {
    id: "treatment-refusal",
    type: "Declaração",
    title: "Termo de recusa de tratamento",
    content:
      "Eu, {tutor}, responsável pelo paciente {pet}, declaro que fui informado sobre a recomendação clínica descrita abaixo e, neste momento, opto por não autorizar sua realização.\n\nRecomendação recusada:\n",
  },
  {
    id: "guidance",
    type: "Orientação",
    title: "Orientações ao responsável",
    content:
      "Paciente: {pet}\nResponsável: {tutor}\n\nOrientações e cuidados:\n",
  },
];

export function ClinicalDocumentModal({
  pet,
  document,
  defaultProfessionalName,
  onSave,
}: {
  pet: Pet;
  document?: ClinicalDocument;
  defaultProfessionalName: string;
  onSave?: (input: ClinicalDocumentInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState<
    ClinicalDocument["document_type"]
  >(document?.document_type || "Atestado");
  const [title, setTitle] = useState(document?.title || "");
  const [content, setContent] = useState(document?.content || "");
  const [issueDate, setIssueDate] = useState(
    document?.issue_date || new Date().toLocaleDateString("en-CA"),
  );
  const [professionalName, setProfessionalName] = useState(
    document?.professional_name || defaultProfessionalName,
  );
  const [saving, setSaving] = useState(false);

  function applyTemplate(templateId: string) {
    const template = documentTemplates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    const replacePatientData = (value: string) =>
      value
        .replaceAll("{pet}", pet.nome)
        .replaceAll("{tutor}", pet.tutors?.nome || "responsável");

    setDocumentType(template.type);
    setTitle(template.title);
    setContent(replacePatientData(template.content));
  }

  async function handleSave() {
    if (
      !title.trim() ||
      !content.trim() ||
      !issueDate ||
      !professionalName.trim() ||
      !onSave
    ) {
      toast.error("Preencha título, conteúdo, data e profissional");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        petId: pet.id,
        documentType,
        title: title.trim(),
        content: content.trim(),
        issueDate,
        professionalName: professionalName.trim(),
      });
      setOpen(false);
      setTitle("");
      setContent("");
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  const preview = document || {
    document_type: documentType,
    title,
    content,
    issue_date: issueDate,
    professional_name: professionalName,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          document
            ? "text-[#8A0EEA]"
            : "w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        }
      >
        {document ? "Visualizar" : "Novo documento"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4 print:hidden">
              <h2 className="text-xl font-bold">
                {document ? document.title : "Novo documento clínico"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {!document && (
              <div className="grid gap-4 border-b p-4 sm:grid-cols-2 sm:p-6">
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Modelo pré-pronto
                  <select
                    defaultValue=""
                    onChange={(event) => applyTemplate(event.target.value)}
                    className="rounded-xl border p-3 font-normal"
                  >
                    <option value="">Documento em branco</option>
                    {documentTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Tipo
                  <select
                    value={documentType}
                    onChange={(event) =>
                      setDocumentType(
                        event.target.value as ClinicalDocument["document_type"],
                      )
                    }
                    className="rounded-xl border p-3 font-normal"
                  >
                    <option>Atestado</option>
                    <option>Declaração</option>
                    <option>Orientação</option>
                  </select>
                </label>
                <DocumentInput
                  label="Data"
                  type="date"
                  value={issueDate}
                  onChange={setIssueDate}
                />
                <DocumentInput
                  label="Título"
                  value={title}
                  onChange={setTitle}
                />
                <DocumentInput
                  label="Profissional"
                  value={professionalName}
                  onChange={setProfessionalName}
                />
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Conteúdo
                  <textarea
                    rows={7}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    className="resize-y rounded-xl border p-3 font-normal"
                  />
                </label>
              </div>
            )}

            <div className="receipt-print-area space-y-6 p-5 sm:p-8">
              <div className="border-b pb-5 text-center">
                <BrandLogo className="mx-auto max-w-[250px]" />
                <p className="mt-2 font-semibold">{preview.document_type}</p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  <strong>Paciente:</strong> {pet.nome}
                </p>
                <p>
                  <strong>Tutor:</strong> {pet.tutors?.nome || "-"}
                </p>
                <p>
                  <strong>Data:</strong> {formatDate(preview.issue_date)}
                </p>
                <p>
                  <strong>Profissional:</strong> {preview.professional_name}
                </p>
              </div>
              <div>
                <h3 className="text-center text-lg font-bold">
                  {preview.title || "Título do documento"}
                </h3>
                <p className="mt-5 min-h-32 whitespace-pre-wrap">
                  {preview.content || "Conteúdo do documento"}
                </p>
              </div>
              <div className="pt-12 text-center">
                <div className="mx-auto w-64 border-t pt-2 text-sm">
                  {preview.professional_name}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t p-4 print:hidden sm:grid-cols-2">
              {!document && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 py-2 text-white disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar documento"}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] py-2 text-white"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DocumentInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
