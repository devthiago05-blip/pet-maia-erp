"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useEffect, useState } from "react";

import { PetTable } from "@/components/pets/PetTable";
import { NewPetModal } from "@/components/pets/NewPetModal";

export default function PetsPage() {
  const [pets, setPets] = useState([
    {
      id: 1,
      nome: "Rex",
      especie: "Cachorro",
      raca: "Pitbull",
      tutor: "Thiago Lima",
    },
    {
      id: 2,
      nome: "Mel",
      especie: "Gato",
      raca: "SRD",
      tutor: "Maria Souza",
    },
  ]);
  const [search, setSearch] = useState("");
  const [tutors, setTutors] = useState<any[]>([]);
  const filteredPets = pets.filter((pet) =>
  pet.nome
    .toLowerCase()
    .includes(search.toLowerCase())
);

  useEffect(() => {
  const savedTutors =
    localStorage.getItem("tutors");

  if (savedTutors) {
    setTutors(JSON.parse(savedTutors));
  }
}, []);

  return (
  <div className="flex">
    <Sidebar />

    <main className="flex-1 bg-slate-50 min-h-screen">
      <Header />

      <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#8A0EEA]">
          Pets
        </h1>

        <p className="text-slate-500 mt-2">
          Gerencie os pets cadastrados
        </p>
        <div className="mt-4">
  <input
    type="text"
    placeholder="🔍 Buscar pet..."
    value={search}
    onChange={(e) =>
      setSearch(e.target.value)
    }
    className="w-full max-w-md border border-slate-300 rounded-xl px-4 py-2"
  />
</div>
      </div>
      <NewPetModal
  tutors={tutors}
  onSave={(novoPet) =>
    setPets([
      ...pets,
      novoPet,
    ])
  }
/>
      <PetTable
  pets={filteredPets}
  onDelete={(id) =>
    setPets(
      pets.filter(
        (pet) => pet.id !== id
      )
    )
  }
/>
          </div>
    </main>
  </div>
);
}
