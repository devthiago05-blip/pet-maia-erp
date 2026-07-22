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
      const { recognize } = await import("tesseract.js");
      const result = await recognize(Buffer.from(bytes), "por");
      text = result.data.text;
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
    total: totalMatch ? parseNumber(totalMatch[1]) : sumItems(items),
    items,
    source,
    warnings: items.length
      ? ["Confira os itens reconhecidos antes de finalizar."]
      : [
          "O cabeçalho foi lido, mas os itens precisam ser informados ou ajustados manualmente.",
        ],
  };
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
