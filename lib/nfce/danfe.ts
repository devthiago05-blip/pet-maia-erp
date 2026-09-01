import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateDanfeMock(input: {
  accessKey: string;
  number: number;
  series: number;
  issuerName: string;
  total: number;
  issuedAt: Date;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  qrCodeDataUrl?: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([226.8, 700]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 672;
  page.drawText("SEM VALOR FISCAL", {
    x: 38,
    y,
    size: 18,
    font: bold,
    color: rgb(0.75, 0, 0),
  });
  y -= 24;
  page.drawText("AMBIENTE MOCK / HOMOLOGAÇÃO", {
    x: 22,
    y,
    size: 10,
    font: bold,
  });
  y -= 24;
  page.drawText(input.issuerName.slice(0, 38), {
    x: 12,
    y,
    size: 10,
    font: bold,
  });
  y -= 18;
  page.drawText(
    `NFC-e ${String(input.number).padStart(9, "0")}  Série ${input.series}`,
    { x: 12, y, size: 8, font },
  );
  y -= 14;
  page.drawText(input.issuedAt.toLocaleString("pt-BR"), {
    x: 12,
    y,
    size: 8,
    font,
  });
  y -= 20;
  page.drawText("ITENS", { x: 12, y, size: 9, font: bold });
  for (const item of input.items.slice(0, 25)) {
    y -= 14;
    page.drawText(item.description.slice(0, 25), { x: 12, y, size: 7, font });
    page.drawText(
      `${item.quantity.toFixed(3)} x ${item.unitPrice.toFixed(2)}`,
      { x: 125, y, size: 7, font },
    );
  }
  y -= 24;
  page.drawText(`TOTAL R$ ${input.total.toFixed(2)}`, {
    x: 80,
    y,
    size: 12,
    font: bold,
  });
  y -= 22;
  page.drawText("CHAVE DE ACESSO", { x: 12, y, size: 8, font: bold });
  y -= 12;
  page.drawText(input.accessKey, { x: 12, y, size: 6.5, font });
  if (input.qrCodeDataUrl) {
    const bytes = Buffer.from(input.qrCodeDataUrl.split(",")[1], "base64");
    const image = await pdf.embedPng(bytes);
    page.drawImage(image, {
      x: 63,
      y: Math.max(20, y - 145),
      width: 100,
      height: 100,
    });
  }
  return pdf.save();
}
