import { NextResponse } from "next/server";

import { requireAuthenticatedUser } from "@/lib/server-auth";
import type {
  RecognizedPurchaseDocument,
  RecognizedPurchaseItem,
} from "@/types/purchase-recognition";

export const runtime = "nodejs";
export const maxDuration = 60;

const paymentNames: Record<string, string> = {
  "01": "Dinheiro",
  "03": "Cartão de crédito",
  "04": "Cartão de débito",
  "15": "Boleto",
  "17": "PIX",
  "18": "Transferência",
};

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedUser(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado." },
        { status: 400 },
      );
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "O arquivo deve ter no máximo 15 MB." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = file.name.split(".").pop()?.toLowerCase();
    let text = "";
    let source: RecognizedPurchaseDocument["source"] = "text";

    if (extension === "xml" || file.type.includes("xml")) {
      text = new TextDecoder("utf-8").decode(bytes);
      return NextResponse.json(parseNfeXml(text));
    }

    if (extension === "pdf" || file.type === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: bytes });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
      source = "pdf";
    } else if (file.type.startsWith("image/")) {
      text = await recognizeInvoiceImage(bytes);
      source = "image";
    } else {
      text = new TextDecoder("utf-8").decode(bytes);
    }

    return NextResponse.json(parseReceiptText(text, source));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Não foi possível reconhecer o documento. Tente XML, PDF com texto ou uma foto mais nítida.",
      },
      { status: 422 },
    );
  }
}

async function recognizeInvoiceImage(bytes: Uint8Array) {
  const [{ default: sharp }, { createWorker, PSM }] = await Promise.all([
    import("sharp"),
    import("tesseract.js"),
  ]);
  const image = sharp(Buffer.from(bytes)).autoOrient();
  const metadata = await image.metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 1600;
  const targetWidth = Math.min(1800, Math.round(width * 1.8));
  const fullImage = await image
    .clone()
    .resize({ width: targetWidth })
    .grayscale()
    .normalize()
    .sharpen()
    .toBuffer();
  const tableTop = Math.max(0, Math.round(height * 0.35));
  const tableHeight = Math.min(
    height - tableTop,
    Math.max(200, Math.round(height * 0.42)),
  );
  const tableImage = await image
    .clone()
    .extract({ left: 0, top: tableTop, width, height: tableHeight })
    .resize({ width: targetWidth })
    .grayscale()
    .normalize()
    .sharpen()
    .toBuffer();

  const worker = await createWorker("por", undefined, {
    cachePath: process.env.VERCEL ? "/tmp" : process.cwd(),
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
    const fullResult = await worker.recognize(fullImage);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });
    const tableResult = await worker.recognize(tableImage);
    return `${fullResult.data.text}\nOCR_TABLE_START\n${tableResult.data.text}`;
  } finally {
    await worker.terminate();
  }
}

function parseNfeXml(xml: string): RecognizedPurchaseDocument {
  const items = Array.from(xml.matchAll(/<det\b[^>]*>([\s\S]*?)<\/det>/gi)).map(
    (match) => {
      const block = match[1];
      const quantity = numberTag(block, "qCom") || 1;
      const total = numberTag(block, "vProd");
      return {
        description: decodeXml(tag(block, "xProd") || "Item sem descrição"),
        quantity,
        unitCost: numberTag(block, "vUnCom") || total / quantity,
        total,
        barcode: tag(block, "cEAN")?.replace(/^SEM GTIN$/i, "") || undefined,
      };
    },
  );
  const paymentCode = tag(xml, "tPag") || "";
  return {
    documentNumber: tag(xml, "nNF"),
    supplierName: decodeXml(tag(xml, "xNome") || ""),
    supplierDocument: tag(xml, "CNPJ") || tag(xml, "CPF"),
    purchaseDate: dateOnly(tag(xml, "dhEmi") || tag(xml, "dEmi")),
    dueDate: dateOnly(tag(xml, "dVenc")),
    paymentMethod: paymentNames[paymentCode],
    total: numberTag(xml, "vNF") || sumItems(items),
    items,
    source: "xml",
    warnings: items.length ? [] : ["Nenhum item foi encontrado no XML."],
  };
}

function parseReceiptText(
  text: string,
  source: RecognizedPurchaseDocument["source"],
): RecognizedPurchaseDocument {
  const normalizedLines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const items: RecognizedPurchaseItem[] = [];
  const itemPattern =
    /^(.{3,}?)\s+(\d+(?:[.,]\d+)?)\s+(?:UN|UND|UNID|CX|KG|LT|ML|PC|PCT)?\s*(\d+[.,]\d{2,4})\s+(\d+[.,]\d{2})$/i;
  for (const line of normalizedLines) {
    const match = line.match(itemPattern);
    if (!match) continue;
    const quantity = parseNumber(match[2]);
    const unitCost = parseNumber(match[3]);
    const total = parseNumber(match[4]);
    if (quantity > 0 && total >= 0)
      items.push({
        description: match[1],
        quantity,
        unitCost: unitCost || total / quantity,
        total,
      });
  }
  const tableMarker = normalizedLines.indexOf("OCR_TABLE_START");
  items.push(
    ...parseInvoiceTableItems(
      tableMarker >= 0
        ? normalizedLines.slice(tableMarker + 1)
        : normalizedLines,
    ),
  );
  const uniqueItems = Array.from(
    new Map(
      items.map((item) => [
        `${normalizeItemKey(item.description)}-${item.quantity}-${item.total}`,
        item,
      ]),
    ).values(),
  );
  const joined = normalizedLines.join("\n");
  const totalMatch = joined.match(
    /(?:TOTAL(?:\s+DA\s+NOTA)?|VALOR\s+TOTAL)\D{0,12}(\d+[.,]\d{2})/i,
  );
  const dateMatch = joined.match(/\b(\d{2})[\/.\-](\d{2})[\/.\-](\d{4})\b/);
  const documentMatch = joined.match(
    /(?:N[ÚU]MERO|NOTA|NF|NFC-?E)\D{0,8}(\d{2,})/i,
  );
  const paymentMatch = joined.match(
    /\b(PIX|BOLETO|DINHEIRO|CART[AÃ]O\s+(?:DE\s+)?CR[ÉE]DITO|CART[AÃ]O\s+(?:DE\s+)?D[ÉE]BITO|TRANSFER[ÊE]NCIA)\b/i,
  );
  return {
    documentNumber: documentMatch?.[1],
    purchaseDate: dateMatch
      ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
      : undefined,
    paymentMethod: paymentMatch?.[1],
    total: totalMatch ? parseNumber(totalMatch[1]) : sumItems(uniqueItems),
    items: uniqueItems,
    source,
    warnings: uniqueItems.length
      ? ["Confira os itens reconhecidos antes de finalizar."]
      : [
          "O cabeçalho foi lido, mas os itens precisam ser informados ou ajustados manualmente.",
        ],
  };
}

function parseInvoiceTableItems(lines: string[]): RecognizedPurchaseItem[] {
  const found: RecognizedPurchaseItem[] = [];
  const productPattern = /([A-ZÀ-Ú][A-ZÀ-Ú0-9 ./+-]{3,}?)\W*LOTE\b/i;

  for (const rawLine of lines) {
    const line = rawLine.replace(/[|[\]]/g, " ").replace(/\s+/g, " ");
    const product = line.match(productPattern);
    if (!product) continue;
    const unitPosition = line.toUpperCase().lastIndexOf("UN");
    if (unitPosition < 0) continue;
    const values = line.slice(unitPosition + 2).match(/\d+[.,]?\d*/g) || [];
    if (values.length < 3) continue;

    const rawUnitCost = parseInvoiceMoney(values[1]!);
    const rawTotal = parseInvoiceMoney(values[2]!);
    const quantityOptions = parseInvoiceQuantityOptions(values[0]!);
    const quantity =
      quantityOptions.reduce((best, option) =>
        Math.abs(option * rawUnitCost - rawTotal) <
        Math.abs(best * rawUnitCost - rawTotal)
          ? option
          : best,
      ) || 1;
    const expectedTotal = quantity * rawUnitCost;
    const differenceRatio =
      rawTotal > 0 ? Math.abs(rawTotal - expectedTotal) / rawTotal : 1;
    const trustTotal =
      differenceRatio <= 0.08 || rawTotal > expectedTotal * 1.5;
    const total = trustTotal ? rawTotal : expectedTotal;
    const unitCost = trustTotal ? total / quantity : rawUnitCost;

    if (quantity > 0 && unitCost > 0 && total > 0) {
      found.push({
        description: cleanOcrDescription(product[1]),
        quantity,
        unitCost,
        total,
      });
    }
  }
  return found;
}

function parseInvoiceQuantityOptions(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^[1-9]000$/.test(digits)) return [Number(digits) / 1000];
  const parsed = parseNumber(value);
  const options = [parsed > 100 ? parsed / 1000 : parsed];
  if (!/[.,]/.test(value) && parsed >= 10 && parsed < 100) {
    options.push(parsed / 10);
  }
  return options.filter((option) => option > 0);
}

function parseInvoiceMoney(value: string) {
  if (!/[.,]/.test(value)) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 3 ? Number(digits) / 100 : Number(digits);
  }
  return parseNumber(value);
}

function cleanOcrDescription(value: string) {
  return value
    .replace(/^\d+\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .replace(/^(?:[A-Z0-9]{1,2}\s+)+/, "");
}

function normalizeItemKey(value: string) {
  return value.replace(/[^A-Z0-9]/gi, "").toLowerCase();
}

function tag(xml: string, name: string) {
  return xml
    .match(
      new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"),
    )?.[1]
    ?.trim();
}
function numberTag(xml: string, name: string) {
  return parseNumber(tag(xml, name) || "0");
}
function parseNumber(value: string) {
  const clean = value.trim().replace(/\s/g, "");
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  return Number(normalized) || 0;
}
function dateOnly(value?: string) {
  return value?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}
function sumItems(items: RecognizedPurchaseItem[]) {
  return Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
}
function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
