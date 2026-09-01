import { getNfceConfig, getNfceDiagnostics } from "@/lib/nfce/config";
import { getPaymentConfig } from "@/lib/payments/config";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const nfce = getNfceConfig();
  const payment = getPaymentConfig();
  const database = await auth.admin
    .from("nfce_documents")
    .select("id", { count: "exact", head: true });
  return Response.json({
    environment: nfce.environment,
    enabled: nfce.enabled,
    provider: nfce.provider,
    payment,
    diagnostics: [
      ...getNfceDiagnostics(nfce),
      {
        key: "database",
        label: "Banco",
        status: database.error ? "not_configured" : "ok",
        detail: database.error
          ? "Migração do sandbox não aplicada"
          : "Conectado",
      },
      {
        key: "xml",
        label: "XML",
        status: "ok",
        detail: "Builder MOCK disponível",
      },
      {
        key: "schema",
        label: "Schema",
        status: "not_configured",
        detail: "Validação estrutural MOCK",
      },
    ],
  });
}
