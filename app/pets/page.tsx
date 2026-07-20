"use client";

import { Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditPetModal } from "@/components/pets/EditPetModal";
import { NewPetModal } from "@/components/pets/NewPetModal";
import {
  formatBathRecurrence,
  PetTable,
} from "@/components/pets/PetTable";
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
      toast.error("Erro ao salvar pet");
      return;
    }

    await loadPets();
    toast.success("Pet salvo com sucesso!");
  }

  async function handleUpdatePet(petAtualizado: Pet & { tutorId: string }) {
    const { error } = await updatePet(petAtualizado);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar pet");
      return;
    }

    await loadPets();
    setEditingPet(null);
    toast.success("Pet atualizado com sucesso!");
  }

  async function handleDeletePet(id: number) {
    const { error } = await deletePet(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir pet");
      return;
    }

    setPets(pets.filter((pet) => pet.id !== id));
    toast.success("Pet excluído com sucesso!");
  }

  function handlePrintPets() {
    window.print();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 print:hidden sm:p-6 lg:p-8">
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

              <button
                type="button"
                onClick={handlePrintPets}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 sm:w-auto"
              >
                <Printer size={18} />
                Imprimir
              </button>

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

        <PetPrintView pets={filteredPets} />
      </main>
    </div>
  );
}

function PetPrintView({ pets }: { pets: Pet[] }) {
  const printedAt = new Date().toLocaleString("pt-BR");

  return (
    <section className="document-print-area hidden bg-white p-8 print:block">
      <div className="mb-6 border-b-2 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          PET MAIA ERP
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Pets cadastrados
        </h1>
        <p className="mt-1 text-sm text-slate-500">Impresso em {printedAt}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Foto</th>
            <th className="border p-2">Nome</th>
            <th className="border p-2">Espécie</th>
            <th className="border p-2">Raça</th>
            <th className="border p-2">Porte</th>
            <th className="border p-2">Tutor</th>
            <th className="border p-2">Recorrência de banho</th>
          </tr>
        </thead>
        <tbody>
          {pets.length === 0 ? (
            <tr>
              <td className="border p-4 text-center" colSpan={7}>
                Nenhum pet encontrado.
              </td>
            </tr>
          ) : (
            pets.map((pet) => (
              <tr key={pet.id}>
                <td className="border p-2">
                  {pet.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pet.photo_url}
                      alt={pet.nome}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border p-2">{pet.nome}</td>
                <td className="border p-2">{pet.especie || "-"}</td>
                <td className="border p-2">{pet.raca || "-"}</td>
                <td className="border p-2">{pet.porte || "-"}</td>
                <td className="border p-2">{pet.tutors?.nome || "-"}</td>
                <td className="border p-2">
                  {formatBathRecurrence(pet.bath_reminder_interval_days)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
