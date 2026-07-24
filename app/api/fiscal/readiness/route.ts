import { assessProductFiscal } from "@/lib/fiscal-tax";
import { requireAdmin } from "@/lib/server-auth";
import type { ClinicSettings, Product } from "@/types/domain";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const [settingsResult, productsResult] = await Promise.all([
    auth.admin.from("clinic_settings").select("*").eq("id", 1).single(),
    auth.admin
      .from("products")
      .select(
        "id,nome,categoria,ncm,cfop,origem_mercadoria,csosn,unidade_comercial",
      )
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (settingsResult.error || productsResult.error) {
    return Response.json(
      { error: "Não foi possível montar a auditoria tributária." },
      { status: 500 },
    );
  }

  const settings = settingsResult.data as ClinicSettings;
  const products = (productsResult.data || []) as Product[];
  const assessments = products.map((product) =>
    assessProductFiscal(product, settings),
  );

  return Response.json({
    generatedAt: new Date().toISOString(),
    regimeConfirmed: Boolean(settings.regime_tributario),
    totals: {
      products: assessments.length,
      ready: assessments.filter((item) => item.level === "ready").length,
      suggestions: assessments.filter((item) => item.level === "suggestion")
        .length,
      blocked: assessments.filter((item) => item.level === "blocked").length,
    },
    assessments,
    warnings: [
      "Sugestões não são aplicadas automaticamente e precisam de validação contábil.",
      "NFC-e emitida a partir de 2026 deve considerar os grupos de CBS e IBS do leiaute vigente.",
      "Serviços veterinários, banho e tosa não devem ser misturados à NFC-e de mercadorias sem orientação fiscal.",
    ],
  });
}
