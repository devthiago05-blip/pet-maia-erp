import { getNfceConfig } from "@/lib/nfce/config";
import { MockSmartPOSAdapter } from "@/lib/payments/adapters/mock-smartpos-adapter";
import { getPaymentConfig } from "@/lib/payments/config";
import type { PaymentRequest } from "@/lib/payments/types";
import { requireAuthenticatedUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const config = getPaymentConfig();
  return Response.json({
    enabled: config.enabled,
    provider: config.provider,
    nfceEnabled: getNfceConfig().enabled,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const config = getPaymentConfig();
  if (!config.enabled) return Response.json({ enabled: false, result: null });
  if (config.provider !== "mock") {
    return Response.json(
      { error: "Provider de pagamento real ainda não habilitado." },
      { status: 503 },
    );
  }
  const body = (await request.json()) as PaymentRequest;
  try {
    const result = await new MockSmartPOSAdapter(config.scenario).charge(body);
    const persistence = await auth.admin
      .from("payment_transactions")
      .insert({
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
      })
      .select("id")
      .single();
    return Response.json({
      enabled: true,
      result,
      recordId: persistence.data?.id || null,
      persistenceWarning: persistence.error?.message || null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha no SmartPOS." },
      { status: 408 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const body = await request.json();
  if (
    !Number.isSafeInteger(Number(body.saleId)) ||
    !Array.isArray(body.recordIds)
  ) {
    return Response.json(
      { error: "Vínculo de pagamento inválido." },
      { status: 400 },
    );
  }
  const { error } = await auth.admin
    .from("payment_transactions")
    .update({
      sale_id: Number(body.saleId),
      updated_at: new Date().toISOString(),
    })
    .in("id", body.recordIds)
    .eq("created_by", auth.user.id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ linked: true });
}
