import { supabase } from "@/lib/supabase";

export interface FiscalCredentialStatus {
  configured: boolean;
  certificateName: string | null;
  certificateExpiresAt: string | null;
  certificateSubject: string | null;
  cscId: string | null;
  configuredAt: string | null;
}

async function getAuthorizationHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sessão expirada. Entre novamente no sistema.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

async function parseResponse(response: Response) {
  const payload = (await response.json()) as FiscalCredentialStatus & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Erro na configuração fiscal.");
  }

  return payload;
}

export async function fetchFiscalCredentialStatus() {
  const response = await fetch("/api/fiscal/config", {
    headers: await getAuthorizationHeader(),
  });

  return parseResponse(response);
}

export async function saveFiscalCredentials(formData: FormData) {
  const response = await fetch("/api/fiscal/config", {
    method: "POST",
    headers: await getAuthorizationHeader(),
    body: formData,
  });

  return parseResponse(response);
}

export async function deleteFiscalCredentials() {
  const response = await fetch("/api/fiscal/config", {
    method: "DELETE",
    headers: await getAuthorizationHeader(),
  });

  return parseResponse(response);
}
