"use client";

import {
  Camera,
  ImagePlus,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  archiveSiteAccessory,
  createSiteAccessory,
  fetchSiteAccessories,
  getSiteAccessoryKind,
  isVisibleOnSite,
  type SiteAccessoryKind,
  updateSiteAccessory,
  uploadSiteAccessoryImage,
} from "@/services/site-accessories";
import type { Product } from "@/types/domain";

interface AccessoryFormState {
  id: number | null;
  kind: SiteAccessoryKind;
  nome: string;
  estoque: string;
  imageFile: File | null;
  imagePreview: string;
  imageUrl: string;
}

const emptyForm: AccessoryFormState = {
  id: null,
  kind: "Bandana",
  nome: "",
  estoque: "0",
  imageFile: null,
  imagePreview: "",
  imageUrl: "",
};

function getProductStatus(product: Product) {
  if (!product.ativo) {
    return { label: "Inativo", className: "bg-slate-100 text-slate-600" };
  }

  if (!product.image_url) {
    return { label: "Sem foto", className: "bg-amber-50 text-amber-700" };
  }

  if (product.estoque <= 0) {
    return { label: "Sem estoque", className: "bg-red-50 text-red-700" };
  }

  return { label: "No site", className: "bg-emerald-50 text-emerald-700" };
}

function splitAccessories(products: Product[]) {
  return {
    bandanas: products.filter(
      (product) => getSiteAccessoryKind(product) === "Bandana",
    ),
    bows: products.filter(
      (product) => getSiteAccessoryKind(product) === "Lacinho",
    ),
  };
}

export default function SitePage() {
  const [accessories, setAccessories] = useState<Product[]>([]);
  const [form, setForm] = useState<AccessoryFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const groupedAccessories = useMemo(
    () => splitAccessories(accessories),
    [accessories],
  );
  const visibleCount = accessories.filter(isVisibleOnSite).length;
  const noStockCount = accessories.filter(
    (product) => product.ativo && product.estoque <= 0,
  ).length;

  async function loadAccessories() {
    setLoading(true);
    const { data, error } = await fetchSiteAccessories();

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar itens do site");
      setAccessories([]);
      setLoading(false);
      return;
    }

    setAccessories(data || []);
    setLoading(false);
  }

  useMountEffect(() => {
    loadAccessories();
  });

  function resetForm() {
    setForm(emptyForm);
  }

  function updateForm<K extends keyof AccessoryFormState>(
    field: K,
    value: AccessoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      updateForm("imageFile", null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem valida");
      event.target.value = "";
      return;
    }

    setForm((current) => ({
      ...current,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  }

  function startEdit(product: Product) {
    setForm({
      id: product.id,
      kind: getSiteAccessoryKind(product),
      nome: product.nome || "",
      estoque: String(product.estoque ?? 0),
      imageFile: null,
      imagePreview: product.image_url || "",
      imageUrl: product.image_url || "",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const estoque = Number(form.estoque);

    if (!form.nome.trim()) {
      toast.error("Informe o nome");
      return;
    }

    if (!Number.isInteger(estoque) || estoque < 0) {
      toast.error("Informe um estoque valido");
      return;
    }

    setSaving(true);

    let imageUrl = form.imageUrl;

    if (form.imageFile) {
      const uploadResponse = await uploadSiteAccessoryImage(form.imageFile);

      if (uploadResponse.error) {
        console.error(uploadResponse.error);
        toast.error(uploadResponse.error.message || "Erro ao enviar foto");
        setSaving(false);
        return;
      }

      imageUrl = uploadResponse.data || "";
    }

    if (!imageUrl) {
      toast.error("Adicione uma foto");
      setSaving(false);
      return;
    }

    const payload = {
      kind: form.kind,
      nome: form.nome,
      estoque,
      image_url: imageUrl,
    };

    const { error } = form.id
      ? await updateSiteAccessory(form.id, payload)
      : await createSiteAccessory(payload);

    if (error) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar");
      setSaving(false);
      return;
    }

    toast.success(form.id ? "Item atualizado" : "Item cadastrado");
    resetForm();
    setSaving(false);
    await loadAccessories();
  }

  async function handleArchive(product: Product) {
    const { error } = await archiveSiteAccessory(product.id);

    if (error) {
      console.error(error);
      toast.error("Erro ao ocultar item");
      return;
    }

    toast.success("Item ocultado do site");
    await loadAccessories();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Site
              </h1>
              <p className="text-slate-500">
                Bandanas e lacinhos do agendamento
              </p>
            </div>

            <button
              type="button"
              onClick={loadAccessories}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8A0EEA]/20 bg-white px-4 py-2 font-semibold text-[#8A0EEA] transition hover:bg-purple-50"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              title="Itens cadastrados"
              value={String(accessories.length)}
            />
            <Metric title="Aparecendo no site" value={String(visibleCount)} />
            <Metric title="Sem estoque" value={String(noStockCount)} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 rounded-xl border bg-white p-4 shadow-sm lg:grid-cols-[1fr_220px]"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2 text-sm font-medium">
                Tipo
                <div className="grid grid-cols-2 rounded-xl border bg-slate-50 p-1">
                  {(["Bandana", "Lacinho"] as SiteAccessoryKind[]).map(
                    (kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => updateForm("kind", kind)}
                        className={`rounded-lg px-3 py-2 font-semibold transition ${
                          form.kind === kind
                            ? "bg-[#8A0EEA] text-white"
                            : "text-slate-600 hover:bg-white"
                        }`}
                      >
                        {kind}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-medium xl:col-span-2">
                Nome
                <input
                  value={form.nome}
                  onChange={(event) => updateForm("nome", event.target.value)}
                  placeholder="Ex: Bandana rosa floral"
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Estoque
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.estoque}
                  onChange={(event) => updateForm("estoque", event.target.value)}
                  className="rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium md:col-span-2 xl:col-span-4">
                Foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="rounded-xl border bg-white p-3 text-sm font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:font-semibold file:text-[#8A0EEA]"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row md:col-span-2 xl:col-span-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-60"
                >
                  <Save size={18} />
                  {saving
                    ? "Salvando..."
                    : form.id
                      ? "Salvar alterações"
                      : "Cadastrar"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border px-4 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="grid min-h-52 place-items-center overflow-hidden rounded-xl border bg-slate-50">
              {form.imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.imagePreview}
                  alt="Prévia"
                  className="h-full max-h-64 w-full object-cover"
                />
              ) : (
                <div className="grid place-items-center gap-2 p-6 text-center text-sm text-slate-500">
                  <ImagePlus className="text-slate-400" size={34} />
                  Foto do item
                </div>
              )}
            </div>
          </form>

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">
              Carregando itens...
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <AccessorySection
                title="Bandanas"
                products={groupedAccessories.bandanas}
                onEdit={startEdit}
                onArchive={handleArchive}
              />
              <AccessorySection
                title="Lacinhos"
                products={groupedAccessories.bows}
                onEdit={startEdit}
                onArchive={handleArchive}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AccessorySection({
  title,
  products,
  onEdit,
  onArchive,
}: {
  title: string;
  products: Product[];
  onEdit: (product: Product) => void;
  onArchive: (product: Product) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-500">
          {products.length}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">
          Nenhum item cadastrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <AccessoryCard
              key={product.id}
              product={product}
              onEdit={onEdit}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function AccessoryCard({
  product,
  onEdit,
  onArchive,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onArchive: (product: Product) => void;
}) {
  const status = getProductStatus(product);

  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.nome}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <Camera size={32} />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-900">
              {product.nome}
            </h3>
            <p className="text-sm text-slate-500">Estoque: {product.estoque}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-[#8A0EEA] transition hover:bg-purple-50"
          >
            <Pencil size={16} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onArchive(product)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={16} />
            Ocultar
          </button>
        </div>
      </div>
    </article>
  );
}
