"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCpf, onlyDigits } from "@/lib/formatters";
import { formatTutorPhoneInput } from "@/lib/tutor-phone";
import type { NewTutorInput } from "@/types/domain";

interface NewTutorModalProps {
  onSave: (tutor: NewTutorInput) => Promise<boolean>;
}

export function NewTutorModal({ onSave }: NewTutorModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [semNumero, setSemNumero] = useState(false);
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setNome("");
    setTelefone("");
    setSemNumero(false);
    setCpf("");
    setEmail("");
    setEndereco("");
  }

  async function handleSave() {
    if (!nome.trim()) {
      toast.error("Informe o nome do tutor");
      return;
    }

    if (!semNumero && !telefone.trim()) {
      toast.error("Informe o telefone");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!semNumero && telefoneLimpo.length !== 11) {
      toast.error("Telefone deve estar no formato (85) 99999-9999");
      return;
    }

    if (email && !email.includes("@")) {
      toast.error("Digite um email válido");
      return;
    }

    const cpfLimpo = onlyDigits(cpf);

    if (cpfLimpo && cpfLimpo.length !== 11) {
      toast.error("CPF deve ter 11 números");
      return;
    }

    setSaving(true);

    const success = await onSave({
      nome: nome.trim(),
      telefone: semNumero ? "" : telefone,
      cpf: cpfLimpo || null,
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
                disabled={semNumero}
                onChange={(event) => {
                  setTelefone(formatTutorPhoneInput(event.target.value));
                }}
                inputMode="tel"
                placeholder={semNumero ? "Tutor sem número" : "(85) 99999-9999"}
                className="mt-1 w-full rounded-lg border p-2 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={semNumero}
                  onChange={(event) => {
                    setSemNumero(event.target.checked);
                    if (event.target.checked) setTelefone("");
                  }}
                  className="size-4 accent-[#8A0EEA]"
                />
                Sem número
              </label>
            </div>

            <div>
              <label className="text-sm font-medium">CPF</label>
              <input
                value={cpf}
                onChange={(event) => setCpf(formatCpf(event.target.value))}
                inputMode="numeric"
                placeholder="000.000.000-00"
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
                onChange={(event) =>
                  setEndereco(event.target.value.toUpperCase())
                }
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
