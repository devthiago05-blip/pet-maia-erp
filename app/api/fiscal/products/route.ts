import type { FiscalProductProfile } from "@/lib/nfce/types";
import { validateFiscalProduct } from "@/lib/nfce/validation";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.admin
    .from("products")
    .select(
      "id,nome,sku,barcode,ncm,cfop,origem_mercadoria,csosn,unidade_comercial,ativo,fiscal_product_profiles(*)",
    )
    .eq("ativo", true)
    .order("nome");
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ products: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  if (!Number.isSafeInteger(Number(body.product_id))) {
    return Response.json({ error: "Produto inválido." }, { status: 400 });
  }
  const { data: settings } = await auth.admin
    .from("clinic_settings")
    .select("regime_tributario")
    .eq("id", 1)
    .single();
  const regime =
    settings?.regime_tributario === "1"
      ? "1"
      : settings?.regime_tributario === "2"
        ? "2"
        : "3";
  const validationProfile: FiscalProductProfile = {
    productId: Number(body.product_id),
    gtin: body.gtin || null,
    ncm: body.ncm || null,
    cest: body.cest || null,
    cfop: body.cfop || null,
    cstIcms: body.cst_icms || null,
    csosn: body.csosn || null,
    origin: body.origin || null,
    commercialUnit: body.commercial_unit || null,
    taxUnit: body.tax_unit || null,
    pisCst: body.pis_cst || null,
    cofinsCst: body.cofins_cst || null,
    taxStatus: "incomplete",
    accountantValidated: body.accountant_validated === true,
  };
  const missing = validateFiscalProduct(validationProfile, regime);
  const computedStatus =
    missing.length === 0
      ? "complete"
      : body.accountant_validated === true
        ? "review"
        : "incomplete";
  const safe = {
    product_id: Number(body.product_id),
    gtin: body.gtin || null,
    ncm: body.ncm || null,
    cest: body.cest || null,
    cfop: body.cfop || null,
    cst_icms: body.cst_icms || null,
    csosn: body.csosn || null,
    origin: body.origin || null,
    commercial_unit: body.commercial_unit || null,
    tax_unit: body.tax_unit || null,
    icms_rate: body.icms_rate === "" ? null : Number(body.icms_rate || 0),
    icms_base_mode: body.icms_base_mode || null,
    icms_base_reduction:
      body.icms_base_reduction === ""
        ? null
        : Number(body.icms_base_reduction || 0),
    pis_cst: body.pis_cst || null,
    pis_rate: body.pis_rate === "" ? null : Number(body.pis_rate || 0),
    cofins_cst: body.cofins_cst || null,
    cofins_rate: body.cofins_rate === "" ? null : Number(body.cofins_rate || 0),
    ipi_cst: body.ipi_cst || null,
    ipi_rate: body.ipi_rate === "" ? null : Number(body.ipi_rate || 0),
    fiscal_benefit_code: body.fiscal_benefit_code || null,
    anp_code: body.anp_code || null,
    additional_info: body.additional_info || null,
    tax_status: computedStatus,
    accountant_validated: body.accountant_validated === true,
    reviewed_by: body.accountant_validated === true ? auth.user.id : null,
    reviewed_at:
      body.accountant_validated === true ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await auth.admin
    .from("fiscal_product_profiles")
    .upsert(safe, { onConflict: "product_id" })
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: data, missing });
}
