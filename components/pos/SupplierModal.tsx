"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewSupplierInput } from "@/types/domain";

export function SupplierModal({
  onSave,
}: {
  onSave: (supplier: NewSupplierInput) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [contato, setContato] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Informe o nome do fornecedor");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        nome: nome.trim(),
        documento: documento.trim() || undefined,
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        contato: contato.trim() || undefined,
        ativo: true,
      });
      setOpen(false);
      setNome("");
      setDocumento("");
      setTelefone("");
      setEmail("");
      setContato("");
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
        className="rounded-xl border px-4 py-2"
      >
        Novo fornecedor
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-4 sm:p-6">
            <h2 className="mb-5 text-xl font-bold">Novo fornecedor</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <SupplierInput label="Nome" value={nome} onChange={setNome} />
              <SupplierInput
                label="CNPJ / CPF"
                value={documento}
                onChange={setDocumento}
              />
              <SupplierInput
                label="Telefone"
                value={telefone}
                onChange={setTelefone}
              />
              <SupplierInput label="Email" value={email} onChange={setEmail} />
              <div className="sm:col-span-2">
                <SupplierInput
                  label="Pessoa de contato"
                  value={contato}
                  onChange={setContato}
                />
              </div>
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
                className="rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SupplierInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
