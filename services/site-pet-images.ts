import { supabase } from "@/lib/supabase";

export interface SitePetImage {
  id: number;
  name: string;
  detail?: string | null;
  image_url: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SitePetImageInput {
  name: string;
  detail?: string | null;
  image_url: string;
  sort_order: number;
  active: boolean;
}

const sitePetImagesBucket = "site-pet-images";

export async function fetchSitePetImages() {
  return supabase
    .from("site_pet_images")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true })
    .returns<SitePetImage[]>();
}

export async function uploadSitePetImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return {
      data: null,
      error: new Error("Selecione uma imagem valida."),
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storagePath = `pets/${crypto.randomUUID()}.${extension}`;
  const uploadResponse = await supabase.storage
    .from(sitePetImagesBucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadResponse.error) {
    return { data: null, error: uploadResponse.error };
  }

  const publicUrlResponse = supabase.storage
    .from(sitePetImagesBucket)
    .getPublicUrl(storagePath);

  return {
    data: publicUrlResponse.data.publicUrl,
    error: null,
  };
}

export async function createSitePetImage(input: SitePetImageInput) {
  return supabase.from("site_pet_images").insert([
    {
      name: input.name.trim(),
      detail: input.detail?.trim() || null,
      image_url: input.image_url,
      sort_order: input.sort_order,
      active: input.active,
    },
  ]);
}

export async function updateSitePetImage(
  id: number,
  input: SitePetImageInput,
) {
  return supabase
    .from("site_pet_images")
    .update({
      name: input.name.trim(),
      detail: input.detail?.trim() || null,
      image_url: input.image_url,
      sort_order: input.sort_order,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function archiveSitePetImage(id: number) {
  return supabase
    .from("site_pet_images")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}
