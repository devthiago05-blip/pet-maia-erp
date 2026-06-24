"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { NewProductCategoryInput } from "@/types/domain";

interface CategoryModalProps {
  onSave: (category: NewProductCategoryInput) => Promise<void>;
}

export function CategoryModal({ onSave }: CategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const normalizedName = nome.trim();

    if (!normalizedName) {
      toast.error("Informe o nome da categoria");
      return;
    }

    setSaving(true);
    try {
      await onSave({ nome: normalizedName });
      setNome("");
      setOpen(false);
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
        className="rounded-xl border bg-white px-4 py-2 font-medium text-slate-700"
      >
        Nova categoria
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Nova categoria</h2>
            <label className="mt-5 grid gap-2 text-sm font-medium">
              Nome
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: Acessórios"
                className="rounded-xl border p-3 font-normal"
              />
            </label>
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
