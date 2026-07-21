"use client";

import { CheckCircle2, ClipboardPlus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { formatDate } from "@/lib/formatters";
import type { ClinicalTask, ClinicPatientOverview } from "@/types/domain";

const taskTypes: ClinicalTask["task_type"][] = [
  "Pós-operatório",
  "Exame",
  "Curativo",
  "Medicação",
  "Retorno",
  "Outro",
];

const quickTaskTemplates: Array<{
  label: string;
  taskType: ClinicalTask["task_type"];
  title: string;
}> = [
  {
    label: "Ligação pós-operatória",
    taskType: "Pós-operatório",
    title: "Ligar para acompanhar recuperação pós-operatória",
  },
  {
    label: "Conferir exame",
    taskType: "Exame",
    title: "Conferir resultado do exame e avisar o tutor",
  },
  {
    label: "Trocar curativo",
    taskType: "Curativo",
    title: "Realizar troca de curativo",
  },
  {
    label: "Acompanhar medicação",
    taskType: "Medicação",
    title: "Confirmar adaptação e administração da medicação",
  },
];

export function ClinicalTasksPanel({
  tasks,
  patients,
  professionalName,
  onCreate,
  onToggle,
  onDelete,
}: {
  tasks: ClinicalTask[];
  patients: ClinicPatientOverview[];
  professionalName: string;
  onCreate: (input: {
    petId: number;
    taskType: ClinicalTask["task_type"];
    title: string;
    dueDate: string;
    priority: ClinicalTask["priority"];
    assignedTo?: string;
    notes?: string;
  }) => Promise<boolean>;
  onToggle: (taskId: number, completed: boolean) => Promise<boolean>;
  onDelete: (taskId: number) => Promise<boolean>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"Pendente" | "Concluída">("Pendente");
  const [petId, setPetId] = useState("");
  const [taskType, setTaskType] =
    useState<ClinicalTask["task_type"]>("Retorno");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [priority, setPriority] = useState<ClinicalTask["priority"]>("Normal");
  const [assignedTo, setAssignedTo] = useState(professionalName);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.status === filter),
    [filter, tasks],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!petId || !title.trim() || !dueDate) return;
    setSaving(true);
    const saved = await onCreate({
      petId: Number(petId),
      taskType,
      title,
      dueDate,
      priority,
      assignedTo,
      notes,
    });
    setSaving(false);
    if (saved) {
      setTitle("");
      setNotes("");
      setShowForm(false);
      setFilter("Pendente");
    }
  }

  async function toggleTask(task: ClinicalTask) {
    setWorkingId(task.id);
    await onToggle(task.id, task.status !== "Concluída");
    setWorkingId(null);
  }

  async function removeTask(taskId: number) {
    if (!window.confirm("Excluir esta tarefa clínica?")) return;
    setWorkingId(taskId);
    await onDelete(taskId);
    setWorkingId(null);
  }

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Tarefas clínicas</h2>
          <p className="text-sm text-slate-500">
            Pós-operatório, exames, curativos e acompanhamento de medicação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-medium text-white"
        >
          <ClipboardPlus size={18} />
          Nova tarefa
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-3 rounded-xl border bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div className="md:col-span-2 xl:col-span-3">
            <p className="mb-2 text-sm font-medium">Modelos rápidos</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickTaskTemplates.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => {
                    setTaskType(template.taskType);
                    setTitle(template.title);
                  }}
                  className="whitespace-nowrap rounded-full border bg-white px-3 py-2 text-sm text-[#8A0EEA] transition hover:bg-purple-50"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Pet">
            <select
              value={petId}
              onChange={(event) => setPetId(event.target.value)}
              required
              className="rounded-xl border bg-white p-3"
            >
              <option value="">Selecione</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.nome} · {patient.tutors?.nome || "Sem tutor"}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select
              value={taskType}
              onChange={(event) =>
                setTaskType(event.target.value as ClinicalTask["task_type"])
              }
              className="rounded-xl border bg-white p-3"
            >
              {taskTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Prazo">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              className="rounded-xl border bg-white p-3"
            />
          </Field>
          <Field label="Tarefa">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={160}
              placeholder="Ex.: ligar após a cirurgia"
              className="rounded-xl border bg-white p-3"
            />
          </Field>
          <Field label="Prioridade">
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as ClinicalTask["priority"])
              }
              className="rounded-xl border bg-white p-3"
            >
              <option>Baixa</option>
              <option>Normal</option>
              <option>Alta</option>
            </select>
          </Field>
          <Field label="Responsável">
            <input
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              placeholder="Nome do responsável"
              className="rounded-xl border bg-white p-3"
            />
          </Field>
          <label className="grid gap-1 text-sm font-medium md:col-span-2 xl:col-span-3">
            Observações
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="rounded-xl border bg-white p-3 font-normal"
            />
          </label>
          <div className="flex gap-2 md:col-span-2 xl:col-span-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border bg-white px-4 py-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar tarefa"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 flex gap-2">
        {(["Pendente", "Concluída"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-full border px-3 py-2 text-sm font-medium ${filter === status ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]" : "text-slate-600"}`}
          >
            {status} ({tasks.filter((task) => task.status === status).length})
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filteredTasks.map((task) => {
          const overdue =
            task.status === "Pendente" &&
            task.due_date < new Date().toLocaleDateString("en-CA");
          return (
            <article
              key={task.id}
              className={`rounded-xl border p-4 ${overdue ? "border-rose-200 bg-rose-50/40" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{task.title}</p>
                  <p className="text-sm text-slate-500">
                    {task.pets?.nome || "Pet"} · {task.task_type}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${task.priority === "Alta" ? "bg-rose-100 text-rose-700" : task.priority === "Baixa" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}
                >
                  {task.priority}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/70 p-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Prazo</p>
                  <p className="font-medium">{formatDate(task.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Responsável</p>
                  <p className="truncate font-medium">
                    {task.assigned_to || "Não definido"}
                  </p>
                </div>
              </div>
              {task.notes && (
                <p className="mt-3 text-sm text-slate-600">{task.notes}</p>
              )}
              <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2">
                <button
                  type="button"
                  disabled={workingId === task.id}
                  onClick={() => toggleTask(task)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500 px-3 py-2 text-sm font-medium text-emerald-700 disabled:opacity-50"
                >
                  {task.status === "Concluída" ? (
                    <RotateCcw size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {task.status === "Concluída" ? "Reabrir" : "Concluir"}
                </button>
                <Link
                  href={`/pets/${task.pet_id}`}
                  className="rounded-xl border border-[#8A0EEA] px-3 py-2 text-center text-sm font-medium text-[#8A0EEA]"
                >
                  Prontuário
                </Link>
                <button
                  type="button"
                  disabled={workingId === task.id}
                  onClick={() => removeTask(task.id)}
                  aria-label="Excluir tarefa"
                  className="rounded-xl border px-3 py-2 text-rose-600 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
        {filteredTasks.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500 lg:col-span-2">
            Nenhuma tarefa {filter.toLowerCase()}.
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
