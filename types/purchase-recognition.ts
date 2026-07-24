export interface RecognizedPurchaseItem {
  description: string;
  quantity: number;
  unitCost: number;
  total: number;
  barcode?: string;
  supplierCode?: string;
  ncm?: string;
  cest?: string;
  cfop?: string;
  origin?: string;
  csosnCst?: string;
  pisCst?: string;
  cofinsCst?: string;
  commercialUnit?: string;
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

export interface PurchaseDocumentArchive {
  id: number;
  destination_kind: "pdv" | "grooming";
  linked_record_id: number;
  document_number?: string;
  supplier_name?: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}
