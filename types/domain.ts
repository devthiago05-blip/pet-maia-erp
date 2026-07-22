import type { AccessModule } from "@/lib/access-control";

export interface UserPermission {
  module: AccessModule;
  can_access: boolean;
}

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  is_admin: boolean;
  max_discount_percent?: number;
  created_at?: string;
  crmv?: string;
  especialidade?: string;
  crmv_state?: string;
  mapa_registration?: string;
  signature_text?: string;
  user_permissions?: UserPermission[];
}

export interface ClinicSettings {
  id: number;
  nome: string;
  razao_social?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  pix_key?: string;
  pix_recipient_name?: string;
  pix_city?: string;
  inscricao_estadual?: string;
  uf?: string;
  codigo_municipio_ibge?: string;
  regime_tributario?: string;
  fiscal_environment?: "homologacao" | "producao";
  nfce_series?: number;
  nfce_next_number?: number;
  updated_at?: string;
}

export interface Tutor {
  id: number;
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  pets?: number;
}

export interface Pet {
  id: number;
  nome: string;
  especie: string;
  raca: string;
  porte?: string;
  sexo?: string;
  idade?: string;
  photo_url?: string | null;
  tutor_id?: number;
  bath_reminder_interval_days?: number | null;
  bath_reminder_dismissed_until?: string | null;
  created_at?: string;
  tutors?: {
    nome: string;
    telefone?: string;
    email?: string;
    endereco?: string;
  };
}

export interface ClinicalRecord {
  id: number;
  pet_id: number;
  professional_id?: string;
  professional_name: string;
  professional_crmv?: string;
  consultation_date: string;
  weight_kg?: number;
  temperature_c?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  mucous_membranes?: string;
  hydration_status?: string;
  pain_score?: number;
  main_complaint: string;
  anamnesis?: string;
  allergies?: string;
  current_medications?: string;
  diagnosis?: string;
  conduct?: string;
  return_date?: string;
  reminder_status?: "Pendente" | "Confirmado";
  reminder_confirmed_at?: string;
  created_at: string;
  clinical_prescriptions?: ClinicalPrescription[];
  clinical_prescription_documents?: ClinicalPrescriptionDocument[];
}

export interface ClinicalPrescriptionDocument {
  id: number;
  clinical_record_id: number;
  pet_id: number;
  issue_date: string;
  general_instructions?: string;
  status: "rascunho" | "emitida" | "cancelada";
  professional_id?: string;
  professional_name: string;
  professional_crmv?: string;
  issued_at?: string;
  created_at: string;
  updated_at: string;
  professional_crmv_state?: string;
  professional_mapa_registration?: string;
  signature_text?: string;
  share_token?: string;
  share_enabled: boolean;
  reissue_count: number;
  last_reissued_at?: string;
  clinical_prescription_reissues?: ClinicalPrescriptionReissue[];
  clinical_prescriptions?: ClinicalPrescription[];
}

export interface ClinicalPrescriptionReissue {
  id: number;
  prescription_document_id: number;
  previous_share_token?: string;
  new_share_token: string;
  reason?: string;
  reissued_by?: string;
  reissued_at: string;
}

export interface ClinicalPrescription {
  id: number;
  clinical_record_id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  item_type: PrescriptionItemType;
  prescription_type: PrescriptionType;
  pharmacy_type?: PrescriptionPharmacyType;
  administration_route?: string;
  quantity?: number;
  quantity_unit?: string;
  pharmaceutical_form?: string;
  composition?: string;
  prescription_document_id?: number;
  prescription_formula_components?: PrescriptionFormulaComponent[];
  created_at: string;
}

export interface PrescriptionFormulaComponent {
  id?: number;
  clinical_prescription_id?: number;
  component_name: string;
  concentration: string;
  unit?: string;
  sort_order: number;
}

export interface MedicationCatalogItem {
  id: number;
  name: string;
  active_ingredient?: string;
  default_pharmacy_type?: PrescriptionPharmacyType;
  default_pharmaceutical_form?: string;
  default_administration_route?: string;
  notes?: string;
  is_favorite: boolean;
  is_active: boolean;
}

export interface MedicationCatalogInput {
  name: string;
  activeIngredient?: string;
  defaultPharmacyType?: PrescriptionPharmacyType;
  defaultPharmaceuticalForm?: string;
  defaultAdministrationRoute?: string;
  notes?: string;
  isFavorite?: boolean;
}

export interface MedicationDosageTemplate {
  id: number;
  medication_id: number;
  name: string;
  species?: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export type PrescriptionItemType = "industrializado" | "manipulado";
export type PrescriptionType =
  | "simples"
  | "controle_especial"
  | "antimicrobiano";
export type PrescriptionPharmacyType = "veterinaria" | "humana" | "manipulacao";

export interface NewClinicalRecordInput {
  id?: number;
  petId: number;
  professionalName: string;
  consultationDate: string;
  weightKg?: number;
  temperatureC?: number;
  heartRate?: number;
  respiratoryRate?: number;
  mucousMembranes?: string;
  hydrationStatus?: string;
  painScore?: number;
  mainComplaint: string;
  anamnesis?: string;
  allergies?: string;
  currentMedications?: string;
  diagnosis?: string;
  conduct?: string;
  returnDate?: string;
}

export interface NewClinicalPrescriptionInput {
  id?: number;
  clinicalRecordId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  itemType: PrescriptionItemType;
  prescriptionType: PrescriptionType;
  pharmacyType?: PrescriptionPharmacyType;
  administrationRoute?: string;
  quantity?: number;
  quantityUnit?: string;
  pharmaceuticalForm?: string;
  composition?: string;
  prescriptionDocumentId?: number;
  formulaComponents?: Array<{
    componentName: string;
    concentration: string;
    unit?: string;
  }>;
}

export interface PetVaccination {
  id: number;
  pet_id: number;
  vaccine_name: string;
  manufacturer?: string;
  batch_number?: string;
  application_date: string;
  next_dose_date?: string;
  reminder_status?: "Pendente" | "Confirmado";
  reminder_confirmed_at?: string;
  professional_name: string;
  notes?: string;
  created_at: string;
}

export interface NewPetVaccinationInput {
  petId: number;
  vaccineName: string;
  manufacturer?: string;
  batchNumber?: string;
  applicationDate: string;
  nextDoseDate?: string;
  professionalName: string;
  notes?: string;
}

export interface PetParasitePrevention {
  id: number;
  pet_id: number;
  prevention_type:
    | "Vermífugo"
    | "Antipulgas"
    | "Carrapatos"
    | "Antipulgas e carrapatos"
    | "Outro";
  product_name: string;
  application_date: string;
  next_application_date?: string;
  dose?: string;
  weight_kg?: number;
  batch_number?: string;
  professional_name: string;
  notes?: string;
  created_at: string;
}

export interface NewPetParasitePreventionInput {
  petId: number;
  preventionType: PetParasitePrevention["prevention_type"];
  productName: string;
  applicationDate: string;
  nextApplicationDate?: string;
  dose?: string;
  weightKg?: number;
  batchNumber?: string;
  professionalName: string;
  notes?: string;
}

export interface ClinicPatientOverview extends Pet {
  lastClinicalRecord?: {
    consultation_date: string;
    professional_name: string;
  };
  nextReturnDate?: string;
  nextVaccinationDate?: string;
  clinicalRecords?: Array<
    Pick<
      ClinicalRecord,
      | "id"
      | "consultation_date"
      | "professional_name"
      | "return_date"
      | "reminder_status"
      | "reminder_confirmed_at"
    >
  >;
  vaccinationRecords?: Array<
    Pick<
      PetVaccination,
      | "id"
      | "vaccine_name"
      | "application_date"
      | "next_dose_date"
      | "professional_name"
      | "reminder_status"
      | "reminder_confirmed_at"
    >
  >;
  clinicalAlerts?: ClinicalPatientAlert[];
}

export type ClinicalPatientAlertType =
  | "Alergia"
  | "Doença crônica"
  | "Medicação contínua"
  | "Cuidado especial"
  | "Outro";

export type ClinicalPatientAlertSeverity =
  | "Informativo"
  | "Atenção"
  | "Crítico";

export interface ClinicalPatientAlert {
  id: number;
  pet_id: number;
  alert_type: ClinicalPatientAlertType;
  severity: ClinicalPatientAlertSeverity;
  title: string;
  details?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalPatientAlertInput {
  petId: number;
  alertType: ClinicalPatientAlertType;
  severity: ClinicalPatientAlertSeverity;
  title: string;
  details?: string;
}

export interface ClinicalTask {
  id: number;
  pet_id: number;
  task_type:
    | "Pós-operatório"
    | "Exame"
    | "Curativo"
    | "Medicação"
    | "Retorno"
    | "Outro";
  title: string;
  due_date: string;
  priority: "Baixa" | "Normal" | "Alta";
  assigned_to?: string;
  notes?: string;
  status: "Pendente" | "Concluída";
  completed_at?: string;
  created_at: string;
  pets?: {
    id: number;
    nome: string;
    tutors?: {
      nome: string;
      telefone?: string;
    };
  };
}

export interface ClinicalHospitalizationLog {
  id: number;
  hospitalization_id: number;
  log_type: "Evolução" | "Sinais vitais" | "Medicação" | "Alimentação";
  notes: string;
  temperature_c?: number;
  weight_kg?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  professional_name?: string;
  recorded_at: string;
}

export interface ClinicalHospitalization {
  id: number;
  pet_id: number;
  admission_at: string;
  discharge_at?: string;
  reason: string;
  veterinarian_name?: string;
  kennel?: string;
  status: "Internado" | "Alta";
  pets?: {
    id: number;
    nome: string;
    tutors?: { nome: string; telefone?: string };
  };
  clinical_hospitalization_logs?: ClinicalHospitalizationLog[];
  clinical_hospitalization_medications?: ClinicalHospitalizationMedication[];
}

export interface ClinicalHospitalizationMedication {
  id: number;
  hospitalization_id: number;
  medication: string;
  dose: string;
  route: string;
  scheduled_at: string;
  status: "Pendente" | "Administrado";
  administered_at?: string;
  administered_by?: string;
  notes?: string;
}

export interface ClinicalExam {
  id: number;
  pet_id: number;
  clinical_record_id?: number;
  exam_name: string;
  request_date: string;
  collection_date?: string;
  result_date?: string;
  laboratory?: string;
  status: "Solicitado" | "Coletado" | "Concluído" | "Cancelado";
  result?: string;
  notes?: string;
  professional_name: string;
  created_at: string;
  pets?: {
    id: number;
    nome: string;
    tutors?: { nome: string; telefone?: string };
  };
}

export interface ClinicalExamInput {
  id?: number;
  petId: number;
  examName: string;
  requestDate: string;
  collectionDate?: string;
  resultDate?: string;
  laboratory?: string;
  status: ClinicalExam["status"];
  result?: string;
  notes?: string;
  professionalName: string;
}

export interface ClinicalAttachment {
  id: number;
  pet_id: number;
  clinical_exam_id?: number;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by?: string;
  created_at: string;
}

export interface CrmInteraction {
  id: number;
  tutor_id: number;
  contact_date: string;
  channel: string;
  subject: string;
  notes?: string;
  next_action_date?: string;
  status: "Aberto" | "Concluído";
  responsible_name: string;
  created_at: string;
}

export interface CrmInteractionInput {
  tutorId: number;
  contactDate: string;
  channel: string;
  subject: string;
  notes?: string;
  nextActionDate?: string;
  status: CrmInteraction["status"];
  responsibleName: string;
}

export interface CrmTutor extends Omit<Tutor, "pets"> {
  pets?: Array<{ id: number; nome: string }>;
  crm_interactions?: CrmInteraction[];
}

export interface ClinicalDocument {
  id: number;
  pet_id: number;
  document_type: "Atestado" | "Declaração" | "Orientação";
  title: string;
  content: string;
  issue_date: string;
  professional_name: string;
  professional_crmv?: string;
  created_at: string;
}

export interface ClinicalDocumentInput {
  petId: number;
  documentType: ClinicalDocument["document_type"];
  title: string;
  content: string;
  issueDate: string;
  professionalName: string;
}

export interface ClinicalConsent {
  id: number;
  pet_id: number;
  clinical_record_id?: number;
  consent_type:
    | "Procedimento"
    | "Anestesia e cirurgia"
    | "Internação"
    | "Recusa de tratamento"
    | "Outro";
  title: string;
  content: string;
  signer_name: string;
  signer_document?: string;
  signature_data_url: string;
  signed_at: string;
  professional_name: string;
  created_at: string;
}

export interface ClinicalConsentInput {
  petId: number;
  clinicalRecordId?: number;
  consentType: ClinicalConsent["consent_type"];
  title: string;
  content: string;
  signerName: string;
  signerDocument?: string;
  signatureDataUrl: string;
  professionalName: string;
}

export interface ClinicalDocumentTemplate {
  id: number;
  document_type: ClinicalDocument["document_type"];
  title: string;
  content: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicalDocumentTemplateInput {
  documentType: ClinicalDocument["document_type"];
  title: string;
  content: string;
  sortOrder: number;
}

export type AppointmentStatus =
  | "Pendente"
  | "Agendado"
  | "Finalizado"
  | "Cancelado";

export interface Appointment {
  id: number;
  pet_id?: number;
  servico: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  observacao?: string;
  pets?: {
    nome: string;
    porte?: string;
    photo_url?: string | null;
    tutor_id?: number;
    tutors?: {
      id?: number;
      nome: string;
      telefone?: string;
      email?: string;
      endereco?: string;
    };
  };
}

export type FinancialEntryType = "Receita" | "Despesa";
export type PaymentStatus = "Pago" | "Pendente";

export interface FinancialEntry {
  id: number;
  descricao: string;
  valor: number;
  tipo: FinancialEntryType;
  forma_pagamento?: string;
  status_pagamento?: PaymentStatus;
  data_vencimento?: string;
  origem?: string;
  referencia_id?: number;
  tutor_id?: number | null;
  pet_id?: number | null;
  created_at?: string;
  tutors?: {
    nome: string;
  } | null;
  pets?: {
    nome: string;
  } | null;
}

export interface Service {
  id: number;
  nome: string;
  preco_pequeno: number;
  preco_medio: number;
  preco_grande: number;
}

export interface CompletedAppointmentService {
  serviceName: string;
  price: number;
}

export interface AppointmentService {
  id: number;
  appointment_id: number;
  service_name: string;
  price: number;
  created_at?: string;
}
export interface Product {
  id: number;
  nome: string;
  sku?: string;
  barcode?: string;
  profit_margin?: number;
  categoria?: string;
  category_id?: number;
  tamanho?: string;
  cor?: string;
  sabor?: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  estoque_minimo: number;
  image_url?: string | null;
  ncm?: string;
  cfop?: string;
  origem_mercadoria?: string;
  csosn?: string;
  unidade_comercial?: string;
  purchase_unit?: string;
  sale_unit?: string;
  units_per_purchase?: number;
  ativo: boolean;
  created_at?: string;
}

export type NewProductInput = Omit<Product, "id" | "created_at">;

export type ProductStockMovementKind =
  | "entrada"
  | "saida"
  | "inventario"
  | "perda"
  | "vencido"
  | "sistema"
  | "edicao";

export interface ProductStockMovement {
  id: number;
  product_id: number;
  movement_kind: ProductStockMovementKind;
  quantity_delta: number;
  previous_stock: number;
  resulting_stock: number;
  reason: string;
  batch_number?: string;
  expiration_date?: string;
  created_by?: string;
  created_at: string;
  products?: Pick<Product, "id" | "nome" | "sku" | "barcode">;
  user_profiles?: Pick<UserProfile, "nome"> | null;
}

export interface ProductStocktakeItem {
  id: number;
  stocktake_id: number;
  product_id?: number | null;
  product_name: string;
  product_code?: string | null;
  previous_quantity: number;
  counted_quantity: number;
  difference: number;
}

export interface ProductStocktake {
  id: number;
  created_at: string;
  created_by: string;
  notes?: string | null;
  product_count: number;
  changed_count: number;
  unchanged_count: number;
  total_difference: number;
  user_profiles?: Pick<UserProfile, "nome"> | null;
  product_stocktake_items?: ProductStocktakeItem[];
}

export interface ProductStocktakeDraftItem {
  product_id: number;
  counted_quantity: number | null;
}

export interface ProductStocktakeDraft {
  id: number;
  created_by: string;
  items: ProductStocktakeDraftItem[];
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  expiration_date?: string;
  quantity: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  products?: Pick<Product, "id" | "nome" | "sku" | "barcode">;
}

export interface ProductStockAdjustmentInput {
  productId: number;
  quantityDelta: number;
  kind: Exclude<ProductStockMovementKind, "sistema" | "edicao">;
  reason: string;
  batchNumber?: string;
  expirationDate?: string;
}

export interface ProductCategory {
  id: number;
  nome: string;
  ativo: boolean;
  created_at?: string;
}

export type NewProductCategoryInput = Pick<ProductCategory, "nome">;

export interface PosQuote {
  id: number;
  tutor_id?: number | null;
  cliente_nome?: string;
  total: number;
  validade?: string;
  status: "Aberto" | "Convertido" | "Cancelado";
  created_at: string;
  tutors?: {
    nome: string;
  };
  pos_quote_items?: PosItem[];
}

export interface PosItem {
  id: number;
  product_id?: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
}

export interface PosSale {
  id: number;
  cliente_nome?: string;
  total: number;
  subtotal?: number;
  discount_amount?: number;
  surcharge_amount?: number;
  adjustment_reason?: string;
  forma_pagamento: string;
  status?: "Concluída" | "Cancelada";
  cash_register_id?: number;
  change_amount?: number;
  change_method?: "Dinheiro" | "PIX";
  cash_received?: number;
  created_at: string;
  tutors?: {
    nome: string;
  };
  pos_sale_items?: PosItem[];
  pos_sale_payments?: PosSalePayment[];
  pos_sale_returns?: PosSaleReturn[];
}

export interface PosSaleReturnItem {
  id: number;
  sale_item_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface PosSaleReturn {
  id: number;
  sale_id: number;
  return_type: "Devolução" | "Troca";
  amount: number;
  reason: string;
  created_at: string;
  pos_sale_return_items?: PosSaleReturnItem[];
}

export interface FinancialRecurringRule {
  id: number;
  description: string;
  amount: number;
  entry_type: "Receita" | "Despesa";
  payment_method?: string | null;
  day_of_month: number;
  start_date: string;
  end_date?: string | null;
  active: boolean;
  created_at: string;
}

export interface PosSalePayment {
  id: number;
  sale_id: number;
  payment_method: string;
  amount: number;
  created_at: string;
}

export interface SuspendedPosSaleItem {
  id: number;
  suspended_sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  products?: Pick<Product, "id" | "nome" | "sku" | "tamanho" | "cor" | "sabor">;
}

export interface SuspendedPosSale {
  id: number;
  tutor_id?: number;
  customer_name: string;
  notes?: string;
  created_at: string;
  tutors?: Pick<Tutor, "nome">;
  suspended_pos_sale_items?: SuspendedPosSaleItem[];
}

export type PosCashRegisterStatus = "Aberto" | "Fechado";
export type PosCashMovementType =
  | "abertura"
  | "suprimento"
  | "sangria"
  | "venda"
  | "cancelamento_venda"
  | "fechamento";

export interface PosCashMovement {
  id: number;
  cash_register_id: number;
  movement_type: PosCashMovementType;
  amount: number;
  sale_id?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  pos_sales?: {
    forma_pagamento: string;
    pos_sale_payments?: Array<
      Pick<PosSalePayment, "payment_method" | "amount">
    >;
  };
}

export interface PosCashRegister {
  id: number;
  opened_by?: string;
  opening_amount: number;
  expected_amount: number;
  closing_amount?: number;
  difference_amount?: number;
  status: PosCashRegisterStatus;
  notes?: string;
  opened_at: string;
  closed_at?: string;
  user_profiles?: {
    nome: string;
  } | null;
  pos_cash_movements?: PosCashMovement[];
}

export interface Supplier {
  id: number;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  contato?: string;
  ativo: boolean;
  created_at?: string;
}

export type NewSupplierInput = Omit<Supplier, "id" | "created_at">;

export interface ProductPurchase {
  id: number;
  supplier_id?: number;
  numero_documento?: string;
  data_compra: string;
  total: number;
  observacao?: string;
  data_vencimento?: string;
  forma_pagamento?: string;
  created_at: string;
  suppliers?: {
    nome: string;
  };
  product_purchase_items?: Array<{
    product_id: number;
    quantidade: number;
    custo_unitario: number;
  }>;
  product_purchase_payments?: Array<{
    payment_method: string;
    amount: number;
    due_date: string;
  }>;
}

export type PurchaseOrderStatus =
  | "Rascunho"
  | "Enviado"
  | "Recebido parcialmente"
  | "Concluído"
  | "Cancelado";

export interface PurchaseOrderItem {
  id: number;
  order_id: number;
  product_id: number;
  ordered_quantity: number;
  received_quantity: number;
  unit_cost: number;
  products?: Pick<
    Product,
    | "id"
    | "nome"
    | "sku"
    | "tamanho"
    | "cor"
    | "sabor"
    | "purchase_unit"
    | "sale_unit"
    | "units_per_purchase"
  >;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  expected_date?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  suppliers?: Pick<
    Supplier,
    "nome" | "documento" | "telefone" | "email" | "contato"
  >;
  purchase_order_items?: PurchaseOrderItem[];
}

export interface NewServiceInput {
  nome: string;
  preco_pequeno: number;
  preco_medio: number;
  preco_grande: number;
}

export interface NewTutorInput {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface NewPetInput {
  nome: string;
  especie: string;
  raca: string;
  tutorId: string;
  sexo: string;
  idade?: string;
  porte: string;
  photoUrl?: string | null;
  bathReminderIntervalDays?: string;
}

export interface NewAppointmentInput {
  petId: string;
  servico: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  observacao?: string;
}

export interface NewFinancialEntryInput {
  descricao: string;
  valor: number;
  formaPagamento: string;
  tipo: FinancialEntryType;
  statusPagamento?: PaymentStatus;
  dataVencimento?: string;
  tutorId?: string;
  petId?: string;
}

export interface UpdateFinancialEntryInput {
  descricao: string;
  valor: number;
  formaPagamento: string;
  tipo: FinancialEntryType;
  statusPagamento: PaymentStatus;
  dataVencimento?: string;
  tutorId?: string;
  petId?: string;
}

export type GroomingSupplyMovementType =
  | "entrada"
  | "saida"
  | "descarte"
  | "vencido"
  | "perda"
  | "ajuste_positivo"
  | "ajuste_negativo";

export type GroomingPaymentStatus = "Pago" | "Pendente";

export interface GroomingSupply {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  supplier?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroomingSupplyInput {
  id?: number;
  name: string;
  category: string;
  unit: string;
  minimumStock: number;
  supplier?: string;
  notes?: string;
  active?: boolean;
}

export interface GroomingSupplyMovement {
  id: number;
  supply_id: number;
  movement_type: GroomingSupplyMovementType;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier?: string;
  movement_date: string;
  expiration_date?: string;
  payment_status: GroomingPaymentStatus;
  payment_method?: string;
  due_date?: string;
  document_number?: string;
  purchase_group_id?: string;
  financial_entry_id?: number;
  notes?: string;
  created_at: string;
  grooming_supplies?: {
    name: string;
    unit: string;
    category: string;
  };
}

export interface GroomingSupplyMovementInput {
  supplyId: number;
  movementType: GroomingSupplyMovementType;
  quantity: number;
  unitCost: number;
  supplier?: string;
  movementDate: string;
  expirationDate?: string;
  paymentStatus: GroomingPaymentStatus;
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
}

export interface GroomerDailyPayment {
  id: number;
  professional_name: string;
  work_date: string;
  payment_type: "diaria" | "comissao" | "extra";
  amount: number;
  payment_status: GroomingPaymentStatus;
  payment_method?: string;
  due_date?: string;
  financial_entry_id?: number;
  notes?: string;
  created_at: string;
}

export interface GroomerDailyPaymentInput {
  professionalName: string;
  workDate: string;
  paymentType: "diaria" | "comissao" | "extra";
  amount: number;
  paymentStatus: GroomingPaymentStatus;
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
}

export type GroomingEquipmentType =
  | "Secador"
  | "Lâmina"
  | "Máquina"
  | "Tesoura"
  | "Outro";

export type GroomingEquipmentStatus =
  | "Em uso"
  | "Em manutenção"
  | "Enviado para afiação"
  | "Baixado";

export type GroomingEquipmentServiceType =
  | "Afiação"
  | "Manutenção"
  | "Conserto"
  | "Limpeza"
  | "Outro";

export interface GroomingEquipment {
  id: number;
  name: string;
  equipment_type: GroomingEquipmentType;
  size_or_model?: string;
  serial_number?: string;
  supplier?: string;
  purchase_date?: string;
  purchase_cost?: number;
  status: GroomingEquipmentStatus;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroomingEquipmentInput {
  name: string;
  equipmentType: GroomingEquipmentType;
  sizeOrModel?: string;
  serialNumber?: string;
  supplier?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  status: GroomingEquipmentStatus;
  notes?: string;
  active?: boolean;
}

export interface GroomingEquipmentService {
  id: number;
  equipment_id: number;
  service_type: GroomingEquipmentServiceType;
  supplier?: string;
  sent_date: string;
  expected_return_date?: string;
  returned_date?: string;
  cost: number;
  payment_status: GroomingPaymentStatus;
  payment_method?: string;
  due_date?: string;
  notes?: string;
  financial_entry_id?: number;
  created_at: string;
  grooming_equipment?: {
    name: string;
    equipment_type: GroomingEquipmentType;
    size_or_model?: string;
  };
}

export interface GroomingEquipmentServiceInput {
  equipmentId: number;
  serviceType: GroomingEquipmentServiceType;
  supplier?: string;
  sentDate: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  cost: number;
  paymentStatus: GroomingPaymentStatus;
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
}
