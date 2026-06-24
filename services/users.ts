import type { AccessModule } from "@/lib/access-control";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/domain";

export interface UserInput {
  id?: string;
  nome: string;
  email: string;
  password?: string;
  ativo: boolean;
  is_admin: boolean;
  permissions: AccessModule[];
}

async function adminRequest(
  method: "GET" | "POST" | "PATCH",
  body?: UserInput,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  const response = await fetch("/api/users", {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = (await response.json()) as {
    error?: string;
    users?: UserProfile[];
  };

  if (!response.ok) {
    throw new Error(result.error || "Não foi possível concluir a operação.");
  }

  return result;
}

export async function fetchUsers() {
  const result = await adminRequest("GET");
  return result.users || [];
}

export async function createUser(input: UserInput) {
  return adminRequest("POST", input);
}

export async function updateUser(input: UserInput) {
  return adminRequest("PATCH", input);
}
