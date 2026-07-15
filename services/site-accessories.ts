import { supabase } from "@/lib/supabase";
import type { Product } from "@/types/domain";

export type SiteAccessoryKind = "Bandana" | "Lacinho";

export interface SiteAccessoryInput {
  kind: SiteAccessoryKind;
  nome: string;
  estoque: number;
  image_url: string | null;
}

const siteAccessoriesBucket = "site-accessories";

function createAccessoryCode(kind: SiteAccessoryKind) {
  const prefix = kind === "Bandana" ? "BANDANA" : "LACINHO";
  return `SITE-${prefix}-${Date.now()}`;
}

export function getSiteAccessoryKind(product: Product): SiteAccessoryKind {
  const text = `${product.nome || ""} ${product.categoria || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return text.includes("lacinho") || text.includes("laco")
    ? "Lacinho"
    : "Bandana";
}

export function isVisibleOnSite(product: Product) {
  return Boolean(product.ativo && product.estoque > 0 && product.image_url);
}

export async function fetchSiteAccessories() {
  return supabase
    .from("products")
    .select("*")
    .or(
      [
        "categoria.ilike.%Bandana%",
        "categoria.ilike.%Lacinho%",
        "categoria.ilike.%Laco%",
        "categoria.ilike.%Laço%",
        "nome.ilike.%Bandana%",
        "nome.ilike.%Lacinho%",
        "nome.ilike.%Laco%",
        "nome.ilike.%Laço%",
      ].join(","),
    )
    .order("nome")
    .returns<Product[]>();
}

export async function uploadSiteAccessoryImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return {
      data: null,
      error: new Error("Selecione uma imagem valida."),
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `accessories/${crypto.randomUUID()}.${extension}`;
  const uploadResponse = await supabase.storage
    .from(siteAccessoriesBucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResponse.error) {
    return { data: null, error: uploadResponse.error };
  }

  const publicUrlResponse = supabase.storage
    .from(siteAccessoriesBucket)
    .getPublicUrl(storagePath);

  return {
    data: publicUrlResponse.data.publicUrl,
    error: null,
  };
}

export async function createSiteAccessory(input: SiteAccessoryInput) {
  const code = createAccessoryCode(input.kind);
  const name = input.nome.trim();

  return supabase.from("products").insert([
    {
      nome: name,
      name,
      sku: code,
      barcode: code,
      categoria: input.kind,
      category: input.kind,
      preco_custo: 0,
      cost_price: 0,
      preco_venda: 0,
      sale_price: 0,
      profit_margin: 0,
      estoque: input.estoque,
      stock_quantity: input.estoque,
      estoque_minimo: 0,
      minimum_stock: 0,
      image_url: input.image_url,
      ativo: true,
      active: true,
    },
  ]);
}

export async function updateSiteAccessory(
  productId: number,
  input: SiteAccessoryInput,
) {
  const name = input.nome.trim();

  return supabase
    .from("products")
    .update({
      nome: name,
      name,
      categoria: input.kind,
      category: input.kind,
      estoque: input.estoque,
      stock_quantity: input.estoque,
      image_url: input.image_url,
      ativo: true,
      active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
}

export async function archiveSiteAccessory(productId: number) {
  return supabase
    .from("products")
    .update({
      ativo: false,
      active: false,
      estoque: 0,
      stock_quantity: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
}
