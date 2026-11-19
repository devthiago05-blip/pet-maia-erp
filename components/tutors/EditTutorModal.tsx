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
import { formatTutorPhoneInput, isTutorWithoutPhone } from "@/lib/tutor-phone";
import type { Tutor } from "@/types/domain";

interface EditTutorModalProps {
  tutor: Tutor;
  onSave: (tutor: Tutor) => Promise<boolean>;
}

export function EditTutorModal({ tutor, onSave }: EditTutorModalProps) {
  const [open, setOpen] = useState(true);
  const [nome, setNome] = useState(tutor.nome || "");
  const [telefone, setTelefone] = useState(
    isTutorWithoutPhone(tutor.telefone) ? "" : tutor.telefone || "",
  );
  const [semNumero, setSemNumero] = useState(
    isTutorWithoutPhone(tutor.telefone),
  );
  const [cpf, setCpf] = useState(formatCpf(tutor.cpf));
  const [email, setEmail] = useState(tutor.email || "");
  const [endereco, setEndereco] = useState(tutor.endereco || "");
  const [saving, setSaving] = useState(false);

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
      ...tutor,
      nome,
      telefone: semNumero ? "" : telefone,
      cpf: cpfLimpo || null,
      email,
      endereco: endereco.trim().toUpperCase(),
    });
    setSaving(false);

    if (!success) return;

    setOpen(false);
    setNome("");
    setTelefone("");
    setCpf("");
    setEmail("");
    setEndereco("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Tutor</DialogTitle>
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
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
