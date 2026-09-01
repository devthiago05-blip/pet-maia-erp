export type PaymentProviderName = "mock" | "mercado_pago" | "stone" | "tef";
export type PaymentStatus = "approved" | "declined" | "cancelled" | "pending";
export type PaymentMockScenario =
  | "approved"
  | "declined"
  | "cancelled"
  | "pending"
  | "timeout"
  | "connection_error";

export interface PaymentRequest {
  saleId?: number;
  amount: number;
  paymentType: "PIX" | "Crédito" | "Débito" | "Voucher";
  externalReference: string;
}

export interface PaymentResult {
  provider: PaymentProviderName;
  status: PaymentStatus;
  paymentType: string;
  amount: number;
  transactionId?: string;
  authorizationCode?: string;
  terminalId?: string;
  acquirerCnpj?: string;
  cardBrand?: string;
  externalReference?: string;
  createdAt: string;
}

export interface PaymentProvider {
  charge(request: PaymentRequest): Promise<PaymentResult>;
  cancel(transactionId: string): Promise<PaymentResult>;
  query(transactionId: string): Promise<PaymentResult>;
}
