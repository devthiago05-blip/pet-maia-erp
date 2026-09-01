import JSZip from "jszip";

import { requireAdmin } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  if (
    !year ||
    year < 2000 ||
    year > 2100 ||
    (month && (month < 1 || month > 12))
  ) {
    return Response.json({ error: "Ano ou mês inválido." }, { status: 400 });
  }
  const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
  const end = new Date(Date.UTC(year, month || 12, 1));
  const { data, error } = await auth.admin
    .from("nfce_documents")
    .select("number,access_key,signed_xml,xml")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());
  if (error) return Response.json({ error: error.message }, { status: 400 });
  const zip = new JSZip();
  for (const document of data || []) {
    zip.file(
      `${document.access_key || `nfce-${document.number}`}.xml`,
      document.signed_xml || document.xml || "",
    );
  }
  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  const name = `NFCE-${year}${month ? `-${String(month).padStart(2, "0")}` : ""}.zip`;
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
