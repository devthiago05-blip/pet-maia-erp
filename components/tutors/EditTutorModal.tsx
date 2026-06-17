"use client";

import { useState } from "react";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";

interface EditTutorModalProps {
  tutor: any;
  onSave: (tutor: any) => void;
}

export function EditTutorModal({
  tutor,
  onSave,
}: EditTutorModalProps) {
const [open, setOpen] = useState(true);

const [nome, setNome] = useState(
  tutor.nome || ""
);

const [telefone, setTelefone] =
  useState(
    tutor.telefone || ""
  );

const [email, setEmail] =
  useState(
    tutor.email || ""
  );

function handleSave() {
if (!nome.trim()) {
alert("Informe o nome do tutor");
return;
}


if (!telefone.trim()) {
  alert("Informe o telefone");
  return;
}

if (email && !email.includes("@")) {
  alert("Digite um email válido");
  return;
}

console.log({
  nome,
  telefone,
  email,
});

onSave({
  ...tutor,
  nome,
  telefone,
  email,
});
alert("Tutor salvo com sucesso!");

setOpen(false);

setNome("");
setTelefone("");
setEmail("");


}

return (
<>


  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
             Editar Tutor
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 mt-4">
        <div>
          <label className="text-sm font-medium">
            Nome
          </label>

          <input
            value={nome}
            onChange={(e) =>
              setNome(
                e.target.value.replace(
                  /[^a-zA-ZÀ-ÿ\s]/g,
                  ""
                )
              )
            }
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>

        <div>

        </div>

        <div>
          <label className="text-sm font-medium">
            Telefone
          </label>

          <input
            value={telefone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");

              const formatted = value
                .replace(/^(\d{2})(\d)/g, "($1) $2")
                .replace(/(\d{5})(\d)/, "$1-$2");

              setTelefone(formatted);
            }}
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Email
          </label>

          <input
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-[#8A0EEA] text-white py-2 rounded-xl mt-2"
        >
          Salvar Tutor
        </button>
      </div>
    </DialogContent>
  </Dialog>
</>


);
}
