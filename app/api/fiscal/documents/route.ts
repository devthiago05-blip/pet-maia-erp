import { requireAdmin } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const url = new URL(request.url);
  let query = auth.admin
    .from("nfce_documents")
    .select(
      "id,environment,number,series,access_key,status,issued_at,total,customer_name,customer_cpf,sefaz_status_code,sefaz_message,xml_path,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  const status = url.searchParams.get("status");
  if (year) {
    const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
    const end = new Date(Date.UTC(year, month || 12, 1));
    query = query
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
  }
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return Response.json({ documents: [], warning: error.message });
  return Response.json({ documents: data || [] });
}
