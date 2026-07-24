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
import type { Tutor } from "@/types/domain";

interface EditTutorModalProps {
  tutor: Tutor;
  onSave: (tutor: Tutor) => void;
}

export function EditTutorModal({ tutor, onSave }: EditTutorModalProps) {
  const [open, setOpen] = useState(true);
  const [nome, setNome] = useState(tutor.nome || "");
  const [telefone, setTelefone] = useState(tutor.telefone || "");
  const [cpf, setCpf] = useState(formatCpf(tutor.cpf));
  const [email, setEmail] = useState(tutor.email || "");
  const [endereco, setEndereco] = useState(tutor.endereco || "");

  function handleSave() {
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

    const cpfLimpo = onlyDigits(cpf);

    if (cpfLimpo && cpfLimpo.length !== 11) {
      toast.error("CPF deve ter 11 números");
      return;
    }

    onSave({
      ...tutor,
      nome,
      telefone,
      cpf: cpfLimpo || null,
      email,
      endereco: endereco.trim().toUpperCase(),
    });

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
            className="mt-2 w-full rounded-xl bg-[#8A0EEA] py-2 text-white"
          >
            Salvar Alterações
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
