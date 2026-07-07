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
  created_at?: string;
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
  tutor_id?: number;
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
  consultation_date: string;
  weight_kg?: number;
  temperature_c?: number;
  main_complaint: string;
  anamnesis?: string;
  allergies?: string;
  current_medications?: string;
  diagnosis?: string;
  conduct?: string;
  return_date?: string;
  created_at: string;
  clinical_prescriptions?: ClinicalPrescription[];
}

export interface ClinicalPrescription {
  id: number;
  clinical_record_id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
  created_at: string;
}

export interface NewClinicalRecordInput {
  id?: number;
  petId: number;
  professionalName: string;
  consultationDate: string;
  weightKg?: number;
  temperatureC?: number;
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
}

export interface PetVaccination {
  id: number;
  pet_id: number;
  vaccine_name: string;
  manufacturer?: string;
  batch_number?: string;
  application_date: string;
  next_dose_date?: string;
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

export interface ClinicPatientOverview extends Pet {
  lastClinicalRecord?: {
    consultation_date: string;
    professional_name: string;
  };
  nextReturnDate?: string;
  nextVaccinationDate?: string;
  clinicalRecords?: Array<
    Pick<ClinicalRecord, "id" | "consultation_date" | "professional_name">
  >;
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

export type AppointmentStatus = "Agendado" | "Finalizado" | "Cancelado";

export interface Appointment {
  id: number;
  pet_id?: number;
  servico: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
  pets?: {
    nome: string;
    porte?: string;
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
  ativo: boolean;
  created_at?: string;
}

export type NewProductInput = Omit<Product, "id" | "created_at">;

export interface ProductCategory {
  id: number;
  nome: string;
  ativo: boolean;
  created_at?: string;
}

export type NewProductCategoryInput = Pick<ProductCategory, "nome">;

export interface PosQuote {
  id: number;
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
  forma_pagamento: string;
  status?: "Concluída" | "Cancelada";
  created_at: string;
  tutors?: {
    nome: string;
  };
  pos_sale_items?: PosItem[];
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
}

export interface NewAppointmentInput {
  petId: string;
  servico: string;
  data: string;
  hora: string;
  status: AppointmentStatus;
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
