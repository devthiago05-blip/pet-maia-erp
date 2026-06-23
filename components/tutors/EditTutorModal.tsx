"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tutor } from "@/types/domain";

interface EditTutorModalProps {
  tutor: Tutor;
  onSave: (tutor: Tutor) => void;
}

export function EditTutorModal({ tutor, onSave }: EditTutorModalProps) {
  const [open, setOpen] = useState(true);
  const [nome, setNome] = useState(tutor.nome || "");
  const [telefone, setTelefone] = useState(tutor.telefone || "");
  const [email, setEmail] = useState(tutor.email || "");

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

    onSave({
      ...tutor,
      nome,
      telefone,
      email,
    });

    setOpen(false);
    setNome("");
    setTelefone("");
    setEmail("");
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
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
