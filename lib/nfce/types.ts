export type NfceEnvironment = "mock" | "homologacao" | "producao";
export type NfceProvider = "mock" | "sefaz";
export type NfceCertificateMode = "mock" | "a1";

export type NfceDocumentStatus =
  | "draft"
  | "validated"
  | "signed"
  | "pending"
  | "authorized"
  | "rejected"
  | "contingency"
  | "cancelled"
  | "inutilized";

export type NfceEventType =
  | "create"
  | "validate"
  | "sign"
  | "send"
  | "authorize"
  | "reject"
  | "cancel"
  | "contingency"
  | "query"
  | "resend"
  | "inutilize";

export interface NfceConfig {
  enabled: boolean;
  environment: NfceEnvironment;
  provider: NfceProvider;
  certificateMode: NfceCertificateMode;
  uf: string;
  series: number;
  initialNumber: number;
  certificatePath?: string;
  certificatePassword?: string;
  cnpj?: string;
  stateRegistration?: string;
  cscId?: string;
  cscToken?: string;
  municipalCode?: string;
  taxRegime?: string;
}

export interface FiscalProductProfile {
  id?: string;
  productId: number;
  gtin?: string | null;
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  cstIcms?: string | null;
  csosn?: string | null;
  origin?: string | null;
  commercialUnit?: string | null;
  taxUnit?: string | null;
  icmsRate?: number | null;
  icmsBaseMode?: string | null;
  icmsBaseReduction?: number | null;
  pisCst?: string | null;
  pisRate?: number | null;
  cofinsCst?: string | null;
  cofinsRate?: number | null;
  ipiCst?: string | null;
  ipiRate?: number | null;
  fiscalBenefitCode?: string | null;
  anpCode?: string | null;
  additionalInfo?: string | null;
  taxStatus: "complete" | "incomplete" | "review";
  accountantValidated: boolean;
}

export interface NfceItemInput {
  productId: number;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  profile: FiscalProductProfile;
}

export interface NfcePaymentInput {
  method: "Dinheiro" | "PIX" | "Crédito" | "Débito" | "Voucher" | "Outros";
  amount: number;
  integrated?: boolean;
  transactionId?: string;
  authorizationCode?: string;
  terminalId?: string;
  acquirerCnpj?: string;
  cardBrand?: string;
}

export interface NfceBuildInput {
  environment: NfceEnvironment;
  ufCode: string;
  municipalityCode: string;
  issuer: {
    cnpj: string;
    legalName: string;
    tradeName?: string;
    stateRegistration: string;
    taxRegime: "1" | "2" | "3";
    address: string;
    number: string;
    district: string;
    city: string;
    state: string;
    postalCode: string;
  };
  number: number;
  series: number;
  issuedAt: Date;
  customerCpf?: string;
  customerName?: string;
  items: NfceItemInput[];
  payments: NfcePaymentInput[];
  changeAmount?: number;
}

export interface NfceDiagnosticItem {
  key: string;
  label: string;
  status: "ok" | "error" | "not_configured";
  detail: string;
}

export interface SefazRequest {
  documentId: string;
  accessKey: string;
  xml: string;
}

export interface SefazResponse {
  status: "authorized" | "rejected" | "cancelled" | "inutilized" | "pending";
  cStat: number;
  message: string;
  protocol?: string;
  receivedAt: string;
}

export type SefazMockScenario =
  | "authorized"
  | "duplicate"
  | "invalid_schema"
  | "issuer_disabled"
  | "payment_rejected"
  | "timeout"
  | "unavailable";
