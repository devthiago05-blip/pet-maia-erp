"use client";

import { Archive, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useMountEffect } from "@/hooks/useMountEffect";
import {
  archiveClinicalDocumentTemplate,
  createClinicalDocumentTemplate,
  fetchClinicalDocumentTemplates,
  updateClinicalDocumentTemplate,
} from "@/services/clinical";
import type {
  ClinicalDocument,
  ClinicalDocumentTemplate,
  ClinicalDocumentTemplateInput,
} from "@/types/domain";

const initialForm: ClinicalDocumentTemplateInput = {
  documentType: "Atestado",
  title: "",
  content: "",
  sortOrder: 0,
};

export function ClinicalDocumentTemplateManager() {
  const [templates, setTemplates] = useState<ClinicalDocumentTemplate[]>([]);
  const [form, setForm] =
    useState<ClinicalDocumentTemplateInput>(initialForm);
  const [editingId, setEditingId] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useMountEffect(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await fetchClinicalDocumentTemplates();

    if (error) {
      toast.error("Não foi possível carregar os modelos de documentos");
      setLoading(false);
      return;
    }

    setTemplates((data || []) as ClinicalDocumentTemplate[]);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(undefined);
    setForm(initialForm);
  }

  function startEditing(template: ClinicalDocumentTemplate) {
    setEditingId(template.id);
    setForm({
      documentType: template.document_type,
      title: template.title,
      content: template.content,
      sortOrder: template.sort_order,
    });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Informe título e conteúdo do modelo");
      return;
    }

    setSaving(true);
    const response = editingId
      ? await updateClinicalDocumentTemplate(editingId, form)
      : await createClinicalDocumentTemplate(form);

    if (response.error) {
      toast.error(response.error.message);
      setSaving(false);
      return;
    }

    toast.success(editingId ? "Modelo atualizado" : "Modelo criado");
    resetForm();
    await loadTemplates();
    setSaving(false);
  }

  async function handleArchive(id: number) {
    const { error } = await archiveClinicalDocumentTemplate(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Modelo arquivado");
    if (editingId === id) resetForm();
    await loadTemplates();
  }

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Modelos de documentos clínicos</h2>
          <p className="text-sm text-slate-500">
            Use {"{pet}"} e {"{tutor}"} para preencher os dados automaticamente.
          </p>
        </div>
        <span className="rounded-xl bg-purple-50 px-3 py-2 text-sm font-medium text-[#8A0EEA]">
          {templates.length} ativo(s)
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="max-h-[520px] divide-y overflow-y-auto rounded-xl border p-3">
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Carregando modelos...</p>
          ) : templates.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Nenhum modelo cadastrado.
            </p>
          ) : (
            templates.map((template) => (
              <article
                key={template.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold">{template.title}</h3>
                  <p className="text-xs font-medium text-[#8A0EEA]">
                    {template.document_type} · ordem {template.sort_order}
                  </p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-slate-500">
                    {template.content}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(template)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-[#8A0EEA]"
                  >
                    <Pencil size={15} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(template.id)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    <Archive size={15} /> Arquivar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="rounded-xl border p-3">
          <h3 className="font-semibold">
            {editingId ? "Editar modelo" : "Novo modelo"}
          </h3>
          <div className="mt-3 grid gap-3">
            <label className="grid gap-1 text-sm font-medium">
              Tipo
              <select
                value={form.documentType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentType: event.target
                      .value as ClinicalDocument["document_type"],
                  }))
                }
                className="rounded-xl border p-3 font-normal"
              >
                <option>Atestado</option>
                <option>Declaração</option>
                <option>Orientação</option>
              </select>
            </label>
            <TemplateInput
              label="Título"
              value={form.title}
              onChange={(title) => setForm((current) => ({ ...current, title }))}
            />
            <TemplateInput
              label="Ordem"
              value={String(form.sortOrder)}
              type="number"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: Number(value || 0),
                }))
              }
            />
            <label className="grid gap-1 text-sm font-medium">
              Conteúdo
              <textarea
                rows={9}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
                className="resize-y rounded-xl border p-3 font-normal"
              />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar modelo"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-4 py-2.5 font-semibold"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateInput({
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
    <label className="grid gap-1 text-sm font-medium">
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
