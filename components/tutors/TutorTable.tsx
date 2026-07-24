"use client";

import { MessageCircle, PawPrint, Pencil, Plus, Trash2 } from "lucide-react";
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
import { formatCpf } from "@/lib/formatters";
import { createTutorWhatsAppUrl } from "@/lib/whatsapp";
import { fetchPetsByTutorId } from "@/services/pets";
import type { Pet, Tutor } from "@/types/domain";

interface TutorTableProps {
  tutors: Tutor[];
  onAddPet: (tutor: Tutor) => void;
  onDelete: (id: number) => void;
  onEdit: (tutor: Tutor) => void;
}

export function TutorTable({
  tutors,
  onAddPet,
  onDelete,
  onEdit,
}: TutorTableProps) {
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
      <div className="space-y-3 md:hidden">
        {tutors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum tutor encontrado.
          </div>
        ) : (
          tutors.map((tutor) => {
            const whatsappUrl = createTutorWhatsAppUrl(
              tutor.telefone,
              tutor.nome,
            );
            const petCount = tutor.pets ?? 0;

            return (
              <article
                key={tutor.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-lg font-bold text-violet-700">
                    {tutor.nome.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleTutorClick(tutor)}
                      className="block max-w-full truncate text-left text-lg font-bold text-violet-700"
                    >
                      {tutor.nome}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTutorClick(tutor)}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600"
                    >
                      <PawPrint size={16} className="text-violet-600" />
                      {petCount === 1
                        ? "1 pet vinculado"
                        : `${petCount} pets vinculados`}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    CPF: {formatCpf(tutor.cpf) || "Não informado"}
                  </div>

                  {whatsappUrl ? (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-50 px-3 font-semibold text-emerald-700"
                      aria-label={`Abrir conversa com ${tutor.nome} no WhatsApp`}
                    >
                      <MessageCircle size={18} className="shrink-0" />
                      <span className="truncate">{tutor.telefone}</span>
                    </a>
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                      Telefone não informado
                    </div>
                  )}

                  {tutor.endereco ? (
                    <MapsRouteLink
                      address={tutor.endereco}
                      compact
                      className="min-h-11 rounded-xl bg-blue-50 px-3 no-underline"
                    />
                  ) : (
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                      Endereço não informado
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => onEdit(tutor)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 font-semibold text-blue-700"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTutorToDelete(tutor)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-50 font-semibold text-red-600"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left sm:p-4">Nome</th>
                <th className="p-3 text-left sm:p-4">CPF</th>
                <th className="p-3 text-left sm:p-4">Telefone</th>
                <th className="p-3 text-left sm:p-4">Endereço</th>
                <th className="p-3 text-left sm:p-4">Pets</th>
                <th className="p-3 text-left sm:p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {tutors.map((tutor) => {
                const whatsappUrl = createTutorWhatsAppUrl(
                  tutor.telefone,
                  tutor.nome,
                );

                return (
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
                    <td className="p-3 sm:p-4">
                      {formatCpf(tutor.cpf) || "-"}
                    </td>
                    <td className="p-3 sm:p-4">
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition hover:text-emerald-900"
                          title={`Conversar com ${tutor.nome} no WhatsApp`}
                          aria-label={`Abrir conversa com ${tutor.nome} no WhatsApp`}
                        >
                          <MessageCircle size={15} className="shrink-0" />
                          {tutor.telefone}
                        </a>
                      ) : (
                        tutor.telefone || "-"
                      )}
                    </td>
                    <td className="max-w-64 truncate p-3 sm:p-4">
                      <MapsRouteLink address={tutor.endereco} compact />
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className="inline-flex min-w-8 justify-center rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700"
                        title={`${tutor.pets ?? 0} pet(s) vinculado(s)`}
                      >
                        {tutor.pets ?? 0}
                      </span>
                    </td>
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
                );
              })}
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

          <button
            type="button"
            onClick={() => {
              if (!selectedTutor) {
                return;
              }

              const tutor = selectedTutor;
              setSelectedTutor(null);
              onAddPet(tutor);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 font-semibold text-white transition hover:bg-violet-800"
          >
            <Plus size={18} />
            Cadastrar novo pet
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
