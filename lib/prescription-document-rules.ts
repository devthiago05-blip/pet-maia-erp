import type {
  ClinicalPrescription,
  ClinicalPrescriptionDocument,
  ClinicalRecord,
  Pet,
} from "@/types/domain";

interface PrescriptionRuleContext {
  document?: ClinicalPrescriptionDocument;
  pet?: Pet;
  record?: ClinicalRecord;
  prescriptions: ClinicalPrescription[];
}

interface PrescriptionRuleSummary {
  critical: string[];
  warnings: string[];
}

export function getPrescriptionDocumentRuleSummary({
  document,
  pet,
  record,
  prescriptions,
}: PrescriptionRuleContext): PrescriptionRuleSummary {
  const critical = new Set<string>();
  const warnings = new Set<string>();
  const professionalCrmv =
    document?.professional_crmv?.trim() || record?.professional_crmv?.trim();
  const professionalName =
    document?.professional_name?.trim() || record?.professional_name?.trim();

  if (prescriptions.length === 0) {
    critical.add("Inclua pelo menos um item antes de emitir a receita.");
  }

  if (!professionalName) {
    critical.add("Informe o profissional responsavel pela receita.");
  }

  if (document?.status === "emitida" && !professionalCrmv) {
    critical.add("Receita emitida sem CRMV do profissional.");
  }

  if (
    document?.status === "emitida" &&
    professionalCrmv &&
    !document.professional_crmv_state?.trim()
  ) {
    warnings.add("UF do CRMV nao consta no historico da emissao.");
  }

  if (pet && !pet.tutors?.nome?.trim()) {
    warnings.add("Responsavel do animal nao informado.");
  }

  if (pet && !pet.tutors?.endereco?.trim()) {
    warnings.add("Endereco do responsavel nao informado.");
  }

  prescriptions.forEach((item) => {
    const label = item.medication || "Item sem nome";

    if (!item.medication?.trim()) {
      critical.add("Existe item sem medicamento ou formula informado.");
    }

    if (!item.dosage?.trim()) {
      critical.add(`${label}: informe a dose.`);
    }

    if (!item.frequency?.trim()) {
      critical.add(`${label}: informe a frequencia.`);
    }

    if (!item.administration_route?.trim()) {
      critical.add(`${label}: informe a via de administracao.`);
    }

    if (
      item.prescription_type !== "simples" &&
      (item.quantity == null || !item.quantity_unit?.trim())
    ) {
      critical.add(`${label}: informe quantidade e unidade.`);
    }

    if (item.prescription_type === "antimicrobiano" && !item.duration?.trim()) {
      critical.add(`${label}: antimicrobiano precisa de duracao.`);
    }

    if (
      item.prescription_type === "controle_especial" &&
      item.pharmacy_type === "manipulacao" &&
      !item.pharmaceutical_form?.trim()
    ) {
      warnings.add(`${label}: informe forma farmaceutica quando aplicavel.`);
    }

    if (item.item_type === "manipulado") {
      const hasFormulaComponents =
        item.prescription_formula_components?.some(
          (component) =>
            component.component_name?.trim() && component.concentration?.trim(),
        ) || false;

      if (!item.composition?.trim() && !hasFormulaComponents) {
        critical.add(`${label}: formula manipulada sem composicao.`);
      }
    }
  });

  return {
    critical: Array.from(critical),
    warnings: Array.from(warnings),
  };
}
