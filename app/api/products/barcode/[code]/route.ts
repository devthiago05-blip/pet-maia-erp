import { requireAuthenticatedUser } from "@/lib/server-auth";

export const runtime = "nodejs";

interface OpenProduct {
  product_name?: string;
  product_name_pt?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  quantity?: string;
  image_front_url?: string;
  image_url?: string;
}

async function lookup(baseUrl: string, code: string) {
  const url = `${baseUrl}/api/v2/product/${code}.json?fields=product_name,product_name_pt,generic_name,brands,categories,quantity,image_front_url,image_url`;
  const response = await fetch(url, {
    headers: { "User-Agent": "PetMaiaERP/1.0 (https://github.com/devthiago05-blip/pet-maia-erp)" },
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { status?: number; product?: OpenProduct };
  return payload.status === 1 && payload.product ? payload.product : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const auth = await requireAuthenticatedUser(request);
  if ("error" in auth) return Response.json({ error: auth.error }, { status: auth.status });

  const code = (await params).code.replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(code)) {
    return Response.json({ error: "Informe um código de barras com 8 a 14 dígitos." }, { status: 400 });
  }

  try {
    let source = "Open Pet Food Facts";
    let product = await lookup("https://world.openpetfoodfacts.org", code);
    if (!product) {
      source = "Open Food Facts";
      product = await lookup("https://world.openfoodfacts.org", code);
    }
    if (!product) return Response.json({ found: false, code });

    const name = product.product_name_pt || product.product_name || product.generic_name || "";
    const combined = `${name} ${product.categories || ""}`.toLowerCase();
    const isPetFood = source === "Open Pet Food Facts" || /(dog|cat|cão|gato|pet food|ração|petisco|sachê)/i.test(combined);

    return Response.json({
      found: true,
      code,
      name,
      brand: product.brands?.split(",")[0]?.trim() || "",
      categories: product.categories || "",
      quantity: product.quantity || "",
      imageUrl: product.image_front_url || product.image_url || "",
      ncmSuggestion: isPetFood ? "23091000" : null,
      ncmReason: isPetFood ? "Alimento para cães ou gatos, acondicionado para venda a retalho" : null,
      source,
    });
  } catch {
    return Response.json({ error: "A consulta externa demorou demais. Tente novamente." }, { status: 504 });
  }
}
