"use client";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useEffect, useState } from "react";

import { PetTable } from "@/components/pets/PetTable";
import { NewPetModal } from "@/components/pets/NewPetModal";

export default function PetsPage() {
  const [search, setSearch] = useState("");
  const [pets, setPets] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const filteredPets = pets.filter((pet) =>
  pet.nome
    .toLowerCase()
    .includes(search.toLowerCase())
);
useEffect(() => {
  async function loadPets() {

    const { data, error } =
  await supabase
    .from("pets")
    .select(`
      *,
      tutors (
        nome
      )
    `);

    console.log("PETS:", data);

    if (error) {
      console.error(error);
      return;
    }

    setPets(data || []);
  }

  loadPets();
}, []);
useEffect(() => {
  async function loadTutors() {

    const { data, error } =
      await supabase
        .from("tutors")
        .select("*");

    if (error) {
      console.error(error);
      return;
    }

    setTutors(data || []);
  }

  loadTutors();
}, []);
console.log("TUTORES:", tutors);
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
  onSave={async (novoPet) => {

    const { error } =
      await supabase
        .from("pets")
        .insert([
          {
            nome: novoPet.nome,
            especie: novoPet.especie,
            raca: novoPet.raca,
            tutor_id:
              Number(
                novoPet.tutorId
              ),
          },
        ]);

    if (error) {
      console.error(error);
      alert(
        "Erro ao salvar pet"
      );
      return;
    }

    const { data } =
      await supabase
        .from("pets")
.select(`
  *,
  tutors (
    nome
  )
`)

    setPets(data || []);
  }}
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
