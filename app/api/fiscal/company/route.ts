import { requireAdmin } from "@/lib/server-auth";

const fields =
  "razao_social,nome_fantasia,cnpj,inscricao_estadual,regime_tributario,uf,municipio,codigo_municipio_ibge,cep,endereco,endereco_numero,bairro,fiscal_environment,nfce_series,nfce_next_number,modelo_fiscal";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.admin
    .from("clinic_settings")
    .select(fields)
    .eq("id", 1)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const { data: credentials } = await auth.admin.storage
    .from("fiscal-certificates")
    .list("nfce", { limit: 10 });
  return Response.json({
    company: data,
    credentialsConfigured: Boolean(credentials?.length),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  if (body.fiscal_environment === "producao") {
    return Response.json(
      { error: "Produção não pode ser ativada durante a fase MOCK." },
      { status: 403 },
    );
  }
  const update = {
    razao_social: String(body.razao_social || "").trim() || null,
    nome_fantasia: String(body.nome_fantasia || "").trim() || null,
    cnpj: String(body.cnpj || "").replace(/\D/g, "") || null,
    inscricao_estadual:
      String(body.inscricao_estadual || "").replace(/\D/g, "") || null,
    regime_tributario: ["1", "2", "3"].includes(String(body.regime_tributario))
      ? String(body.regime_tributario)
      : null,
    uf: String(body.uf || "CE")
      .toUpperCase()
      .slice(0, 2),
    municipio: String(body.municipio || "").trim() || null,
    codigo_municipio_ibge:
      String(body.codigo_municipio_ibge || "")
        .replace(/\D/g, "")
        .slice(0, 7) || null,
    cep:
      String(body.cep || "")
        .replace(/\D/g, "")
        .slice(0, 8) || null,
    endereco: String(body.endereco || "").trim() || null,
    endereco_numero: String(body.endereco_numero || "").trim() || null,
    bairro: String(body.bairro || "").trim() || null,
    fiscal_environment: "homologacao",
    nfce_series: Math.max(1, Number(body.nfce_series || 1)),
    nfce_next_number: Math.max(1, Number(body.nfce_next_number || 1)),
    modelo_fiscal: 65,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await auth.admin
    .from("clinic_settings")
    .update(update)
    .eq("id", 1)
    .select(fields)
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ company: data });
}
