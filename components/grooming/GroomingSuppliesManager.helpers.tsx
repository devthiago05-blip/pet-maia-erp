"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import type {
  GroomingEquipmentServiceType,
  GroomingEquipmentStatus,
  GroomingEquipmentType,
  GroomingSupplyMovementType,
} from "@/types/domain";

export type ActiveTab =
  | "insumos"
  | "movimentos"
  | "diarias"
  | "equipamentos"
  | "alertas";

export const supplyCategories = [
  "Shampoo",
  "Condicionador",
  "Perfume",
  "Hidratante",
  "Algodão",
  "Ouvido",
  "Laço",
  "Bandana",
  "Lâmina",
  "Higiene",
  "Limpeza",
  "Geral",
];

export const unitOptions = [
  "unidade",
  "mL",
  "litro",
  "g",
  "kg",
  "pacote",
  "caixa",
  "rolo",
  "frasco",
];

export const movementTypeLabels: Record<GroomingSupplyMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  descarte: "Descarte",
  vencido: "Produto vencido",
  perda: "Perda",
  ajuste_positivo: "Ajuste positivo",
  ajuste_negativo: "Ajuste negativo",
};

export const equipmentTypes: GroomingEquipmentType[] = [
  "Secador",
  "Lâmina",
  "Máquina",
  "Tesoura",
  "Outro",
];

export const equipmentStatuses: GroomingEquipmentStatus[] = [
  "Em uso",
  "Em manutenção",
  "Enviado para afiação",
  "Baixado",
];

export const equipmentServiceTypes: GroomingEquipmentServiceType[] = [
  "Afiação",
  "Manutenção",
  "Conserto",
  "Limpeza",
  "Outro",
];

export function SummaryCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        alert ? "border-amber-200 bg-amber-50" : "bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function FormCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4 grid min-w-0 gap-3">{children}</div>
    </div>
  );
}

export function DataCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4 min-w-0">{children}</div>
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  inputMode?: "decimal";
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full min-w-0 rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-xl border p-3 font-normal"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 resize-y rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

export function AlertPanel({
  title,
  description,
  emptyMessage,
  items,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  items: Array<{
    id: number;
    title: string;
    description: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <p className="font-semibold text-slate-800">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function GroomingSetupPanel() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-2 text-amber-700">
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-amber-950">
              Instalação do módulo pendente no Supabase
            </h3>
            <p className="text-sm text-amber-900">
              Execute os SQLs de insumos no Supabase antes de usar esta tela em
              produção.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-amber-950">
            <li>supabase/sql/023_grooming_supplies.sql</li>
            <li>supabase/sql/025_grooming_financial_rls.sql</li>
            <li>supabase/sql/026_grooming_supply_invoice_reference.sql</li>
            <li>supabase/sql/027_delete_grooming_supply_movement.sql</li>
          </ol>
          <p className="text-xs text-amber-800">
            O guia completo está em docs/EXECUTAR_SQL_GROOMING_SUPABASE.md.
          </p>
        </div>
      </div>
    </div>
  );
}

export function isMissingGroomingSchemaError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  );
}

export function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getDateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateLabel(value?: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}
