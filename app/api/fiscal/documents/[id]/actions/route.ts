import { SefazMockAdapter } from "@/lib/nfce/adapters/sefaz-mock-adapter";
import { requireAdmin } from "@/lib/server-auth";

export async function POST(
  request: Request,
  context: RouteContext<"/api/fiscal/documents/[id]/actions">,
) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { id } = await context.params;
  const body = await request.json();
  const { data: document, error } = await auth.admin
    .from("nfce_documents")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !document)
    return Response.json({ error: "NFC-e não encontrada." }, { status: 404 });
  if (document.environment === "producao") {
    return Response.json(
      { error: "Ações MOCK não operam documentos de produção." },
      { status: 403 },
    );
  }
  const adapter = new SefazMockAdapter("authorized");
  let result;
  let eventType: string;
  if (body.action === "cancel") {
    result = await adapter.cancel({
      accessKey: document.access_key,
      protocol: document.sefaz_protocol || "MOCK",
      justification: String(body.justification || "").trim(),
    });
    eventType = "cancel";
  } else if (body.action === "contingency") {
    result = {
      status: "contingency" as const,
      cStat: 108,
      message: "Serviço paralisado momentaneamente — contingência MOCK ativada",
      receivedAt: new Date().toISOString(),
    };
    eventType = "contingency";
  } else if (body.action === "resend") {
    result = await adapter.authorize({
      documentId: id,
      accessKey: document.access_key,
      xml: document.signed_xml || document.xml,
    });
    eventType = "resend";
  } else {
    result = {
      status: document.status,
      cStat: document.sefaz_status_code || 217,
      message: document.sefaz_message || "Consulta MOCK concluída",
      protocol: document.sefaz_protocol || undefined,
      receivedAt: new Date().toISOString(),
    };
    eventType = "query";
  }
  const mappedStatus =
    result.status === "cancelled" ? "cancelled" : result.status;
  await Promise.all([
    auth.admin
      .from("nfce_documents")
      .update({
        status: mappedStatus,
        sefaz_status_code: result.cStat,
        sefaz_message: result.message,
        sefaz_protocol: result.protocol || document.sefaz_protocol,
        contingency_reason:
          mappedStatus === "contingency"
            ? result.message
            : document.contingency_reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id),
    auth.admin.from("nfce_events").insert({
      document_id: id,
      environment: document.environment,
      event_type: eventType,
      status: mappedStatus,
      status_code: result.cStat,
      message: result.message,
      metadata: { provider: "mock" },
      created_by: auth.user.id,
    }),
  ]);
  return Response.json({ result });
}
