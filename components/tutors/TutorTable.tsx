"use client";

import Link from "next/link";
import { useState } from "react";

import { MapsRouteLink } from "@/components/maps/MapsRouteLink";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchPetsByTutorId } from "@/services/pets";
import type { Pet, Tutor } from "@/types/domain";

interface TutorTableProps {
  tutors: Tutor[];
  onDelete: (id: number) => void;
  onEdit: (tutor: Tutor) => void;
}

export function TutorTable({ tutors, onDelete, onEdit }: TutorTableProps) {
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [relatedPets, setRelatedPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [petsError, setPetsError] = useState("");

  async function handleTutorClick(tutor: Tutor) {
    setSelectedTutor(tutor);
    setRelatedPets([]);
    setPetsError("");
    setLoadingPets(true);

    const { data, error } = await fetchPetsByTutorId(tutor.id);

    if (error) {
      console.error(error);
      setPetsError("Não foi possível carregar os pets deste tutor.");
    } else {
      setRelatedPets(data || []);
    }

    setLoadingPets(false);
  }

  function handleConfirmDelete() {
    if (!tutorToDelete) {
      return;
    }

    onDelete(tutorToDelete.id);
    setTutorToDelete(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Nome</th>
                <th className="p-3 text-left sm:p-4">Telefone</th>
                <th className="p-3 text-left sm:p-4">Endereço</th>
                <th className="p-3 text-left sm:p-4">Pets</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {tutors.map((tutor) => (
                <tr key={tutor.id} className="border-t border-slate-100">
                  <td className="p-3 sm:p-4">
                    <button
                      type="button"
                      onClick={() => handleTutorClick(tutor)}
                      className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 transition hover:text-violet-900"
                      title="Ver pets relacionados"
                    >
                      {tutor.nome}
                    </button>
                  </td>
                  <td className="p-3 sm:p-4">{tutor.telefone}</td>
                  <td className="max-w-64 truncate p-3 sm:p-4">
                    <MapsRouteLink address={tutor.endereco} compact />
                  </td>
                  <td className="p-3 sm:p-4">{tutor.pets}</td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => onEdit(tutor)}
                        className="text-blue-600"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => setTutorToDelete(tutor)}
                        className="text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(tutorToDelete)}
        title="Excluir tutor"
        description={`Deseja excluir ${tutorToDelete?.nome}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTutorToDelete(null)}
      />

      <Dialog
        open={Boolean(selectedTutor)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTutor(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Pets de {selectedTutor?.nome}</DialogTitle>
            <DialogDescription>
              Pets relacionados a este tutor. Clique em um pet para abrir o
              cadastro completo.
            </DialogDescription>
          </DialogHeader>

          {loadingPets && (
            <p className="rounded-xl bg-slate-50 p-4 text-slate-500">
              Carregando pets...
            </p>
          )}

          {!loadingPets && petsError && (
            <p className="rounded-xl bg-red-50 p-4 text-red-700">{petsError}</p>
          )}

          {!loadingPets && !petsError && relatedPets.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-slate-500">
              Nenhum pet relacionado a este tutor.
            </p>
          )}

          {!loadingPets && !petsError && relatedPets.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedPets.map((pet) => (
                <Link
                  key={pet.id}
                  href={`/pets/${pet.id}`}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <p className="font-semibold text-slate-900">{pet.nome}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[pet.especie, pet.raca].filter(Boolean).join(" • ") ||
                      "Dados não informados"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
