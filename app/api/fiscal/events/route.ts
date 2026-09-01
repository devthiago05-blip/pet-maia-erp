import { requireAdmin } from "@/lib/server-auth";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth)
    return Response.json({ error: auth.error }, { status: auth.status });
  const { data, error } = await auth.admin
    .from("nfce_events")
    .select(
      "id,document_id,environment,event_type,status,status_code,message,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return Response.json({ events: [], warning: error.message });
  return Response.json({ events: data || [] });
}
