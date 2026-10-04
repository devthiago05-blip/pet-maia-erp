export const siteAccessoryKinds = [
  "Topete fêmea",
  "Topete macho",
  "Gravatas",
  "Pescoço",
  "Penteado",
  "Adesivos",
  "Bandanas",
  "Max topete",
] as const;

export type SiteAccessoryKind = (typeof siteAccessoryKinds)[number];

export const siteAccessorySearchTerms = [
  ...siteAccessoryKinds,
  "Topete",
  "Topete femea",
  "Gravata",
  "Pescoco",
  "Adesivo",
  "Sticker",
  "Bandana",
  "Lacinho",
  "Laco",
  "Laço",
];

export function normalizeAccessoryText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getSiteAccessoryKindFromText(value: string): SiteAccessoryKind {
  const text = normalizeAccessoryText(value);

  if (text.includes("max topete")) {
    return "Max topete";
  }

  if (text.includes("topete macho")) {
    return "Topete macho";
  }

  if (
    text.includes("topete") ||
    text.includes("topete femea") ||
    text.includes("lacinho") ||
    text.includes("laco")
  ) {
    return "Topete fêmea";
  }

  if (text.includes("gravata")) {
    return "Gravatas";
  }

  if (text.includes("pescoco")) {
    return "Pescoço";
  }

  if (text.includes("penteado")) {
    return "Penteado";
  }

  if (text.includes("adesivo") || text.includes("sticker")) {
    return "Adesivos";
  }

  if (text.includes("bandana")) {
    return "Bandanas";
  }

  return "Bandanas";
}

export function createSiteAccessorySearchFilters() {
  return siteAccessorySearchTerms.flatMap((term) => [
    `categoria.ilike.%${term}%`,
    `nome.ilike.%${term}%`,
  ]);
}

export function createSiteAccessoryCodePrefix(kind: SiteAccessoryKind) {
  return normalizeAccessoryText(kind)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
}
