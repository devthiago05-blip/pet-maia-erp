"use client";

import { Archive, Pencil, Plus, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useMountEffect } from "@/hooks/useMountEffect";
import {
  archiveMedicationCatalogItem,
  createMedicationCatalogItem,
  fetchMedicationCatalog,
  updateMedicationCatalogItem,
} from "@/services/clinical";
import type {
  MedicationCatalogInput,
  MedicationCatalogItem,
  PrescriptionPharmacyType,
} from "@/types/domain";

const initialForm: MedicationCatalogInput = {
  name: "",
  activeIngredient: "",
  defaultPharmacyType: "veterinaria",
  defaultPharmaceuticalForm: "",
  defaultAdministrationRoute: "Oral",
  notes: "",
  isFavorite: false,
};

const pharmacyOptions: Array<{
  value: PrescriptionPharmacyType;
  label: string;
}> = [
  { value: "veterinaria", label: "Veterinaria" },
  { value: "humana", label: "Humana" },
  { value: "manipulacao", label: "Manipulacao" },
];

const routeOptions = [
  "Oral",
  "Topico",
  "Ocular",
  "Otologico",
  "Subcutaneo",
  "Intramuscular",
  "Intravenoso",
  "Inalatorio",
  "Retal",
];

const formOptions = [
  "Comprimido",
  "Capsula",
  "Solucao oral",
  "Suspensao",
  "Gotas",
  "Xarope",
  "Pomada",
  "Creme",
  "Gel",
  "Spray",
  "Injetavel",
];

export function ClinicalCatalogManager() {
  const [catalog, setCatalog] = useState<MedicationCatalogItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<MedicationCatalogInput>(initialForm);
  const [editingId, setEditingId] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useMountEffect(() => {
    loadCatalog();
  });

  const filteredCatalog = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return catalog.filter(
      (item) =>
        !term ||
        `${item.name} ${item.active_ingredient || ""}`
          .toLocaleLowerCase("pt-BR")
          .includes(term),
    );
  }, [catalog, search]);

  async function loadCatalog() {
    setLoading(true);
    const { data, error } = await fetchMedicationCatalog();

    if (error) {
      toast.error("Nao foi possivel carregar o catalogo de medicamentos");
      setLoading(false);
      return;
    }

    setCatalog((data || []) as MedicationCatalogItem[]);
    setLoading(false);
  }

  function updateForm<T extends keyof MedicationCatalogInput>(
    key: T,
    value: MedicationCatalogInput[T],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEditing(item: MedicationCatalogItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      activeIngredient: item.active_ingredient || "",
      defaultPharmacyType: item.default_pharmacy_type || "veterinaria",
      defaultPharmaceuticalForm: item.default_pharmaceutical_form || "",
      defaultAdministrationRoute: item.default_administration_route || "Oral",
      notes: item.notes || "",
      isFavorite: item.is_favorite,
    });
  }

  function resetForm() {
    setEditingId(undefined);
    setForm(initialForm);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do medicamento");
      return;
    }

    setSaving(true);
    const response = editingId
      ? await updateMedicationCatalogItem(editingId, form)
      : await createMedicationCatalogItem(form);

    if (response.error) {
      toast.error(response.error.message);
      setSaving(false);
      return;
    }

    toast.success(editingId ? "Medicamento atualizado" : "Medicamento salvo");
    resetForm();
    await loadCatalog();
    setSaving(false);
  }

  async function handleArchive(id: number) {
    const { error } = await archiveMedicationCatalogItem(id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Medicamento arquivado");
    if (editingId === id) resetForm();
    await loadCatalog();
  }

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Catalogo da clinica</h2>
          <p className="text-sm text-slate-500">
            Medicamentos, favoritos e valores padrao usados no receituario.
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 px-3 py-2 text-sm font-medium text-[#8A0EEA]">
          {catalog.length} ativo(s)
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0 rounded-xl border p-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar medicamento ou principio ativo"
            className="w-full rounded-xl border px-3 py-2 outline-none"
          />

          <div className="mt-3 max-h-96 divide-y overflow-y-auto">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">
                Carregando catalogo...
              </p>
            ) : filteredCatalog.length > 0 ? (
              filteredCatalog.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {item.is_favorite && (
                        <Star
                          size={16}
                          className="fill-amber-400 text-amber-400"
                        />
                      )}
                      <h3 className="truncate font-semibold">{item.name}</h3>
                    </div>
                    <p className="truncate text-sm text-slate-500">
                      {item.active_ingredient ||
                        "Principio ativo nao informado"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.default_pharmacy_type || "farmacia nao informada"} -{" "}
                      {item.default_administration_route || "via nao informada"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-[#8A0EEA]"
                    >
                      <Pencil size={15} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(item.id)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium text-slate-600"
                    >
                      <Archive size={15} />
                      Arquivar
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-4 text-sm text-slate-500">
                Nenhum medicamento encontrado.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <h3 className="font-semibold">
            {editingId ? "Editar medicamento" : "Novo medicamento"}
          </h3>
          <div className="mt-3 grid gap-3">
            <CatalogInput
              label="Nome"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
            />
            <CatalogInput
              label="Principio ativo"
              value={form.activeIngredient || ""}
              onChange={(value) => updateForm("activeIngredient", value)}
            />
            <label className="grid gap-2 text-sm font-medium">
              Farmacia padrao
              <select
                value={form.defaultPharmacyType || "veterinaria"}
                onChange={(event) =>
                  updateForm(
                    "defaultPharmacyType",
                    event.target.value as PrescriptionPharmacyType,
                  )
                }
                className="rounded-xl border p-3 font-normal"
              >
                {pharmacyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Forma padrao
              <select
                value={form.defaultPharmaceuticalForm || ""}
                onChange={(event) =>
                  updateForm("defaultPharmaceuticalForm", event.target.value)
                }
                className="rounded-xl border p-3 font-normal"
              >
                <option value="">Sem padrao</option>
                {formOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Via padrao
              <select
                value={form.defaultAdministrationRoute || "Oral"}
                onChange={(event) =>
                  updateForm("defaultAdministrationRoute", event.target.value)
                }
                className="rounded-xl border p-3 font-normal"
              >
                {routeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={Boolean(form.isFavorite)}
                onChange={(event) =>
                  updateForm("isFavorite", event.target.checked)
                }
              />
              Favorito no receituario
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Observacoes
              <textarea
                rows={3}
                value={form.notes || ""}
                onChange={(event) => updateForm("notes", event.target.value)}
                className="resize-y rounded-xl border p-3 font-normal"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white disabled:opacity-50"
              >
                <Plus size={17} />
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border px-4 py-2 font-medium"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CatalogInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border p-3 font-normal"
      />
    </label>
  );
}
