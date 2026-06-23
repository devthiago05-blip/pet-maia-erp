"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { NewTutorInput } from "@/types/domain";

interface NewTutorModalProps {
  onSave: (tutor: NewTutorInput & { id: number; pets: number }) => void;
}

export function NewTutorModal({ onSave }: NewTutorModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  function handleSave() {
    if (!nome.trim()) {
      alert("Informe o nome do tutor");
      return;
    }

    if (!telefone.trim()) {
      alert("Informe o telefone");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (telefoneLimpo.length !== 11) {
      alert("Telefone deve estar no formato (85) 99999-9999");
      return;
    }

    if (email && !email.includes("@")) {
      alert("Digite um email válido");
      return;
    }

    onSave({
      id: Date.now(),
      nome,
      telefone,
      email,
      pets: 0,
    });

    alert("Tutor salvo com sucesso!");
    setOpen(false);
    setNome("");
    setEndereco("");
    setTelefone("");
    setEmail("");
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
              <label className="text-sm font-medium">Endereço</label>
              <input
                value={endereco}
                onChange={(event) => setEndereco(event.target.value)}
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
              Salvar Tutor
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
