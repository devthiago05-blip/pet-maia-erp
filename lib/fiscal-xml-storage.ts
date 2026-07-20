import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const FISCAL_XML_BUCKET = "fiscal-xml";
export type FiscalEnvironment = "homologacao" | "producao";

export function buildFiscalXmlPath(
  environment: FiscalEnvironment,
  accessKey: string,
  issuedAt = new Date(),
) {
  if (!/^\d{44}$/.test(accessKey)) {
    throw new Error("A chave de acesso da NFC-e deve ter 44 dígitos.");
  }

  const year = String(issuedAt.getUTCFullYear());
  const month = String(issuedAt.getUTCMonth() + 1).padStart(2, "0");
  return `${environment}/${year}/${month}/${accessKey}.xml`;
}

export async function storeAuthorizedFiscalXml(
  admin: SupabaseClient,
  input: {
    environment: FiscalEnvironment;
    accessKey: string;
    xml: string | Uint8Array;
    issuedAt?: Date;
  },
) {
  const path = buildFiscalXmlPath(input.environment, input.accessKey, input.issuedAt);
  const result = await admin.storage.from(FISCAL_XML_BUCKET).upload(path, input.xml, {
    contentType: "application/xml; charset=utf-8",
    upsert: false,
  });
  return { ...result, path };
}

export function downloadFiscalXml(admin: SupabaseClient, path: string) {
  if (!/^(homologacao|producao)\/\d{4}\/\d{2}\/\d{44}\.xml$/.test(path)) {
    throw new Error("Caminho de XML fiscal inválido.");
  }
  return admin.storage.from(FISCAL_XML_BUCKET).download(path);
}
