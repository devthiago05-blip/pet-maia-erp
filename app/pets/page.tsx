"use client";

import { useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditPetModal } from "@/components/pets/EditPetModal";
import { NewPetModal } from "@/components/pets/NewPetModal";
import { PetTable } from "@/components/pets/PetTable";
import { useMountEffect } from "@/hooks/useMountEffect";
import { createPet, deletePet, fetchPets, updatePet } from "@/services/pets";
import { fetchTutors } from "@/services/tutors";
import type { NewPetInput, Pet, Tutor } from "@/types/domain";

export default function PetsPage() {
  const [search, setSearch] = useState("");
  const [pets, setPets] = useState<Pet[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const filteredPets = pets.filter((pet) =>
    pet.nome.toLowerCase().includes(search.toLowerCase()),
  );

  async function loadPets() {
    const { data, error } = await fetchPets();

    if (error) {
      console.error(error);
      return;
    }

    setPets(data || []);
  }

  async function loadTutors() {
    const { data, error } = await fetchTutors();

    if (error) {
      console.error(error);
      return;
    }

    setTutors(data || []);
  }

  useMountEffect(() => {
    loadPets();
    loadTutors();
  });

  async function handleCreatePet(novoPet: NewPetInput) {
    const { error } = await createPet(novoPet);

    if (error) {
      console.error(error);
      alert("Erro ao salvar pet");
      return;
    }

    await loadPets();
  }

  async function handleUpdatePet(petAtualizado: Pet & { tutorId: string }) {
    const { error } = await updatePet(petAtualizado);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar pet");
      return;
    }

    await loadPets();
    setEditingPet(null);
    alert("Pet atualizado com sucesso!");
  }

  async function handleDeletePet(id: number) {
    const confirmar = window.confirm("Deseja realmente excluir este pet?");

    if (!confirmar) {
      return;
    }

    const { error } = await deletePet(id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir pet");
      return;
    }

    setPets(pets.filter((pet) => pet.id !== id));
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Pets
              </h1>
              <p className="mt-2 text-slate-500">
                Gerencie os pets cadastrados
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
              <input
                type="text"
                placeholder="Buscar pet..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 sm:min-w-72 lg:w-80"
              />

              <NewPetModal tutors={tutors} onSave={handleCreatePet} />
            </div>
          </div>

          {editingPet && (
            <EditPetModal
              pet={editingPet}
              tutors={tutors}
              onSave={handleUpdatePet}
            />
          )}

          <PetTable
            pets={filteredPets}
            onDelete={handleDeletePet}
            onEdit={setEditingPet}
          />
        </div>
      </main>
    </div>
  );
}
