import { supabase } from "@/lib/supabase";

async function headers() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão expirada.");
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function fiscalApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await headers()),
      ...init?.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Erro no módulo fiscal.");
  return payload as T;
}
