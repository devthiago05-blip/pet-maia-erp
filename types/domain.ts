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
  clinicalRecordId: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
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
    tutors?: {
      nome: string;
      telefone?: string;
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
  created_at?: string;
}

export interface Service {
  id: number;
  nome: string;
  preco_pequeno: number;
  preco_medio: number;
  preco_grande: number;
}

export interface Product {
  id: number;
  nome: string;
  sku?: string;
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
}
