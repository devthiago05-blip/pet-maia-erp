import { NextResponse } from "next/server";

import {
  createSiteAccessorySearchFilters,
  getSiteAccessoryKindFromText,
  type SiteAccessoryKind,
  siteAccessoryKinds,
} from "@/lib/site-accessory-kinds";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface AccessoryProductRow {
  id: number;
  nome?: string | null;
  categoria?: string | null;
  preco_venda?: number | string | null;
  estoque?: number | string | null;
  image_url?: string | null;
  tamanho?: string | null;
  cor?: string | null;
  ativo?: boolean | null;
}

interface ClinicSettingsRow {
  nome?: string | null;
  telefone?: string | null;
}

const kindOrder = Object.fromEntries(
  siteAccessoryKinds.map((kind, index) => [kind, index + 1]),
) as Record<SiteAccessoryKind, number>;

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getAccessoryKind(product: AccessoryProductRow): SiteAccessoryKind {
  return getSiteAccessoryKindFromText(
    `${product.nome || ""} ${product.categoria || ""}`,
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    const [productsResponse, settingsResponse] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,nome,categoria,preco_venda,estoque,image_url,tamanho,cor,ativo",
        )
        .or(createSiteAccessorySearchFilters().join(","))
        .order("nome"),
      supabase
        .from("clinic_settings")
        .select("nome,telefone")
        .limit(1)
        .maybeSingle(),
    ]);

    if (productsResponse.error) {
      console.error(productsResponse.error);

      return NextResponse.json(
        { error: "Não foi possível carregar os adereços." },
        { status: 500 },
      );
    }

    const settings = settingsResponse.data as ClinicSettingsRow | null;
    const products = (productsResponse.data || []) as AccessoryProductRow[];
    const items = products
      .map((product) => {
        const kind = getAccessoryKind(product);

        return {
          id: product.id,
          name: product.nome || "Adereço",
          kind,
          price: toNumber(product.preco_venda),
          stock: toNumber(product.estoque),
          imageUrl: product.image_url || "",
          detail: [product.tamanho, product.cor].filter(Boolean).join(" · "),
        };
      })
      .filter((item, index) => {
        const product = products[index];

        return product.ativo !== false && item.stock > 0 && item.imageUrl;
      })
      .sort(
        (left, right) =>
          kindOrder[left.kind] - kindOrder[right.kind] ||
          left.name.localeCompare(right.name, "pt-BR"),
      );

    return NextResponse.json(
      {
        clinic: {
          name: settings?.nome || "Pet Maia",
          phone: settings?.telefone || "",
        },
        items,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Não foi possível carregar o catálogo." },
      { status: 500 },
    );
  }
}
