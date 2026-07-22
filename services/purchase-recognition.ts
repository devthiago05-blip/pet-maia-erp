import { supabase } from "@/lib/supabase";

export type PurchaseMappingKind = "pdv" | "grooming";

export interface PurchaseDocumentFile {
  file: File;
  hash: string;
}

export function normalizePurchaseDescription(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function fetchPurchaseItemMappings(kind: PurchaseMappingKind) {
  return supabase
    .from("purchase_item_mappings")
    .select("normalized_description,target_id")
    .eq("destination_kind", kind);
}

export async function savePurchaseItemMapping(
  kind: PurchaseMappingKind,
  description: string,
  targetId: number,
) {
  return supabase.from("purchase_item_mappings").upsert(
    {
      destination_kind: kind,
      source_description: description.trim(),
      normalized_description: normalizePurchaseDescription(description),
      target_id: targetId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "destination_kind,normalized_description" },
  );
}

export async function findDuplicatePurchaseDocument(fileHash: string) {
  return supabase
    .from("purchase_documents")
    .select("destination_kind, document_number, supplier_name, created_at")
    .eq("file_hash", fileHash)
    .maybeSingle();
}

export async function archivePurchaseDocument({
  document,
  destinationKind,
  linkedRecordId,
  documentNumber,
  supplierName,
}: {
  document: PurchaseDocumentFile;
  destinationKind: PurchaseMappingKind;
  linkedRecordId: number;
  documentNumber?: string;
  supplierName?: string;
}) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Sessão expirada. Entre novamente.");

  const extension = document.file.name.split(".").pop()?.toLowerCase() || "bin";
  const contentType =
    document.file.type ||
    ({
      xml: "application/xml",
      pdf: "application/pdf",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
    }[extension] ??
      "application/octet-stream");
  const path = `${destinationKind}/${authData.user.id}/${document.hash}-${crypto.randomUUID()}.${extension}`;
  const upload = await supabase.storage
    .from("purchase-documents")
    .upload(path, document.file, {
      contentType,
      upsert: false,
    });
  if (upload.error) throw upload.error;

  const saved = await supabase.from("purchase_documents").insert({
    destination_kind: destinationKind,
    linked_record_id: linkedRecordId,
    document_number: documentNumber?.trim() || null,
    supplier_name: supplierName?.trim() || null,
    original_name: document.file.name,
    mime_type: contentType,
    file_size: document.file.size,
    file_hash: document.hash,
    storage_path: path,
    created_by: authData.user.id,
  });

  if (saved.error) {
    await supabase.storage.from("purchase-documents").remove([path]);
    throw saved.error;
  }
}
