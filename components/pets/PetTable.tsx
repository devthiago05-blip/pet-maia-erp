"use client";

import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import type { Pet } from "@/types/domain";

interface PetTableProps {
  pets: Pet[];
  onDelete: (id: number) => void;
  onEdit: (pet: Pet) => void;
}

export function formatBathRecurrence(intervalDays?: number | null) {
  if (!intervalDays) {
    return "Sem recorrência";
  }

  return `A cada ${intervalDays} dias`;
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
      <div className="space-y-3 md:hidden">
        {pets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum pet encontrado.
          </div>
        ) : (
          pets.map((pet) => (
            <article
              key={pet.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {pet.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pet.photo_url}
                    alt={pet.nome}
                    className="h-14 w-14 shrink-0 rounded-xl bg-slate-50 object-contain p-0.5"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-lg font-bold text-[#8A0EEA]">
                    {pet.nome.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/pets/${pet.id}`}
                    className="block truncate text-lg font-bold text-[#8A0EEA]"
                  >
                    {pet.nome}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {[pet.especie, pet.raca, pet.porte]
                      .filter(Boolean)
                      .join(" · ") || "Dados não informados"}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    Tutor: {pet.tutors?.nome || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-sm font-medium text-[#7100bd]">
                <CalendarClock size={17} className="shrink-0" />
                Banho: {formatBathRecurrence(pet.bath_reminder_interval_days)}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 font-semibold text-blue-700"
                  onClick={() => onEdit(pet)}
                >
                  <Pencil size={16} />
                  Editar
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 font-semibold text-red-600"
                  onClick={() => setPetToDelete(pet)}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Nome</th>
                <th className="p-3 text-left sm:p-4">Espécie</th>
                <th className="p-3 text-left sm:p-4">Raça</th>
                <th className="p-3 text-left sm:p-4">Porte</th>
                <th className="p-3 text-left sm:p-4">Tutor</th>
                <th className="p-3 text-left sm:p-4">Recorrência</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {pets.map((pet) => (
                <tr key={pet.id} className="border-t border-slate-100">
                  <td className="p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      {pet.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pet.photo_url}
                          alt={pet.nome}
                          className="h-10 w-10 rounded-lg bg-slate-50 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-xs font-bold text-[#8A0EEA]">
                          {pet.nome.charAt(0)}
                        </div>
                      )}

                      <Link
                        href={`/pets/${pet.id}`}
                        className="font-medium text-[#8A0EEA] hover:underline"
                      >
                        {pet.nome}
                      </Link>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">{pet.especie}</td>
                  <td className="p-3 sm:p-4">{pet.raca}</td>
                  <td className="p-3 sm:p-4">{pet.porte || "-"}</td>
                  <td className="p-3 sm:p-4">{pet.tutors?.nome || "-"}</td>
                  <td className="p-3 text-sm text-slate-600 sm:p-4">
                    {formatBathRecurrence(pet.bath_reminder_interval_days)}
                  </td>
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
