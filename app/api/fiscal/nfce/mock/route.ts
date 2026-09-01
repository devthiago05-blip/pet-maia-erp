import { storeAuthorizedFiscalXml } from "@/lib/fiscal-xml-storage";
import { SefazMockAdapter } from "@/lib/nfce/adapters/sefaz-mock-adapter";
import { generateDanfeMock } from "@/lib/nfce/danfe";
import { fiscalLog } from "@/lib/nfce/logger";
import { signXmlMock } from "@/lib/nfce/mock-signature";
import { generateMockQrCode } from "@/lib/nfce/qr-code";
import type { NfceBuildInput, SefazMockScenario } from "@/lib/nfce/types";
import { buildNfceXml } from "@/lib/nfce/xml-builder";
import { requireAdmin } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const body = (await request.json()) as {
    input: NfceBuildInput;
    scenario?: SefazMockScenario;
  };
  if (body.input?.environment === "producao") {
    return Response.json(
      { error: "Endpoint MOCK nunca aceita produção." },
      { status: 403 },
    );
  }
  try {
    const input = {
      ...body.input,
      environment: "mock" as const,
      issuedAt: new Date(body.input.issuedAt),
    };
    const built = buildNfceXml(input);
    const signature = signXmlMock(built.xml);
    const qrCode = await generateMockQrCode(built.accessKey);
    const sefaz = await new SefazMockAdapter(
      body.scenario || "authorized",
    ).authorize({
      documentId: "pending",
      accessKey: built.accessKey,
      xml: signature.signedXml,
    });
    const danfe = await generateDanfeMock({
      accessKey: built.accessKey,
      number: input.number,
      series: input.series,
      issuerName: input.issuer.legalName,
      total: built.totals.total,
      issuedAt: input.issuedAt,
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      qrCodeDataUrl: qrCode.dataUrl,
    });

    let persisted = false;
    let documentId: string | null = null;
    let persistenceWarning: string | null = null;
    const documentResult = await auth.admin
      .from("nfce_documents")
      .insert({
        environment: "mock",
        provider: "mock",
        is_fiscal_valid: false,
        number: input.number,
        series: input.series,
        access_key: built.accessKey,
        status: sefaz.status,
        xml: built.xml,
        signed_xml: signature.signedXml,
        subtotal: built.totals.subtotal,
        discount_amount: built.totals.discount,
        total: built.totals.total,
        change_amount: input.changeAmount || 0,
        customer_cpf: input.customerCpf?.replace(/\D/g, "") || null,
        customer_name: input.customerName || null,
        sefaz_protocol: sefaz.protocol || null,
        sefaz_status_code: sefaz.cStat,
        sefaz_message: sefaz.message,
        issued_at: input.issuedAt.toISOString(),
        authorized_at: sefaz.status === "authorized" ? sefaz.receivedAt : null,
        created_by: auth.user.id,
      })
      .select("id")
      .single();
    if (documentResult.error) {
      persistenceWarning = `NFC-e gerada, mas não persistida: ${documentResult.error.message}`;
    } else {
      documentId = documentResult.data.id;
      persisted = true;
      const xmlStorage = await storeAuthorizedFiscalXml(auth.admin, {
        environment: "mock",
        accessKey: built.accessKey,
        xml: signature.signedXml,
        issuedAt: input.issuedAt,
      });
      const year = input.issuedAt.getUTCFullYear();
      const month = String(input.issuedAt.getUTCMonth() + 1).padStart(2, "0");
      const danfePath = `nfce/mock/${year}/${month}/${built.accessKey}.pdf`;
      const danfeStorage = await auth.admin.storage
        .from("fiscal-danfe")
        .upload(danfePath, danfe, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (xmlStorage.error || danfeStorage.error) {
        persistenceWarning = [
          xmlStorage.error?.message,
          danfeStorage.error?.message,
        ]
          .filter(Boolean)
          .join(" | ");
      }
      await Promise.all([
        auth.admin
          .from("nfce_documents")
          .update({
            xml_path: xmlStorage.error ? null : xmlStorage.path,
            authorized_xml_path: xmlStorage.error ? null : xmlStorage.path,
            danfe_path: danfeStorage.error ? null : danfePath,
          })
          .eq("id", documentId),
        auth.admin.from("nfce_document_items").insert(
          input.items.map((item, index) => ({
            document_id: documentId,
            item_number: index + 1,
            product_id: item.productId || null,
            description: item.description,
            ncm: item.profile.ncm,
            cest: item.profile.cest || null,
            cfop: item.profile.cfop,
            commercial_unit: item.profile.commercialUnit,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            gross_total: item.quantity * item.unitPrice,
            discount_amount: item.discount || 0,
            tax_data: item.profile,
          })),
        ),
        auth.admin.from("nfce_document_payments").insert(
          input.payments.map((payment) => ({
            document_id: documentId,
            method_code: payment.method,
            method_description: payment.method,
            amount: payment.amount,
            integration_type: payment.integrated ? "integrated" : "manual",
            transaction_reference: payment.transactionId || null,
          })),
        ),
        auth.admin.from("nfce_events").insert({
          document_id: documentId,
          environment: "mock",
          event_type: sefaz.status === "authorized" ? "authorize" : "reject",
          status: sefaz.status,
          status_code: sefaz.cStat,
          message: sefaz.message,
          metadata: { provider: "mock" },
          created_by: auth.user.id,
        }),
      ]);
    }
    fiscalLog(sefaz.status, {
      accessKey: built.accessKey,
      cStat: sefaz.cStat,
      documentId,
    });
    return Response.json({
      documentId,
      persisted,
      persistenceWarning,
      accessKey: built.accessKey,
      xml: signature.signedXml,
      totals: built.totals,
      qrCode,
      danfeBase64: Buffer.from(danfe).toString("base64"),
      sefaz,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao gerar NFC-e MOCK.",
      },
      { status: 400 },
    );
  }
}
