import type { SupabaseClient } from "@supabase/supabase-js";

import { type AccessModule,accessModules } from "@/lib/access-control";
import { requireAdmin } from "@/lib/server-auth";

interface UserPayload {
  id?: string;
  nome?: string;
  email?: string;
  password?: string;
  ativo?: boolean;
  is_admin?: boolean;
  max_discount_percent?: number;
  permissions?: AccessModule[];
}

async function replacePermissions(
  admin: SupabaseClient,
  userId: string,
  permissions: AccessModule[],
  isAdmin: boolean,
) {
  const allowedPermissions = new Set(permissions);
  const rows = accessModules.map((module) => ({
    user_id: userId,
    module,
    can_access: isAdmin || allowedPermissions.has(module),
  }));

  return admin.from("user_permissions").upsert(rows);
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.admin
    .from("user_profiles")
    .select(
      `
        id,
        nome,
        email,
        ativo,
        is_admin,
        max_discount_percent,
        created_at,
        user_permissions (
          module,
          can_access
        )
      `,
    )
    .order("nome");

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ users: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json()) as UserPayload;
  const nome = payload.nome?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password || "";
  const isAdmin = Boolean(payload.is_admin);
  const maxDiscountPercent = isAdmin ? 100 : Number(payload.max_discount_percent ?? 10);

  if (!nome || !email || password.length < 6 || !Number.isFinite(maxDiscountPercent) || maxDiscountPercent < 0 || maxDiscountPercent > 100) {
    return Response.json(
      { error: "Informe nome, email e uma senha com pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const { data, error } = await auth.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (error || !data.user) {
    return Response.json(
      { error: error?.message || "Não foi possível criar o usuário." },
      { status: 400 },
    );
  }

  const userId = data.user.id;
  const { error: profileError } = await auth.admin
    .from("user_profiles")
    .upsert({
      id: userId,
      nome,
      email,
      ativo: payload.ativo ?? true,
      is_admin: isAdmin,
      max_discount_percent: maxDiscountPercent,
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    await auth.admin.auth.admin.deleteUser(userId);
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  const { error: permissionsError } = await replacePermissions(
    auth.admin,
    userId,
    payload.permissions || [],
    isAdmin,
  );

  if (permissionsError) {
    await auth.admin.auth.admin.deleteUser(userId);
    return Response.json({ error: permissionsError.message }, { status: 400 });
  }

  return Response.json({ id: userId }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);

  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const payload = (await request.json()) as UserPayload;
  const id = payload.id;
  const nome = payload.nome?.trim();
  const email = payload.email?.trim().toLowerCase();
  const isAdmin = Boolean(payload.is_admin);
  const maxDiscountPercent = isAdmin ? 100 : Number(payload.max_discount_percent ?? 10);

  if (!id || !nome || !email || !Number.isFinite(maxDiscountPercent) || maxDiscountPercent < 0 || maxDiscountPercent > 100) {
    return Response.json(
      { error: "Usuário, nome e email são obrigatórios." },
      { status: 400 },
    );
  }

  if (
    id === auth.user.id &&
    (payload.ativo === false || payload.is_admin === false)
  ) {
    return Response.json(
      {
        error:
          "Você não pode desativar ou remover seu próprio acesso administrativo.",
      },
      { status: 400 },
    );
  }

  const authAttributes = {
    email,
    user_metadata: { nome },
    ...(payload.password ? { password: payload.password } : {}),
  };
  const { error: authError } = await auth.admin.auth.admin.updateUserById(
    id,
    authAttributes,
  );

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }

  const { error: profileError } = await auth.admin
    .from("user_profiles")
    .update({
      nome,
      email,
      ativo: payload.ativo ?? true,
      is_admin: isAdmin,
      max_discount_percent: maxDiscountPercent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 400 });
  }

  const { error: permissionsError } = await replacePermissions(
    auth.admin,
    id,
    payload.permissions || [],
    isAdmin,
  );

  if (permissionsError) {
    return Response.json({ error: permissionsError.message }, { status: 400 });
  }

  return Response.json({ id });
}
