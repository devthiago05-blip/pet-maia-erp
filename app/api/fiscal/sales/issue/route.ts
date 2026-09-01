import { storeAuthorizedFiscalXml } from "@/lib/fiscal-xml-storage";
import { SefazMockAdapter } from "@/lib/nfce/adapters/sefaz-mock-adapter";
import { getNfceConfig } from "@/lib/nfce/config";
import { generateDanfeMock } from "@/lib/nfce/danfe";
import { signXmlMock } from "@/lib/nfce/mock-signature";
import { generateMockQrCode } from "@/lib/nfce/qr-code";
import type { FiscalProductProfile, NfcePaymentInput } from "@/lib/nfce/types";
import { buildNfceXml } from "@/lib/nfce/xml-builder";
import { requireAuthenticatedUser } from "@/lib/server-auth";

interface SaleItemRow {
  product_id: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  products?: {
    id: number;
    nome: string;
    sku?: string;
    barcode?: string;
    fiscal_product_profiles?: Array<
      Record<string, string | number | boolean | null | undefined>
    >;
  } | null;
}

interface SaleRow {
  id: number;
  cliente_nome?: string;
  total: number;
  change_amount?: number;
  forma_pagamento: string;
  tutors?: { nome?: string; cpf?: string } | null;
  pos_sale_items: SaleItemRow[];
  pos_sale_payments?: Array<{ payment_method: string; amount: number }>;
}

type SettingsRow = Record<string, string | number | null | undefined>;

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function numericValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentMethod(value: string): NfcePaymentInput["method"] {
  const method = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (method.includes("dinheiro")) return "Dinheiro";
  if (method.includes("pix")) return "PIX";
  if (method.includes("credito")) return "Crédito";
  if (method.includes("debito")) return "Débito";
  if (method.includes("voucher")) return "Voucher";
  return "Outros";
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const config = getNfceConfig();
  if (!config.enabled) {
    return Response.json({ error: "NFC-e está desativada." }, { status: 409 });
  }
  if (config.environment === "producao") {
    return Response.json(
      { error: "Emissão de produção permanece bloqueada." },
      { status: 403 },
    );
  }
  const { saleId } = await request.json();
  if (!Number.isSafeInteger(Number(saleId))) {
    return Response.json({ error: "Venda inválida." }, { status: 400 });
  }
  const [saleResult, settingsResult, transactionResult] = await Promise.all([
    auth.admin
      .from("pos_sales")
      .select(
        "id,tutor_id,cliente_nome,total,discount_amount,change_amount,forma_pagamento,created_at,tutors(nome,cpf),pos_sale_items(product_id,descricao,quantidade,valor_unitario,products(id,nome,sku,barcode,fiscal_product_profiles(*))),pos_sale_payments(payment_method,amount)",
      )
      .eq("id", Number(saleId))
      .single(),
    auth.admin.from("clinic_settings").select("*").eq("id", 1).single(),
    auth.admin
      .from("payment_transactions")
      .select("*")
      .eq("sale_id", Number(saleId))
      .eq("status", "approved"),
  ]);
  if (saleResult.error || !saleResult.data) {
    return Response.json({ error: "Venda não encontrada." }, { status: 404 });
  }
  if (settingsResult.error || !settingsResult.data) {
    return Response.json(
      { error: "Configuração fiscal ausente." },
      { status: 400 },
    );
  }
  const sale = saleResult.data as unknown as SaleRow;
  const settings = settingsResult.data as unknown as SettingsRow;
  try {
    const numberResult = await auth.admin.rpc("reserve_nfce_number", {
      selected_environment: "mock",
      selected_series: Number(settings.nfce_series || 1),
      initial_number: Number(settings.nfce_next_number || 1),
    });
    if (numberResult.error) throw numberResult.error;
    const paymentsSource = sale.pos_sale_payments?.length
      ? sale.pos_sale_payments
      : [{ payment_method: sale.forma_pagamento, amount: sale.total }];
    const transactions = transactionResult.data || [];
    const payments: NfcePaymentInput[] = paymentsSource.map(
      (payment: { payment_method: string; amount: number }) => {
        const transaction = transactions.find(
          (item) =>
            paymentMethod(item.payment_type) ===
            paymentMethod(payment.payment_method),
        );
        return {
          method: paymentMethod(payment.payment_method),
          amount: Number(payment.amount),
          integrated: Boolean(transaction),
          transactionId: transaction?.transaction_id || undefined,
          authorizationCode: transaction?.authorization_code || undefined,
          terminalId: transaction?.terminal_id || undefined,
          acquirerCnpj: transaction?.acquirer_cnpj || undefined,
          cardBrand: transaction?.card_brand || undefined,
        };
      },
    );
    const items = sale.pos_sale_items.map((item) => {
      const product = item.products;
      const row = product?.fiscal_product_profiles?.[0];
      const profile: FiscalProductProfile = {
        productId: Number(item.product_id),
        gtin: optionalString(row?.gtin) || product?.barcode || null,
        ncm: optionalString(row?.ncm),
        cest: optionalString(row?.cest),
        cfop: optionalString(row?.cfop),
        cstIcms: optionalString(row?.cst_icms),
        csosn: optionalString(row?.csosn),
        origin: optionalString(row?.origin),
        commercialUnit: optionalString(row?.commercial_unit),
        taxUnit: optionalString(row?.tax_unit),
        icmsRate: numericValue(row?.icms_rate),
        pisCst: optionalString(row?.pis_cst),
        pisRate: numericValue(row?.pis_rate),
        cofinsCst: optionalString(row?.cofins_cst),
        cofinsRate: numericValue(row?.cofins_rate),
        taxStatus:
          row?.tax_status === "complete" || row?.tax_status === "review"
            ? row.tax_status
            : "incomplete",
        accountantValidated: row?.accountant_validated === true,
      };
      return {
        productId: Number(item.product_id),
        code: product?.sku || String(item.product_id),
        description: item.descricao,
        quantity: Number(item.quantidade),
        unitPrice: Number(item.valor_unitario),
        discount: 0,
        profile,
      };
    });
    const issuedAt = new Date();
    const taxRegime =
      String(settings.regime_tributario) === "2"
        ? "2"
        : String(settings.regime_tributario) === "3"
          ? "3"
          : "1";
    const built = buildNfceXml({
      environment: "mock",
      ufCode: "23",
      municipalityCode: String(settings.codigo_municipio_ibge || ""),
      issuer: {
        cnpj: String(settings.cnpj || "").replace(/\D/g, ""),
        legalName: String(settings.razao_social || ""),
        tradeName: String(settings.nome_fantasia || settings.nome || ""),
        stateRegistration: String(settings.inscricao_estadual || ""),
        taxRegime,
        address: String(settings.endereco || ""),
        number: String(settings.endereco_numero || "S/N"),
        district: String(settings.bairro || ""),
        city: String(settings.municipio || ""),
        state: String(settings.uf || "CE"),
        postalCode: String(settings.cep || ""),
      },
      number: Number(numberResult.data),
      series: Number(settings.nfce_series || 1),
      issuedAt,
      customerCpf: sale.tutors?.cpf || undefined,
      customerName: sale.cliente_nome || sale.tutors?.nome || undefined,
      items,
      payments,
      changeAmount: Number(sale.change_amount || 0),
    });
    const signed = signXmlMock(built.xml);
    const sefaz = await new SefazMockAdapter("authorized").authorize({
      documentId: `sale-${sale.id}`,
      accessKey: built.accessKey,
      xml: signed.signedXml,
    });
    const qr = await generateMockQrCode(built.accessKey);
    const danfe = await generateDanfeMock({
      accessKey: built.accessKey,
      number: Number(numberResult.data),
      series: Number(settings.nfce_series || 1),
      issuerName: String(settings.razao_social || "EMITENTE MOCK"),
      total: built.totals.total,
      issuedAt,
      items,
      qrCodeDataUrl: qr.dataUrl,
    });
    const documentResult = await auth.admin
      .from("nfce_documents")
      .insert({
        sale_id: sale.id,
        environment: "mock",
        provider: "mock",
        is_fiscal_valid: false,
        number: Number(numberResult.data),
        series: Number(settings.nfce_series || 1),
        access_key: built.accessKey,
        status: "authorized",
        xml: built.xml,
        signed_xml: signed.signedXml,
        subtotal: built.totals.subtotal,
        discount_amount: built.totals.discount,
        total: built.totals.total,
        change_amount: Number(sale.change_amount || 0),
        customer_cpf: sale.tutors?.cpf || null,
        customer_name: sale.cliente_nome || sale.tutors?.nome || null,
        sefaz_protocol: sefaz.protocol,
        sefaz_status_code: sefaz.cStat,
        sefaz_message: sefaz.message,
        issued_at: issuedAt.toISOString(),
        authorized_at: sefaz.receivedAt,
        created_by: auth.user.id,
      })
      .select("id")
      .single();
    if (documentResult.error) throw documentResult.error;
    const storage = await storeAuthorizedFiscalXml(auth.admin, {
      environment: "mock",
      accessKey: built.accessKey,
      xml: signed.signedXml,
      issuedAt,
    });
    const year = issuedAt.getUTCFullYear();
    const month = String(issuedAt.getUTCMonth() + 1).padStart(2, "0");
    const danfePath = `nfce/mock/${year}/${month}/${built.accessKey}.pdf`;
    const danfeUpload = await auth.admin.storage
      .from("fiscal-danfe")
      .upload(danfePath, danfe, {
        contentType: "application/pdf",
        upsert: false,
      });
    await Promise.all([
      auth.admin
        .from("nfce_documents")
        .update({
          xml_path: storage.error ? null : storage.path,
          authorized_xml_path: storage.error ? null : storage.path,
          danfe_path: danfeUpload.error ? null : danfePath,
        })
        .eq("id", documentResult.data.id),
      auth.admin.from("nfce_events").insert({
        document_id: documentResult.data.id,
        environment: "mock",
        event_type: "authorize",
        status: "authorized",
        status_code: sefaz.cStat,
        message: sefaz.message,
        metadata: { saleId: sale.id },
        created_by: auth.user.id,
      }),
    ]);
    return Response.json({
      documentId: documentResult.data.id,
      cStat: sefaz.cStat,
      message: sefaz.message,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao emitir NFC-e MOCK.",
      },
      { status: 400 },
    );
  }
}
