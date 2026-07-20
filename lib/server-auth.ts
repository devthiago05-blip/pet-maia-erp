import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) return { error: "Sessão não informada.", status: 401 } as const;

  const admin = createSupabaseAdmin();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { error: "Sessão inválida.", status: 401 } as const;

  const { data: profile } = await admin
    .from("user_profiles")
    .select("ativo")
    .eq("id", user.id)
    .single();
  if (!profile?.ativo) return { error: "Usuário inativo.", status: 403 } as const;

  return { admin, user } as const;
}

export async function requireAdmin(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth) return auth;
  const { admin, user } = auth;

  const { data: profile, error: profileError } = await admin
    .from("user_profiles")
    .select("is_admin, ativo")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.ativo || !profile.is_admin) {
    return {
      error: "Acesso permitido apenas para administradores.",
      status: 403,
    } as const;
  }

  return { admin, user } as const;
}
