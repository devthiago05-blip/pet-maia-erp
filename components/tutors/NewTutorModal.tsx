"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NewTutorInput } from "@/types/domain";

interface NewTutorModalProps {
  onSave: (tutor: NewTutorInput) => Promise<boolean>;
}

export function NewTutorModal({ onSave }: NewTutorModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
  }

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Informe o nome do tutor");
      return;
    }

    if (!telefone.trim()) {
      toast.error("Informe o telefone");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (telefoneLimpo.length !== 11) {
      toast.error("Telefone deve estar no formato (85) 99999-9999");
      return;
    }

    if (email && !email.includes("@")) {
      toast.error("Digite um email válido");
      return;
    }

    setSaving(true);

    const success = await onSave({
      nome: nome.trim(),
      telefone,
      email: email.trim(),
      endereco: endereco.trim().toUpperCase(),
    });

    setSaving(false);

    if (success) {
      resetForm();
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white hover:opacity-90 sm:w-auto"
      >
        Novo Tutor
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Tutor</DialogTitle>
          </DialogHeader>

          <div className="mt-4 grid gap-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))
                }
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Telefone</label>
              <input
                value={telefone}
                onChange={(event) => {
                  const value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 11);

                  const formatted = value
                    .replace(/^(\d{2})(\d)/g, "($1) $2")
                    .replace(/(\d{5})(\d)/, "$1-$2");

                  setTelefone(formatted);
                }}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Endereço</label>
              <input
                value={endereco}
                onChange={(event) => setEndereco(event.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border p-2"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar Tutor"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
