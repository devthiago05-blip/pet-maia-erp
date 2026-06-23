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

export interface Appointment {
  id: number;
  pet_id?: number;
  servico: string;
  data: string;
  hora: string;
  status: string;
  pets?: {
    nome: string;
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
  created_at?: string;
}

export interface Service {
  id: number;
  nome: string;
  preco_pequeno: number;
  preco_medio: number;
  preco_grande: number;
}

export interface NewTutorInput {
  nome: string;
  telefone: string;
  email: string;
}

export interface NewPetInput {
  nome: string;
  especie: string;
  raca: string;
  tutorId: string;
  sexo: string;
  peso?: string;
  idade?: string;
  porte: string;
}

export interface NewAppointmentInput {
  pet: string;
  servico: string;
  data: string;
  hora: string;
  status: string;
}

export interface NewFinancialEntryInput {
  descricao: string;
  valor: number;
  formaPagamento: string;
  tipo: FinancialEntryType;
}
