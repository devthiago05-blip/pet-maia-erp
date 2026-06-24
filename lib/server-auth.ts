import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function requireAdmin(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return { error: "Sessão não informada.", status: 401 } as const;
  }

  const admin = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user) {
    return { error: "Sessão inválida.", status: 401 } as const;
  }

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
