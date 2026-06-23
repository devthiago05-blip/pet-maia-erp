"use client";

import Link from "next/link";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type { Pet } from "@/types/domain";

interface PetTableProps {
  pets: Pet[];
  onDelete: (id: number) => void;
  onEdit: (pet: Pet) => void;
}

export function PetTable({ pets, onDelete, onEdit }: PetTableProps) {
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);

  function handleConfirmDelete() {
    if (!petToDelete) {
      return;
    }

    onDelete(petToDelete.id);
    setPetToDelete(null);
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Nome</th>
                <th className="p-3 text-left sm:p-4">Espécie</th>
                <th className="p-3 text-left sm:p-4">Raça</th>
                <th className="p-3 text-left sm:p-4">Porte</th>
                <th className="p-3 text-left sm:p-4">Tutor</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {pets.map((pet) => (
                <tr key={pet.id} className="border-t border-slate-100">
                  <td className="p-3 sm:p-4">
                    <Link
                      href={`/pets/${pet.id}`}
                      className="font-medium text-[#8A0EEA] hover:underline"
                    >
                      {pet.nome}
                    </Link>
                  </td>
                  <td className="p-3 sm:p-4">{pet.especie}</td>
                  <td className="p-3 sm:p-4">{pet.raca}</td>
                  <td className="p-3 sm:p-4">{pet.porte || "-"}</td>
                  <td className="p-3 sm:p-4">{pet.tutors?.nome || "-"}</td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="text-blue-600"
                        onClick={() => onEdit(pet)}
                      >
                        Editar
                      </button>

                      <button
                        className="text-red-600"
                        onClick={() => setPetToDelete(pet)}
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
        isOpen={Boolean(petToDelete)}
        title="Excluir pet"
        description={`Deseja excluir ${petToDelete?.nome}?`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPetToDelete(null)}
      />
    </>
  );
}
