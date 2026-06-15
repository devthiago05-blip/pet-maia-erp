"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TutorTable } from "@/components/tutors/TutorTable";
import { NewTutorModal } from "@/components/tutors/NewTutorModal";


export default function TutorsPage() {
  

  const handleEdit = (tutor: any) => {
  console.log("EDITAR:", tutor);
};
  const [tutors, setTutors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const filteredTutors = tutors.filter((tutor) =>
  tutor.nome
    .toLowerCase()
    .includes(search.toLowerCase())
);
  useEffect(() => {
  const savedTutors = localStorage.getItem("tutors");

  if (savedTutors) {
    setTutors(JSON.parse(savedTutors));
  } else {
    setTutors([
      {
        id: 1,
        nome: "João Silva",
        telefone: "(85) 99999-9999",
        pets: 2,
      },
      {
        id: 2,
        nome: "Maria Souza",
        telefone: "(85) 98888-8888",
        pets: 1,
      },
    ]);
  }
}, []);
useEffect(() => {
  localStorage.setItem(
    "tutors",
    JSON.stringify(tutors)
  );
}, [tutors]);
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-slate-50 min-h-screen">
        <Header />

        <div className="p-8">
          <div className="flex justify-between items-center mb-6">

            <div>
              <h2 className="text-3xl font-bold">
                Tutores
              </h2>

              <p className="text-slate-500">
                Gerencie seus clientes
              </p>
            </div>
            <div className="mt-4">
  <input
    type="text"
    placeholder="🔍 Buscar tutor..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full max-w-md border border-slate-300 rounded-xl px-4 py-2"
  />
</div>

            <NewTutorModal
  onSave={(novoTutor) =>
    setTutors([
      ...tutors,
      novoTutor,
    ])
  }
/>

          </div>

         <TutorTable
  tutors={filteredTutors}
  onDelete={(id) =>
    setTutors(
      tutors.filter(
        (tutor) => tutor.id !== id
      )
    )
  }
  onEdit={handleEdit}
/>
        </div>
      </main>
    </div>
  );
}