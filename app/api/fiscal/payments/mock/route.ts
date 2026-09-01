import { MockSmartPOSAdapter } from "@/lib/payments/adapters/mock-smartpos-adapter";
import type { PaymentMockScenario } from "@/lib/payments/types";
import { requireAdmin } from "@/lib/server-auth";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  const adapter = new MockSmartPOSAdapter(
    (body.scenario || "approved") as PaymentMockScenario,
  );
  try {
    const result = await adapter.charge({
      saleId: Number(body.saleId) || undefined,
      amount: Number(body.amount),
      paymentType: body.paymentType || "PIX",
      externalReference: body.externalReference || `TEST-${Date.now()}`,
    });
    const persistence = await auth.admin.from("payment_transactions").insert({
      sale_id: Number(body.saleId) || null,
      provider: result.provider,
      payment_type: result.paymentType,
      amount: result.amount,
      status: result.status,
      transaction_id: result.transactionId || null,
      authorization_code: result.authorizationCode || null,
      terminal_id: result.terminalId || null,
      acquirer_cnpj: result.acquirerCnpj || null,
      card_brand: result.cardBrand || null,
      external_reference: result.externalReference || null,
      raw_response: {
        provider: result.provider,
        status: result.status,
        paymentType: result.paymentType,
        transactionId: result.transactionId,
      },
      created_by: auth.user.id,
    });
    return Response.json({
      result,
      persisted: !persistence.error,
      persistenceWarning: persistence.error?.message || null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha mock" },
      { status: 408 },
    );
  }
}
