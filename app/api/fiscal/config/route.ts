import type { SupabaseClient } from "@supabase/supabase-js";
import forge from "node-forge";

import {
  decryptFiscalSecret,
  encryptFiscalSecret,
} from "@/lib/fiscal-secrets";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

const bucket = "fiscal-certificates";
const certificatePath = "nfce/certificate.pfx";
const credentialsPath = "nfce/credentials.json";

interface StoredFiscalCredentials {
  certificateName: string;
  certificatePassword: string;
  csc: string;
  cscId: string;
  configuredAt: string;
  certificateExpiresAt: string;
  certificateSubject: string;
}

function getCertificateDetails(bytes: Buffer, password: string) {
  const binary = bytes.toString("binary");
  const asn1 = forge.asn1.fromDer(binary);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);
  const certificateBags = p12.getBags({
    bagType: forge.pki.oids.certBag,
  })[forge.pki.oids.certBag];
  const certificate = certificateBags?.[0]?.cert;

  if (!certificate) {
    throw new Error("O arquivo não contém um certificado digital válido.");
  }

  const commonName = certificate.subject.getField("CN")?.value;

  return {
    expiresAt: certificate.validity.notAfter.toISOString(),
    subject: typeof commonName === "string" ? commonName : "Certificado A1",
  };
}

async function readCredentials(admin: SupabaseClient) {
  const { data, error } = await admin.storage
    .from(bucket)
    .download(credentialsPath);

  if (error || !data) {
    return null;
  }

  return decryptFiscalSecret<StoredFiscalCredentials>(await data.text());
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const credentials = await readCredentials(auth.admin);

    return Response.json({
      configured: Boolean(credentials),
      certificateName: credentials?.certificateName || null,
      certificateExpiresAt: credentials?.certificateExpiresAt || null,
      certificateSubject: credentials?.certificateSubject || null,
      cscId: credentials?.cscId || null,
      configuredAt: credentials?.configuredAt || null,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Não foi possível ler a configuração fiscal segura." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const formData = await request.formData();
  const certificate = formData.get("certificate");
  const certificatePassword = String(formData.get("certificatePassword") || "");
  const csc = String(formData.get("csc") || "").trim();
  const cscId = String(formData.get("cscId") || "").trim();

  if (!(certificate instanceof File)) {
    return Response.json({ error: "Selecione o certificado A1." }, { status: 400 });
  }

  if (!/\.(pfx|p12)$/i.test(certificate.name) || certificate.size > 2_097_152) {
    return Response.json(
      { error: "Use um certificado .pfx ou .p12 com até 2 MB." },
      { status: 400 },
    );
  }

  if (!certificatePassword || !csc || !/^\d{1,6}$/.test(cscId)) {
    return Response.json(
      { error: "Informe a senha, o CSC e um CSC ID numérico de até 6 dígitos." },
      { status: 400 },
    );
  }

  const bytes = Buffer.from(await certificate.arrayBuffer());
  let details: ReturnType<typeof getCertificateDetails>;

  try {
    details = getCertificateDetails(bytes, certificatePassword);
  } catch {
    return Response.json(
      { error: "Certificado inválido ou senha incorreta." },
      { status: 400 },
    );
  }

  const credentials: StoredFiscalCredentials = {
    certificateName: certificate.name,
    certificatePassword,
    csc,
    cscId,
    configuredAt: new Date().toISOString(),
    certificateExpiresAt: details.expiresAt,
    certificateSubject: details.subject,
  };
  const encryptedCredentials = encryptFiscalSecret(credentials);

  const certificateUpload = await auth.admin.storage
    .from(bucket)
    .upload(certificatePath, bytes, {
      contentType: "application/x-pkcs12",
      upsert: true,
    });

  if (certificateUpload.error) {
    return Response.json({ error: certificateUpload.error.message }, { status: 400 });
  }

  const credentialsUpload = await auth.admin.storage
    .from(bucket)
    .upload(credentialsPath, encryptedCredentials, {
      contentType: "application/json",
      upsert: true,
    });

  if (credentialsUpload.error) {
    await auth.admin.storage.from(bucket).remove([certificatePath]);
    return Response.json({ error: credentialsUpload.error.message }, { status: 400 });
  }

  return Response.json({
    configured: true,
    certificateName: certificate.name,
    certificateExpiresAt: details.expiresAt,
    certificateSubject: details.subject,
    cscId,
    configuredAt: credentials.configuredAt,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { error } = await auth.admin.storage
    .from(bucket)
    .remove([certificatePath, credentialsPath]);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ configured: false });
}
