"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NewPetModal } from "@/components/pets/NewPetModal";
import { EditTutorModal } from "@/components/tutors/EditTutorModal";
import { NewTutorModal } from "@/components/tutors/NewTutorModal";
import { TutorTable } from "@/components/tutors/TutorTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMountEffect } from "@/hooks/useMountEffect";
import { createPet } from "@/services/pets";
import {
  createTutor,
  deleteTutor,
  fetchTutors,
  updateTutor,
} from "@/services/tutors";
import type { NewPetInput, NewTutorInput, Tutor } from "@/types/domain";

export default function TutorsPage() {
  const searchParams = useSearchParams();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
  const [createdTutorForPet, setCreatedTutorForPet] = useState<Tutor | null>(
    null,
  );
  const [petModalOpen, setPetModalOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const filteredTutors = tutors.filter((tutor) =>
    tutor.nome.toLowerCase().includes(search.toLowerCase()),
  );
  const tutorsForPetModal =
    createdTutorForPet &&
    !tutors.some((tutor) => tutor.id === createdTutorForPet.id)
      ? [...tutors, createdTutorForPet]
      : tutors;

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

  async function handleCreateTutor(novoTutor: NewTutorInput): Promise<boolean> {
    const { data, error } = await createTutor(novoTutor);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar tutor");
      return false;
    }

    await loadTutors();

    const savedTutor = data as Tutor | null;

    if (savedTutor) {
      setCreatedTutorForPet(savedTutor);
    }

    toast.success("Tutor salvo com sucesso!");
    return true;
  }
  async function handleCreatePetForCreatedTutor(
    novoPet: NewPetInput,
  ): Promise<boolean> {
    const { error } = await createPet(novoPet);

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar pet");
      return false;
    }

    await loadTutors();
    toast.success("Pet salvo com sucesso!");
    return true;
  }

  function handleClosePetQuestion() {
    setCreatedTutorForPet(null);
    setPetModalOpen(false);
  }

  function handlePetModalOpenChange(open: boolean) {
    setPetModalOpen(open);

    if (!open) {
      setCreatedTutorForPet(null);
    }
  }

  async function handleUpdateTutor(tutorAtualizado: Tutor) {
    const { error } = await updateTutor(tutorAtualizado);

    if (error) {
      console.error(error);
      toast.error("Erro ao atualizar tutor");
      return;
    }

    await loadTutors();
    setEditingTutor(null);
    toast.success("Tutor atualizado com sucesso!");
  }

  async function handleDeleteTutor(id: number) {
    const { error } = await deleteTutor(id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir tutor");
      return;
    }

    await loadTutors();
    toast.success("Tutor excluído com sucesso!");
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
            <Dialog
              open={Boolean(createdTutorForPet) && !petModalOpen}
              onOpenChange={(open) => {
                if (!open) {
                  handleClosePetQuestion();
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar pet?</DialogTitle>
                  <DialogDescription>
                    Tutor cadastrado com sucesso. Deseja cadastrar um pet para{" "}
                    <strong>{createdTutorForPet?.nome}</strong> agora?
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleClosePetQuestion}
                    className="rounded-xl border px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Não agora
                  </button>

                  <button
                    type="button"
                    onClick={() => setPetModalOpen(true)}
                    className="rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white hover:bg-[#7600d1]"
                  >
                    Sim, cadastrar pet
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            {createdTutorForPet && (
              <NewPetModal
                tutors={tutorsForPetModal}
                onSave={handleCreatePetForCreatedTutor}
                open={petModalOpen}
                onOpenChange={handlePetModalOpenChange}
                defaultTutorId={String(createdTutorForPet.id)}
                hideTrigger
              />
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
