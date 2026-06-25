"use client";

import { CalendarClock, MessageCircle, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { InteractionModal } from "@/components/crm/InteractionModal";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatDate } from "@/lib/formatters";
import { createCrmInteraction, fetchCrmTutors } from "@/services/crm";
import type { CrmInteractionInput, CrmTutor } from "@/types/domain";

export default function CrmPage() {
  const { profile } = useAccess();
  const [tutors, setTutors] = useState<CrmTutor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadCrm() {
    const { data, error } = await fetchCrmTutors();

    if (error) {
      console.error(error);
      setLoadError(
        "Não foi possível carregar o CRM. Execute o script 013_crm_bi_modules.sql.",
      );
      setLoading(false);
      return;
    }

    setTutors((data || []) as CrmTutor[]);
    setLoading(false);
  }

  useMountEffect(() => {
    loadCrm();
  });

  async function handleInteractionSave(input: CrmInteractionInput) {
    const { error } = await createCrmInteraction(input);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    await loadCrm();
    toast.success("Contato registrado!");
  }

  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tutors.filter(
      (tutor) =>
        !term ||
        tutor.nome.toLowerCase().includes(term) ||
        tutor.telefone?.toLowerCase().includes(term) ||
        tutor.email?.toLowerCase().includes(term) ||
        tutor.pets?.some((pet) => pet.nome.toLowerCase().includes(term)),
    );
  }, [search, tutors]);

  const openActions = tutors.flatMap((tutor) =>
    (tutor.crm_interactions || []).filter(
      (interaction) => interaction.status === "Aberto",
    ),
  ).length;
  const contactedTutors = tutors.filter(
    (tutor) => (tutor.crm_interactions || []).length > 0,
  ).length;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              CRM
            </h1>
            <p className="text-slate-500">
              Relacionamento e acompanhamento de tutores
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <CrmSummary icon={Users} label="Tutores" value={tutors.length} />
            <CrmSummary
              icon={MessageCircle}
              label="Com histórico"
              value={contactedTutors}
            />
            <CrmSummary
              icon={CalendarClock}
              label="Próximas ações"
              value={openActions}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border bg-white px-4">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar tutor, contato ou pet"
              className="min-w-0 flex-1 py-3 outline-none"
            />
          </label>

          {loadError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando CRM...
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredTutors.map((tutor) => {
                const interactions = [...(tutor.crm_interactions || [])].sort(
                  (first, second) =>
                    second.contact_date.localeCompare(first.contact_date),
                );
                const nextAction = interactions
                  .filter(
                    (interaction) =>
                      interaction.status === "Aberto" &&
                      interaction.next_action_date,
                  )
                  .sort((first, second) =>
                    String(first.next_action_date).localeCompare(
                      String(second.next_action_date),
                    ),
                  )[0];

                return (
                  <article
                    key={tutor.id}
                    className="rounded-xl border bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold">{tutor.nome}</h2>
                        <p className="text-sm text-slate-500">
                          {tutor.telefone || "Sem telefone"} ·{" "}
                          {tutor.email || "Sem email"}
                        </p>
                        <p className="mt-1 text-sm">
                          <strong>Pets:</strong>{" "}
                          {tutor.pets?.map((pet) => pet.nome).join(", ") || "-"}
                        </p>
                      </div>
                      <InteractionModal
                        tutorId={tutor.id}
                        tutorName={tutor.nome}
                        responsibleName={profile?.nome || ""}
                        onSave={handleInteractionSave}
                      />
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                      <p>
                        <strong>Último contato:</strong>{" "}
                        {interactions[0]
                          ? `${formatDate(interactions[0].contact_date)} · ${interactions[0].subject}`
                          : "Nenhum contato registrado"}
                      </p>
                      <p className="mt-1">
                        <strong>Próxima ação:</strong>{" "}
                        {nextAction
                          ? `${formatDate(nextAction.next_action_date)} · ${nextAction.subject}`
                          : "Nenhuma ação pendente"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CrmSummary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div className="rounded-xl bg-purple-50 p-3 text-[#8A0EEA]">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
