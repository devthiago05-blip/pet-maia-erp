"use client";

import {
  Check,
  ImageIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  normalizeAccessoryText,
  type SiteAccessoryKind,
  siteAccessoryKinds,
} from "@/lib/site-accessory-kinds";

type FilterKind = "Todos" | SiteAccessoryKind;

interface PublicAccessory {
  id: number;
  name: string;
  kind: SiteAccessoryKind;
  price: number;
  stock: number;
  imageUrl: string;
  detail?: string;
}

interface CatalogResponse {
  clinic?: {
    name?: string;
    phone?: string;
  };
  items?: PublicAccessory[];
  error?: string;
}

const filterTabs: Array<{ label: string; value: FilterKind }> = [
  { label: "Tudo", value: "Todos" },
  ...siteAccessoryKinds.map((kind) => ({
    label: kind,
    value: kind,
  })),
];

const defaultStoreWhatsApp = "85988250021";

function normalizePhoneForWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

function createWhatsappMessage(items: PublicAccessory[]) {
  const lines = items.map((item, index) => {
    const detail = item.detail ? ` · ${item.detail}` : "";

    return `${index + 1}. ${item.name} — ${item.kind}${detail}`;
  });

  return [
    "Olá! Vim pelo catálogo de adereços da Pet Maia.",
    "Gostaria destas opções para o banho:",
    "",
    ...lines,
    "",
    "Pode separar essas opções para mim?",
  ].join("\n");
}

function getCatalogBrandName(value: string) {
  const cleanedName = value
    .replace(/\bERP\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleanedName || /^pet maia$/i.test(cleanedName)) {
    return "Pet Maia";
  }

  return cleanedName;
}

async function fetchCatalog() {
  const response = await fetch("/api/public/accessories", {
    cache: "no-store",
  });
  const payload = (await response.json()) as CatalogResponse;

  if (!response.ok) {
    throw new Error(payload.error || "Não foi possível carregar.");
  }

  return payload;
}

export default function PublicAccessoriesCatalogPage() {
  const [items, setItems] = useState<PublicAccessory[]>([]);
  const [clinicName, setClinicName] = useState("Pet Maia");
  const [clinicPhone, setClinicPhone] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKind>("Todos");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const payload = await fetchCatalog();
      setItems(payload.items || []);
      setClinicName(payload.clinic?.name || "Pet Maia");
      setClinicPhone(payload.clinic?.phone || "");
    } catch (requestError) {
      setItems([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar o catálogo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialCatalog() {
      try {
        const payload = await fetchCatalog();

        if (!active) {
          return;
        }

        setItems(payload.items || []);
        setClinicName(payload.clinic?.name || "Pet Maia");
        setClinicPhone(payload.clinic?.phone || "");
      } catch (requestError) {
        if (!active) {
          return;
        }

        setItems([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar o catálogo.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialCatalog();

    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeAccessoryText(search.trim());

    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "Todos" || item.kind === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        normalizeAccessoryText(
          `${item.name} ${item.kind} ${item.detail || ""}`,
        ).includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, items, search]);

  const sections = useMemo(() => {
    return siteAccessoryKinds
      .map((kind) => ({
        kind,
        title: kind,
        items: filteredItems.filter((item) => item.kind === kind),
      }))
      .filter(
        (section) => activeFilter !== "Todos" || section.items.length > 0,
      );
  }, [activeFilter, filteredItems]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as PublicAccessory[],
    [items, selectedIds],
  );
  const displayClinicName = useMemo(
    () => getCatalogBrandName(clinicName),
    [clinicName],
  );

  function toggleSelected(itemId: number) {
    setSelectedIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  function handleWhatsappOrder() {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos um adereço.");
      return;
    }

    const phone = normalizePhoneForWhatsapp(
      clinicPhone || defaultStoreWhatsApp,
    );

    if (!phone) {
      toast.error("Não foi possível montar o WhatsApp da loja.");
      return;
    }

    const message = encodeURIComponent(createWhatsappMessage(selectedItems));
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank", "noopener");
  }

  return (
    <main className="min-h-screen bg-[#f7f0ff] pb-28 text-[#180024]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#8A0EEA] via-[#9B1CF3] to-[#5F00B5] px-4 pb-8 pt-5 text-white shadow-sm">
        <div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-16 left-8 h-48 w-48 rounded-full bg-white/25 blur-3xl" />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pet-maia-logo-web.png"
                  alt="Pet Maia"
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
              <div>
                <p className="text-xs font-black tracking-[0.22em] text-white/80">
                  {displayClinicName}
                </p>
                <h1 className="text-2xl font-black leading-tight sm:text-4xl">
                  Catálogo de adereços
                </h1>
              </div>
            </div>

            <span className="hidden items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm font-black shadow-sm sm:inline-flex">
              <Sparkles size={17} />
              Banho estiloso
            </span>
          </div>

          <div className="max-w-2xl rounded-[1.6rem] bg-white/15 p-4 shadow-sm backdrop-blur">
            <p className="text-base font-semibold sm:text-lg">
              Escolha topetes, gravatas, bandanas, adesivos e outros adereços
              para combinar com o banho do seu pet. Toque no botão preto para
              selecionar os itens e enviar a lista pelo WhatsApp.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-purple-100 bg-[#f7f0ff]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                  activeFilter === tab.value
                    ? "bg-[#111827] text-white shadow-md"
                    : "bg-white text-slate-700 shadow-sm"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 shadow-sm">
            <Search size={20} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar adereço"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-slate-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Limpar busca"
              >
                <X size={18} />
              </button>
            )}
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 py-5">
        {loading ? (
          <div className="grid min-h-64 place-items-center rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="grid gap-3 place-items-center">
              <Loader2 className="animate-spin text-[#8A0EEA]" size={34} />
              <p className="font-bold text-slate-600">Carregando adereços...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] bg-white p-6 shadow-sm">
            <p className="font-bold text-red-600">{error}</p>
            <button
              type="button"
              onClick={loadCatalog}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 font-bold text-white"
            >
              <RefreshCw size={18} />
              Tentar novamente
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <ImageIcon size={32} />
            </div>
            <h2 className="mt-4 text-xl font-black">
              Nenhum adereço encontrado
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Cadastre itens com foto e estoque em Site &gt; Adereços do
              catálogo.
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.kind} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700">
                  <Tag size={17} className="text-[#8A0EEA]" />
                  {section.title}
                </h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">
                  {section.items.length}
                </span>
              </div>

              {section.items.length === 0 ? (
                <div className="rounded-2xl bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
                  Nenhum item nesta categoria.
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {section.items.map((item) => {
                    const selected = selectedIds.includes(item.id);

                    return (
                      <article
                        key={item.id}
                        className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1 py-1">
                          <h3 className="font-black leading-snug text-slate-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {item.kind}
                            {item.detail ? ` · ${item.detail}` : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-[#8A0EEA]">
                              Incluso no banho
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                              {item.stock} un.
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSelected(item.id)}
                          aria-label={
                            selected
                              ? `Remover ${item.name}`
                              : `Selecionar ${item.name}`
                          }
                          className={`grid h-11 w-11 shrink-0 place-items-center self-center rounded-xl text-white shadow-sm transition ${
                            selected
                              ? "bg-[#8A0EEA]"
                              : "bg-[#111827] hover:bg-black"
                          }`}
                        >
                          {selected ? (
                            <Check size={21} />
                          ) : (
                            <ShoppingBag size={20} />
                          )}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))
        )}
      </section>

      {selectedItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-slate-900">
                {selectedItems.length} item
                {selectedItems.length > 1 ? "s" : ""} selecionado
                {selectedItems.length > 1 ? "s" : ""}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                Adereços inclusos no banho
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="hidden rounded-xl border px-3 py-3 text-sm font-bold text-slate-600 sm:inline-flex"
            >
              Limpar
            </button>

            <button
              type="button"
              onClick={handleWhatsappOrder}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 font-black text-white shadow-lg shadow-emerald-200"
            >
              <MessageCircle size={20} />
              Enviar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
