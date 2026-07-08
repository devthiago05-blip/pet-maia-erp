"use client";

import { Beaker, Package, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

import type {
  ClinicalPrescription,
  NewClinicalPrescriptionInput,
  PrescriptionItemType,
  PrescriptionPharmacyType,
  PrescriptionType,
} from "@/types/domain";

const medicationOptions = [
  "Amoxicilina",
  "Amoxicilina + clavulanato",
  "Cefalexina",
  "Doxiciclina",
  "Enrofloxacino",
  "Meloxicam",
  "Prednisolona",
  "Dipirona",
  "Omeprazol",
  "Ondansetrona",
  "Metronidazol",
  "Outro medicamento",
];

const frequencyOptions = [
  "A cada 4 horas",
  "A cada 6 horas",
  "A cada 8 horas",
  "A cada 12 horas",
  "A cada 24 horas",
  "Uma vez ao dia",
  "Conforme necessidade",
];

const routeOptions = [
  "Oral",
  "Tópico",
  "Ocular",
  "Otológico",
  "Subcutâneo",
  "Intramuscular",
  "Intravenoso",
  "Inalatório",
  "Retal",
];

const unitOptions = [
  "unidade",
  "comprimido",
  "cápsula",
  "frasco",
  "ampola",
  "sachê",
  "mL",
  "g",
];

const formOptions = [
  "Comprimido",
  "Cápsula",
  "Solução oral",
  "Suspensão",
  "Gotas",
  "Xarope",
  "Pomada",
  "Creme",
  "Gel",
  "Spray",
  "Injetável",
];

const prescriptionTypeLabels: Record<PrescriptionType, string> = {
  simples: "Receita simples",
  controle_especial: "Controle especial",
  antimicrobiano: "Antimicrobiano",
};

export function PrescriptionModal({
  clinicalRecordId,
  onSave,
  prescription,
}: {
  clinicalRecordId: number;
  onSave: (prescription: NewClinicalPrescriptionInput) => Promise<void>;
  prescription?: ClinicalPrescription;
}) {
  const [open, setOpen] = useState(false);
  const inferredItemType =
    prescription?.item_type ||
    (/manipulad|f[oó]rmula magistral/i.test(prescription?.medication || "")
      ? "manipulado"
      : "industrializado");
  const knownMedication = medicationOptions.includes(
    prescription?.medication || "",
  );
  const [itemType, setItemType] =
    useState<PrescriptionItemType>(inferredItemType);
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>(
    prescription?.prescription_type || "simples",
  );
  const [medication, setMedication] = useState(
    prescription && inferredItemType === "industrializado"
      ? knownMedication
        ? prescription.medication
        : "Outro medicamento"
      : "",
  );
  const [customMedication, setCustomMedication] = useState(
    prescription && (!knownMedication || inferredItemType === "manipulado")
      ? prescription.medication
      : "",
  );
  const [dosage, setDosage] = useState(prescription?.dosage || "");
  const [frequency, setFrequency] = useState(prescription?.frequency || "");
  const [duration, setDuration] = useState(prescription?.duration || "");
  const [instructions, setInstructions] = useState(
    prescription?.instructions || "",
  );
  const [pharmacyType, setPharmacyType] = useState<PrescriptionPharmacyType>(
    prescription?.pharmacy_type ||
      (inferredItemType === "manipulado" ? "manipulacao" : "veterinaria"),
  );
  const [administrationRoute, setAdministrationRoute] = useState(
    prescription?.administration_route || "Oral",
  );
  const [quantity, setQuantity] = useState(
    prescription?.quantity ? String(prescription.quantity) : "1",
  );
  const [quantityUnit, setQuantityUnit] = useState(
    prescription?.quantity_unit || "unidade",
  );
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState(
    prescription?.pharmaceutical_form || "",
  );
  const [composition, setComposition] = useState(
    prescription?.composition || "",
  );
  const [saving, setSaving] = useState(false);

  const selectedMedication =
    itemType === "manipulado"
      ? customMedication
      : medication === "Outro medicamento"
        ? customMedication
        : medication;

  function changeItemType(value: PrescriptionItemType) {
    setItemType(value);
    setPharmacyType(value === "manipulado" ? "manipulacao" : "veterinaria");
    if (value === "manipulado") setMedication("");
  }

  async function handleSave() {
    const numericQuantity = Number(quantity.replace(",", "."));

    if (!selectedMedication.trim() || !dosage.trim() || !frequency.trim()) {
      toast.error("Informe medicamento ou fórmula, dose e frequência");
      return;
    }

    if (!numericQuantity || !quantityUnit.trim()) {
      toast.error("Informe a quantidade e a unidade");
      return;
    }

    if (itemType === "manipulado" && !composition.trim()) {
      toast.error("Informe a composição da fórmula manipulada");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: prescription?.id,
        clinicalRecordId,
        medication: selectedMedication.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        instructions: instructions.trim(),
        itemType,
        prescriptionType,
        pharmacyType,
        administrationRoute: administrationRoute.trim(),
        quantity: numericQuantity,
        quantityUnit: quantityUnit.trim(),
        pharmaceuticalForm: pharmaceuticalForm.trim(),
        composition: composition.trim(),
      });
      setOpen(false);
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium text-[#8A0EEA]"
      >
        {prescription ? "Editar" : "Adicionar prescrição"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-2 sm:items-center sm:p-4">
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-y-auto rounded-lg bg-white sm:max-h-[calc(100dvh-2rem)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {prescription ? "Editar prescrição" : "Nova prescrição"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Monte o item e revise o resumo antes de salvar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar prescrição"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-4 sm:p-6">
              <fieldset>
                <legend className="text-sm font-semibold">
                  Medicamento ou produto
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  <TypeButton
                    active={itemType === "industrializado"}
                    icon={<Package size={17} />}
                    label="Industrializado"
                    onClick={() => changeItemType("industrializado")}
                  />
                  <TypeButton
                    active={itemType === "manipulado"}
                    icon={<Beaker size={17} />}
                    label="Manipulado"
                    onClick={() => changeItemType("manipulado")}
                  />
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Tipo de receita
                  <select
                    value={prescriptionType}
                    onChange={(event) =>
                      setPrescriptionType(
                        event.target.value as PrescriptionType,
                      )
                    }
                    className="rounded-lg border p-3 font-normal"
                  >
                    {Object.entries(prescriptionTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Farmácia
                  <select
                    value={pharmacyType}
                    onChange={(event) =>
                      setPharmacyType(
                        event.target.value as PrescriptionPharmacyType,
                      )
                    }
                    className="rounded-lg border p-3 font-normal"
                  >
                    <option value="veterinaria">Veterinária</option>
                    <option value="humana">Humana</option>
                    <option value="manipulacao">Manipulação</option>
                  </select>
                </label>

                {itemType === "industrializado" ? (
                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                    Medicamento
                    <select
                      value={medication}
                      onChange={(event) => setMedication(event.target.value)}
                      className="rounded-lg border p-3 font-normal"
                    >
                      <option value="">Selecione</option>
                      {medicationOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <PrescriptionInput
                    label="Nome da fórmula"
                    value={customMedication}
                    onChange={setCustomMedication}
                    className="sm:col-span-2"
                    placeholder="Ex.: Fórmula dermatológica"
                  />
                )}

                {itemType === "industrializado" &&
                  medication === "Outro medicamento" && (
                    <PrescriptionInput
                      label="Nome do medicamento"
                      value={customMedication}
                      onChange={setCustomMedication}
                      className="sm:col-span-2"
                    />
                  )}

                {itemType === "manipulado" && (
                  <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                    Composição da fórmula
                    <textarea
                      rows={4}
                      value={composition}
                      onChange={(event) => setComposition(event.target.value)}
                      placeholder="Um componente por linha, com sua concentração"
                      className="resize-y rounded-lg border p-3 font-normal"
                    />
                  </label>
                )}

                <label className="grid gap-2 text-sm font-medium">
                  Forma farmacêutica
                  <input
                    list="prescription-forms"
                    value={pharmaceuticalForm}
                    onChange={(event) =>
                      setPharmaceuticalForm(event.target.value)
                    }
                    placeholder="Ex.: Comprimido"
                    className="rounded-lg border p-3 font-normal"
                  />
                  <datalist id="prescription-forms">
                    {formOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Via de administração
                  <input
                    list="prescription-routes"
                    value={administrationRoute}
                    onChange={(event) =>
                      setAdministrationRoute(event.target.value)
                    }
                    className="rounded-lg border p-3 font-normal"
                  />
                  <datalist id="prescription-routes">
                    {routeOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <PrescriptionInput
                  label="Dose"
                  value={dosage}
                  onChange={setDosage}
                  placeholder="Ex.: 1/2 comprimido"
                />

                <label className="grid gap-2 text-sm font-medium">
                  Frequência
                  <input
                    list="prescription-frequencies"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                    placeholder="Ex.: A cada 12 horas"
                    className="rounded-lg border p-3 font-normal"
                  />
                  <datalist id="prescription-frequencies">
                    {frequencyOptions.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </label>

                <PrescriptionInput
                  label="Duração"
                  value={duration}
                  onChange={setDuration}
                  placeholder="Ex.: 7 dias"
                />

                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-3">
                  <PrescriptionInput
                    label="Quantidade"
                    value={quantity}
                    onChange={setQuantity}
                    inputMode="decimal"
                  />
                  <label className="grid gap-2 text-sm font-medium">
                    Unidade
                    <input
                      list="prescription-units"
                      value={quantityUnit}
                      onChange={(event) => setQuantityUnit(event.target.value)}
                      className="min-w-0 rounded-lg border p-3 font-normal"
                    />
                    <datalist id="prescription-units">
                      {unitOptions.map((option) => (
                        <option key={option} value={option} />
                      ))}
                    </datalist>
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Orientações adicionais
                  <textarea
                    rows={3}
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    placeholder="Ex.: Administrar após alimentação"
                    className="resize-y rounded-lg border p-3 font-normal"
                  />
                </label>
              </div>

              <section className="rounded-lg border bg-slate-50 p-4">
                <p className="text-xs font-bold tracking-wide text-[#8A0EEA] uppercase">
                  Prévia do item
                </p>
                <p className="mt-3 font-semibold">
                  {selectedMedication || "Medicamento não informado"}
                  {pharmaceuticalForm ? ` · ${pharmaceuticalForm}` : ""}
                </p>
                {composition && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {composition}
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-600">
                  {[dosage, frequency, duration].filter(Boolean).join(" · ") ||
                    "Posologia não informada"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {prescriptionTypeLabels[prescriptionType]} · Farmácia{" "}
                  {pharmacyType === "veterinaria"
                    ? "veterinária"
                    : pharmacyType === "humana"
                      ? "humana"
                      : "de manipulação"}
                  {administrationRoute ? ` · Via ${administrationRoute}` : ""}
                  {quantity && quantityUnit
                    ? ` · ${quantity} ${quantityUnit}`
                    : ""}
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 grid gap-3 border-t bg-white p-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border py-2.5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#8A0EEA] py-2.5 text-white disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : prescription
                    ? "Salvar alterações"
                    : "Adicionar à receita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TypeButton({
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
      className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold sm:text-sm ${
        active ? "bg-white text-[#8A0EEA] shadow-sm" : "text-slate-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PrescriptionInput({
  label,
  value,
  onChange,
  className = "",
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  inputMode?: "decimal";
}) {
  return (
    <label className={`grid gap-2 text-sm font-medium ${className}`}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-w-0 rounded-lg border p-3 font-normal"
      />
    </label>
  );
}
