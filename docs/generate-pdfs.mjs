import fs from "node:fs";

function sanitize(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

function wrap(text, maxLength) {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxLength) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function parseMarkdown(markdown) {
  return markdown.split(/\r?\n/).map((rawLine) => {
    const line = rawLine.trimEnd();

    if (!line.trim() || line.startsWith("```")) return { type: "blank" };
    if (line.startsWith("# ")) return { type: "h1", text: line.slice(2) };
    if (line.startsWith("## ")) return { type: "h2", text: line.slice(3) };
    if (line.startsWith("### ")) return { type: "h3", text: line.slice(4) };
    if (/^\d+\.\s+/.test(line)) {
      return { type: "li", text: line.replace(/^\d+\.\s+/, "") };
    }
    if (line.startsWith("- ")) return { type: "li", text: line.slice(2) };
    return { type: "p", text: line };
  });
}

function createPdfFromMarkdown(inputFile, outputFile) {
  const items = parseMarkdown(fs.readFileSync(inputFile, "utf8"));
  const pages = [];
  let operations = [];
  let y = 780;
  const left = 54;

  function newPage() {
    if (operations.length) pages.push(operations);
    operations = [];
    y = 780;
  }

  function text(line, x, size, leading, font = "F1") {
    operations.push(`BT /${font} ${size} Tf ${x} ${y} Td (${sanitize(line)}) Tj ET`);
    y -= leading;
  }

  function ensure(height) {
    if (y - height < 54) newPage();
  }

  for (const item of items) {
    if (item.type === "blank") {
      y -= 8;
      continue;
    }

    if (item.type === "h1") {
      ensure(70);
      operations.push("0.54 0.05 0.92 rg");
      text(item.text, left, 22, 30, "F2");
      operations.push("0 0 0 rg");
      y -= 8;
      continue;
    }

    if (item.type === "h2") {
      ensure(48);
      operations.push("0.54 0.05 0.92 rg");
      text(item.text, left, 16, 24, "F2");
      operations.push("0 0 0 rg");
      continue;
    }

    if (item.type === "h3") {
      ensure(34);
      text(item.text, left, 13, 20, "F2");
      continue;
    }

    if (item.type === "li") {
      for (const [index, line] of wrap(item.text, 86).entries()) {
        ensure(18);
        text(`${index ? "  " : "- "}${line}`, left + (index ? 12 : 0), 10.5, 15);
      }
      continue;
    }

    for (const line of wrap(item.text, 92)) {
      ensure(18);
      text(line, left, 10.5, 15);
    }
    y -= 2;
  }

  if (operations.length) pages.push(operations);

  const objects = [];
  function addObject(value) {
    objects.push(value);
    return objects.length;
  }

  const fontRegular = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBold = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const pageIds = [];

  for (let index = 0; index < pages.length; index += 1) {
    let content = pages[index].join("\n");
    content += `\nBT /F1 9 Tf 285 28 Td (${index + 1}) Tj ET`;
    const stream = addObject(
      `<< /Length ${Buffer.byteLength(content, "binary")} >>\nstream\n${content}\nendstream`,
    );
    const page = addObject(
      `<< /Type /Page /Parent PAGES_ID 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${stream} 0 R >>`,
    );
    pageIds.push(page);
  }

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${
      pageIds.length
    } >>`,
  );
  const catalog = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  for (const pageId of pageIds) {
    objects[pageId - 1] = objects[pageId - 1].replace("PAGES_ID", String(pagesId));
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  fs.writeFileSync(outputFile, pdf, "binary");
}

createPdfFromMarkdown("docs/MANUAL_USO_PET_MAIA_ERP.md", "docs/MANUAL_USO_PET_MAIA_ERP.pdf");
createPdfFromMarkdown(
  "docs/PROXIMOS_PASSOS_PET_MAIA_ERP.md",
  "docs/PROXIMOS_PASSOS_PET_MAIA_ERP.pdf",
);

console.log("PDFs gerados em docs/");
