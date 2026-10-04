import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccessoryKind = "Bandana" | "Lacinho" | "Adesivo";

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

const kindOrder: Record<AccessoryKind, number> = {
  Bandana: 1,
  Lacinho: 2,
  Adesivo: 3,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getAccessoryKind(product: AccessoryProductRow): AccessoryKind {
  const text = normalizeText(
    `${product.nome || ""} ${product.categoria || ""}`,
  );

  if (text.includes("adesivo") || text.includes("sticker")) {
    return "Adesivo";
  }

  if (text.includes("lacinho") || text.includes("laco")) {
    return "Lacinho";
  }

  return "Bandana";
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
        .or(
          [
            "categoria.ilike.%Bandana%",
            "categoria.ilike.%Lacinho%",
            "categoria.ilike.%Laco%",
            "categoria.ilike.%Laço%",
            "categoria.ilike.%Adesivo%",
            "categoria.ilike.%Adesivos%",
            "categoria.ilike.%Sticker%",
            "nome.ilike.%Bandana%",
            "nome.ilike.%Lacinho%",
            "nome.ilike.%Laco%",
            "nome.ilike.%Laço%",
            "nome.ilike.%Adesivo%",
            "nome.ilike.%Adesivos%",
            "nome.ilike.%Sticker%",
          ].join(","),
        )
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
