"use client";

import {
  AlertTriangle,
  BellRing,
  Pencil,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  ClinicalPatientAlert,
  ClinicalPatientAlertInput,
  ClinicalPatientAlertSeverity,
  ClinicalPatientAlertType,
} from "@/types/domain";

const alertTypes: ClinicalPatientAlertType[] = [
  "Alergia",
  "Doença crônica",
  "Medicação contínua",
  "Cuidado especial",
  "Outro",
];

const severities: ClinicalPatientAlertSeverity[] = [
  "Informativo",
  "Atenção",
  "Crítico",
];

export function PatientAlertsPanel({
  petId,
  alerts,
  onCreate,
  onUpdate,
  onActiveChange,
}: {
  petId: number;
  alerts: ClinicalPatientAlert[];
  onCreate: (input: ClinicalPatientAlertInput) => Promise<boolean>;
  onUpdate: (id: number, input: ClinicalPatientAlertInput) => Promise<boolean>;
  onActiveChange: (id: number, active: boolean) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<ClinicalPatientAlert | null>(null);
  const [alertType, setAlertType] =
    useState<ClinicalPatientAlertType>("Alergia");
  const [severity, setSeverity] =
    useState<ClinicalPatientAlertSeverity>("Atenção");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const activeAlerts = alerts.filter((alert) => alert.active);
  const inactiveAlerts = alerts.filter((alert) => !alert.active);

  function startCreate() {
    setEditing(null);
    setAlertType("Alergia");
    setSeverity("Atenção");
    setTitle("");
    setDetails("");
    setOpen(true);
  }

  function startEdit(alert: ClinicalPatientAlert) {
    setEditing(alert);
    setAlertType(alert.alert_type);
    setSeverity(alert.severity);
    setTitle(alert.title);
    setDetails(alert.details || "");
    setOpen(true);
  }

  async function save() {
    if (title.trim().length < 2) {
      toast.error("Informe um título para o alerta.");
      return;
    }

    setSaving(true);
    const input: ClinicalPatientAlertInput = {
      petId,
      alertType,
      severity,
      title: title.trim(),
      details: details.trim(),
    };
    const success = editing
      ? await onUpdate(editing.id, input)
      : await onCreate(input);
    setSaving(false);
    if (success) setOpen(false);
  }

  return (
    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${activeAlerts.some((alert) => alert.severity === "Crítico") ? "border-red-300 bg-red-50/60" : "border-amber-200 bg-amber-50/40"}`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldAlert size={19} className="text-red-600" /> Alertas clínicos
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Informações permanentes que precisam ser vistas antes do
            atendimento.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 text-sm font-semibold text-white"
        >
          <Plus size={17} /> Novo alerta
        </button>
      </div>

      {activeAlerts.length === 0 ? (
        <p className="border-t border-amber-100 bg-white/70 p-4 text-sm text-slate-500">
          Nenhum alerta clínico ativo para este paciente.
        </p>
      ) : (
        <div className="grid gap-3 border-t border-amber-100 bg-white/60 p-4 lg:grid-cols-2">
          {activeAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onEdit={() => startEdit(alert)}
              onToggle={() => void onActiveChange(alert.id, false)}
            />
          ))}
        </div>
      )}

      {inactiveAlerts.length > 0 && (
        <div className="border-t border-amber-100 bg-white/70 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowInactive((current) => !current)}
            className="text-sm font-semibold text-slate-600"
          >
            {showInactive
              ? "Ocultar alertas inativos"
              : `Ver alertas inativos (${inactiveAlerts.length})`}
          </button>
          {showInactive && (
            <div className="mt-3 grid gap-3 opacity-70 lg:grid-cols-2">
              {inactiveAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onEdit={() => startEdit(alert)}
                  onToggle={() => void onActiveChange(alert.id, true)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="erp-modal-overlay" role="dialog" aria-modal="true">
          <div className="erp-modal-panel max-w-xl">
            <h2 className="text-xl font-bold">
              {editing ? "Editar alerta clínico" : "Novo alerta clínico"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use alertas críticos apenas para riscos que precisam chamar
              atenção imediata.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Tipo
                <select
                  value={alertType}
                  onChange={(event) =>
                    setAlertType(event.target.value as ClinicalPatientAlertType)
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  {alertTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Gravidade
                <select
                  value={severity}
                  onChange={(event) =>
                    setSeverity(
                      event.target.value as ClinicalPatientAlertSeverity,
                    )
                  }
                  className="rounded-xl border p-3 font-normal"
                >
                  {severities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Título
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ex.: Alergia grave a dipirona"
                  maxLength={120}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Detalhes e conduta
                <textarea
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Descreva reação, dose contínua ou cuidado necessário."
                  rows={4}
                  className="resize-y rounded-xl border p-3 font-normal"
                />
              </label>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-xl border font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="min-h-11 rounded-xl bg-[#8A0EEA] font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alerta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AlertCard({
  alert,
  onEdit,
  onToggle,
}: {
  alert: ClinicalPatientAlert;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const critical = alert.severity === "Crítico";
  const informative = alert.severity === "Informativo";
  return (
    <article
      className={`rounded-xl border p-3 ${critical ? "border-red-300 bg-red-50" : informative ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${critical ? "text-red-700" : informative ? "text-blue-700" : "text-amber-700"}`}
          >
            {critical ? <BellRing size={15} /> : <AlertTriangle size={15} />}
            {alert.alert_type} · {alert.severity}
          </p>
          <h3 className="mt-1 font-bold text-slate-900">{alert.title}</h3>
          {alert.details && (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
              {alert.details}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar alerta ${alert.title}`}
          className="rounded-lg bg-white p-2 text-slate-600 shadow-sm"
        >
          <Pencil size={15} />
        </button>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="mt-3 text-xs font-semibold text-slate-600 underline"
      >
        {alert.active ? "Marcar como inativo" : "Reativar alerta"}
      </button>
    </article>
  );
}
