export interface RecognizedPurchaseItem {
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
  barcode?: string;
}

export interface RecognizedPurchaseDocument {
  documentNumber?: string;
  supplierName?: string;
  supplierDocument?: string;
  purchaseDate?: string;
  dueDate?: string;
  paymentMethod?: string;
  total?: number;
  items: RecognizedPurchaseItem[];
  source: "xml" | "pdf" | "image" | "text";
  warnings: string[];
}
