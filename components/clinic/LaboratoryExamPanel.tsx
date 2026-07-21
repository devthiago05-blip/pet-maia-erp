"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ExamAttachments } from "@/components/clinic/ExamAttachments";
import { formatDate } from "@/lib/formatters";
import type { ClinicalExam } from "@/types/domain";

type ExamFilter =
  | "Todos"
  | "Solicitado"
  | "Coletado"
  | "Concluído"
  | "Atrasado";

export function LaboratoryExamPanel({
  exams,
  onStageChange,
}: {
  exams: ClinicalExam[];
  onStageChange: (
    examId: number,
    status: ClinicalExam["status"],
  ) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<ExamFilter>("Todos");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const activeExams = exams.filter((exam) => exam.status !== "Cancelado");
  const overdueCount = activeExams.filter(isExamOverdue).length;
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return activeExams.filter((exam) => {
      const matchesFilter =
        filter === "Todos" ||
        (filter === "Atrasado" ? isExamOverdue(exam) : exam.status === filter);
      const matchesSearch =
        !term ||
        exam.exam_name.toLocaleLowerCase("pt-BR").includes(term) ||
        exam.pets?.nome.toLocaleLowerCase("pt-BR").includes(term) ||
        exam.pets?.tutors?.nome.toLocaleLowerCase("pt-BR").includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [activeExams, filter, search]);

  async function advance(exam: ClinicalExam) {
    const nextStatus = exam.status === "Solicitado" ? "Coletado" : "Concluído";
    setSavingId(exam.id);
    await onStageChange(exam.id, nextStatus);
    setSavingId(null);
  }

  const filters: Array<{ label: string; value: ExamFilter; count: number }> = [
    { label: "Todos", value: "Todos", count: activeExams.length },
    {
      label: "Aguardando coleta",
      value: "Solicitado",
      count: activeExams.filter((e) => e.status === "Solicitado").length,
    },
    {
      label: "Aguardando resultado",
      value: "Coletado",
      count: activeExams.filter((e) => e.status === "Coletado").length,
    },
    {
      label: "Resultados",
      value: "Concluído",
      count: activeExams.filter((e) => e.status === "Concluído").length,
    },
    { label: "Atrasados", value: "Atrasado", count: overdueCount },
  ];

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="text-[#8A0EEA]" size={22} />
            <h2 className="text-lg font-bold">Central de exames</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe coleta, laboratório, resultados e laudos dos pacientes.
          </p>
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            <AlertTriangle size={17} /> {overdueCount} exame(s) atrasado(s)
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium ${filter === item.value ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]" : "border-slate-200 text-slate-600"}`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-xl border px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar exame, pet ou tutor"
          className="min-w-0 flex-1 py-3 text-sm outline-none"
        />
      </label>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {filtered.map((exam) => {
          const overdue = isExamOverdue(exam);
          const expanded = expandedId === exam.id;
          return (
            <article
              key={exam.id}
              className={`rounded-xl border p-4 ${overdue ? "border-rose-200 bg-rose-50/30" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{exam.exam_name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {exam.pets?.nome || "Paciente"} ·{" "}
                    {exam.pets?.tutors?.nome || "Tutor não informado"}
                  </p>
                </div>
                <ExamStatus exam={exam} overdue={overdue} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-3">
                <ExamInfo
                  label="Solicitado"
                  value={formatDate(exam.request_date)}
                />
                <ExamInfo
                  label="Coleta"
                  value={formatDate(exam.collection_date)}
                />
                <ExamInfo
                  label="Laboratório"
                  value={exam.laboratory || "Não informado"}
                />
              </div>
              {exam.result && (
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  <strong>Resultado:</strong> {exam.result}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                {exam.status !== "Concluído" && (
                  <button
                    type="button"
                    disabled={savingId === exam.id}
                    onClick={() => void advance(exam)}
                    className="rounded-xl bg-[#8A0EEA] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {savingId === exam.id
                      ? "Salvando..."
                      : exam.status === "Solicitado"
                        ? "Confirmar coleta"
                        : "Marcar resultado"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : exam.id)}
                  className="rounded-xl border px-3 py-2 text-sm font-medium text-[#8A0EEA]"
                >
                  {expanded ? "Ocultar laudo" : "Laudo e anexos"}
                </button>
                <Link
                  href={`/pets/${exam.pet_id}`}
                  className="col-span-2 rounded-xl border px-3 py-2 text-center text-sm font-medium text-slate-700"
                >
                  Prontuário
                </Link>
              </div>
              {expanded && (
                <div className="mt-4">
                  <ExamAttachments petId={exam.pet_id} examId={exam.id} />
                </div>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 xl:col-span-2">
            Nenhum exame encontrado neste filtro.
          </div>
        )}
      </div>
    </section>
  );
}

function isExamOverdue(exam: ClinicalExam) {
  if (exam.status === "Concluído" || exam.status === "Cancelado") return false;
  const reference = exam.collection_date || exam.request_date;
  const limit = exam.status === "Coletado" ? 5 : 2;
  const date = new Date(`${reference}T12:00:00`);
  return Date.now() - date.getTime() > limit * 86_400_000;
}

function ExamStatus({
  exam,
  overdue,
}: {
  exam: ClinicalExam;
  overdue: boolean;
}) {
  if (overdue)
    return (
      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
        Atrasado
      </span>
    );
  if (exam.status === "Concluído")
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
        <CheckCircle2 size={13} /> Resultado disponível
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
      {exam.status === "Solicitado"
        ? "Aguardando coleta"
        : "Aguardando resultado"}
    </span>
  );
}

function ExamInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}
