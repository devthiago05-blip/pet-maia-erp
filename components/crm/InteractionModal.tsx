"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { CrmInteractionInput } from "@/types/domain";

export function InteractionModal({
  tutorId,
  tutorName,
  responsibleName,
  onSave,
}: {
  tutorId: number;
  tutorName: string;
  responsibleName: string;
  onSave: (input: CrmInteractionInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [contactDate, setContactDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [channel, setChannel] = useState("WhatsApp");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!subject.trim() || !responsibleName.trim()) {
      toast.error("Informe o assunto do contato");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        tutorId,
        contactDate,
        channel,
        subject: subject.trim(),
        notes: notes.trim(),
        nextActionDate,
        status: nextActionDate ? "Aberto" : "Concluído",
        responsibleName,
      });
      setOpen(false);
      setSubject("");
      setNotes("");
      setNextActionDate("");
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-[#8A0EEA]"
      >
        Registrar contato
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Contato com {tutorName}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CrmInput
                label="Data"
                type="date"
                value={contactDate}
                onChange={setContactDate}
              />
              <label className="grid gap-2 text-sm font-medium">
                Canal
                <select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                >
                  <option>WhatsApp</option>
                  <option>Telefone</option>
                  <option>Email</option>
                  <option>Presencial</option>
                </select>
              </label>
              <div className="sm:col-span-2">
                <CrmInput
                  label="Assunto"
                  value={subject}
                  onChange={setSubject}
                />
              </div>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Observações
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="resize-y rounded-xl border p-3 font-normal"
                />
              </label>
              <CrmInput
                label="Próxima ação"
                type="date"
                value={nextActionDate}
                onChange={setNextActionDate}
              />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border py-2 sm:flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-50 sm:flex-1"
              >
                {saving ? "Salvando..." : "Salvar contato"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CrmInput({
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
