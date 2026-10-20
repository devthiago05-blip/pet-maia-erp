"use client";

import { MessageCircle, PawPrint, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { MapsRouteLink } from "@/components/maps/MapsRouteLink";
import { TutorDetailsDialog } from "@/components/tutors/TutorDetailsDialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { formatCpf } from "@/lib/formatters";
import { createTutorWhatsAppUrl } from "@/lib/whatsapp";
import type { Tutor } from "@/types/domain";

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
  function handleTutorClick(tutor: Tutor) {
    setSelectedTutor(tutor);
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
                        title="Ver ficha e histórico do tutor"
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

      {selectedTutor && (
        <TutorDetailsDialog
          key={selectedTutor.id}
          tutorId={selectedTutor.id}
          onClose={() => setSelectedTutor(null)}
          onAddPet={onAddPet}
        />
      )}
    </>
  );
}
