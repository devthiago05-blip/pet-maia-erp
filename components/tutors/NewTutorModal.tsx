"use client";

import { useState } from "react";

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog";

interface NewTutorModalProps {
  onSave: (tutor: {
    id: number;
    nome: string;
    telefone: string;
    email: string;
    pets: number;
  }) => void;
}
export function NewTutorModal({
  onSave,
}: NewTutorModalProps) {
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

const telefoneLimpo =
  telefone.replace(/\D/g, "");

if (telefoneLimpo.length !== 11) {
  alert(
    "Telefone deve estar no formato (85) 99999-9999"
  );
  return;
}
if (email && !email.includes("@")) {
  alert("Digite um email válido");
  return;
}

console.log({
  nome,
  endereco,
  telefone,
  email,
});

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
onClick={() => setOpen(true)}
className="bg-[#8A0EEA] text-white px-4 py-2 rounded-xl hover:opacity-90"
>
Novo Tutor </button>


  <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          Novo Tutor
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
          <label className="text-sm font-medium">
            Endereço
          </label>

          <input
            value={endereco}
            onChange={(e) =>
              setEndereco(e.target.value)
            }
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Telefone
          </label>

          <input
            value={telefone}
           onChange={(e) => {
  const value = e.target.value
    .replace(/\D/g, "")
    .slice(0, 11);

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
