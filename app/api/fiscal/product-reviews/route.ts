import { requireAdmin } from "@/lib/server-auth";
import type { RecognizedPurchaseItem } from "@/types/purchase-recognition";

export const runtime = "nodejs";

function code(value: unknown, length: number) {
  const normalized = String(value || "").replace(/\D/g, "");
  return normalized.length === length ? normalized : null;
}

function unit(value: unknown) {
  const normalized = String(value || "").trim().toUpperCase();
  return /^[A-Z]{1,6}$/.test(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    purchaseId?: number;
    documentNumber?: string;
    suggestions?: Array<{ productId?: number; item?: RecognizedPurchaseItem }>;
  };
  if (
    !Number.isInteger(body.purchaseId) ||
    !Array.isArray(body.suggestions) ||
    !body.suggestions.length
  ) {
    return Response.json({ error: "Sugestões fiscais inválidas." }, { status: 400 });
  }

  const rows = body.suggestions.flatMap((suggestion) => {
    const item = suggestion.item;
    if (!Number.isInteger(suggestion.productId) || !item) return [];
    const row = {
      product_id: suggestion.productId,
      status: "review",
      suggested_ncm: code(item.ncm, 8),
      suggested_cest: code(item.cest, 7),
      suggested_cfop: code(item.cfop, 4),
      suggested_origin: code(item.origin, 1),
      suggested_csosn_cst:
        code(item.csosnCst, 3) || code(item.csosnCst, 2),
      suggested_pis_cst: code(item.pisCst, 2),
      suggested_cofins_cst: code(item.cofinsCst, 2),
      suggested_unit: unit(item.commercialUnit),
      source_type: "purchase_xml",
      source_purchase_id: body.purchaseId,
      source_description: item.description.slice(0, 500),
      source_document_number: body.documentNumber?.trim().slice(0, 80) || null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      updated_at: new Date().toISOString(),
    };
    const hasFiscalValue = Object.entries(row).some(
      ([key, value]) => key.startsWith("suggested_") && value,
    );
    return hasFiscalValue ? [row] : [];
  });

  if (!rows.length) return Response.json({ saved: 0 });
  const { error } = await auth.admin
    .from("product_fiscal_reviews")
    .upsert(rows, { onConflict: "product_id" });
  if (error) {
    return Response.json({ error: "Não foi possível salvar as sugestões fiscais." }, { status: 500 });
  }
  return Response.json({ saved: rows.length });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    productId?: number;
    notes?: string;
  };
  if (!Number.isInteger(body.productId)) {
    return Response.json({ error: "Produto inválido." }, { status: 400 });
  }

  const { data: review, error: reviewError } = await auth.admin
    .from("product_fiscal_reviews")
    .select("*")
    .eq("product_id", body.productId)
    .single();
  if (reviewError || !review) {
    return Response.json({ error: "Sugestão fiscal não encontrada." }, { status: 404 });
  }

  const productUpdate = {
    ncm: review.suggested_ncm,
    origem_mercadoria: review.suggested_origin,
    unidade_comercial: review.suggested_unit,
    updated_at: new Date().toISOString(),
  };
  const { error: productError } = await auth.admin
    .from("products")
    .update(
      Object.fromEntries(
        Object.entries(productUpdate).filter(([, value]) => value !== null),
      ),
    )
    .eq("id", body.productId);
  if (productError) {
    return Response.json({ error: "Não foi possível atualizar o produto." }, { status: 500 });
  }

  const { error: statusError } = await auth.admin
    .from("product_fiscal_reviews")
    .update({
      status: "approved",
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: body.notes?.trim().slice(0, 1000) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("product_id", body.productId);
  if (statusError) {
    return Response.json({ error: "Produto atualizado, mas a aprovação não foi registrada." }, { status: 500 });
  }
  return Response.json({ approved: true });
}
