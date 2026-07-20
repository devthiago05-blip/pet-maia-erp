"use client";

import { useState } from "react";

import { MapsRouteLink } from "@/components/maps/MapsRouteLink";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type { Tutor } from "@/types/domain";

interface TutorTableProps {
  tutors: Tutor[];
  onDelete: (id: number) => void;
  onEdit: (tutor: Tutor) => void;
}

export function TutorTable({ tutors, onDelete, onEdit }: TutorTableProps) {
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);

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
                  <td className="p-3 sm:p-4">{tutor.nome}</td>
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
    </>
  );
}
