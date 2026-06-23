"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditTutorModal } from "@/components/tutors/EditTutorModal";
import { NewTutorModal } from "@/components/tutors/NewTutorModal";
import { TutorTable } from "@/components/tutors/TutorTable";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  createTutor,
  deleteTutor,
  fetchTutors,
  updateTutor,
} from "@/services/tutors";
import type { NewTutorInput, Tutor } from "@/types/domain";

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [search, setSearch] = useState("");

  const filteredTutors = tutors.filter((tutor) =>
    tutor.nome.toLowerCase().includes(search.toLowerCase()),
  );

  async function loadTutors() {
    const { data, error } = await fetchTutors();

    if (error) {
      console.error(error);
      return;
    }

    setTutors(data || []);
  }

  useMountEffect(() => {
    loadTutors();
  });

  useEffect(() => {
    if (tutors.length > 0) {
      localStorage.setItem("tutors", JSON.stringify(tutors));
    }
  }, [tutors]);

  useMountEffect(() => {
    const savedTutors = localStorage.getItem("tutors");

    if (savedTutors) {
      setTutors(JSON.parse(savedTutors));
    }
  });

  async function handleCreateTutor(novoTutor: NewTutorInput) {
    const { error } = await createTutor(novoTutor);

    if (error) {
      console.error(error);
      alert("Erro ao salvar tutor");
      return;
    }

    await loadTutors();
  }

  async function handleUpdateTutor(tutorAtualizado: Tutor) {
    const { error } = await updateTutor(tutorAtualizado);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar tutor");
      return;
    }

    await loadTutors();
    setEditingTutor(null);
  }

  async function handleDeleteTutor(id: number) {
    const { error } = await deleteTutor(id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir tutor");
      return;
    }

    await loadTutors();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold sm:text-3xl">Tutores</h2>
              <p className="text-slate-500">Gerencie seus clientes</p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
              <input
                type="text"
                placeholder="Buscar tutor..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 sm:min-w-72 lg:w-80"
              />

              <NewTutorModal onSave={handleCreateTutor} />
            </div>

            {editingTutor && (
              <EditTutorModal tutor={editingTutor} onSave={handleUpdateTutor} />
            )}
          </div>

          <TutorTable
            tutors={filteredTutors}
            onDelete={handleDeleteTutor}
            onEdit={setEditingTutor}
          />
        </div>
      </main>
    </div>
  );
}
