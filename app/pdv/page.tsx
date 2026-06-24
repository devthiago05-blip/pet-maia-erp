"use client";

import {
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CategoryModal } from "@/components/pos/CategoryModal";
import { ProductModal } from "@/components/pos/ProductModal";
import {
  type PurchaseInput,
  PurchaseModal,
} from "@/components/pos/PurchaseModal";
import { SupplierModal } from "@/components/pos/SupplierModal";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  formatCurrency,
  formatDate,
  formatProductName,
} from "@/lib/formatters";
import {
  createPosQuote,
  createPosSale,
  createProductCategory,
  createProductPurchase,
  createProducts,
  createSupplier,
  fetchPosQuotes,
  fetchProductCategories,
  fetchProductPurchases,
  fetchProducts,
  fetchSuppliers,
  updateProduct,
} from "@/services/pos";
import { fetchTutors } from "@/services/tutors";
import type {
  NewProductCategoryInput,
  NewProductInput,
  NewSupplierInput,
  PosQuote,
  Product,
  ProductCategory,
  ProductPurchase,
  Supplier,
  Tutor,
} from "@/types/domain";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [quotes, setQuotes] = useState<PosQuote[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<
    "sale" | "products" | "purchases" | "quotes"
  >("sale");
  const [search, setSearch] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(
      (product) =>
        product.ativo &&
        (!term ||
          product.nome.toLowerCase().includes(term) ||
          product.sku?.toLowerCase().includes(term) ||
          product.categoria?.toLowerCase().includes(term) ||
          product.tamanho?.toLowerCase().includes(term) ||
          product.cor?.toLowerCase().includes(term) ||
          product.sabor?.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.product.preco_venda) * item.quantity,
    0,
  );
  const lowStockCount = products.filter(
    (product) => product.ativo && product.estoque <= product.estoque_minimo,
  ).length;

  async function loadData() {
    setLoading(true);
    setLoadError("");
    const [
      productsResponse,
      categoriesResponse,
      quotesResponse,
      tutorsResponse,
      suppliersResponse,
      purchasesResponse,
    ] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
      fetchPosQuotes(),
      fetchTutors(),
      fetchSuppliers(),
      fetchProductPurchases(),
    ]);

    const error =
      productsResponse.error ||
      categoriesResponse.error ||
      quotesResponse.error ||
      tutorsResponse.error ||
      suppliersResponse.error ||
      purchasesResponse.error;

    if (error) {
      console.error(error);
      setLoadError(
        "Não foi possível carregar o PDV. Verifique se os scripts SQL 003, 004 e 005 foram executados.",
      );
      setLoading(false);
      return;
    }

    setProducts(productsResponse.data || []);
    setCategories(categoriesResponse.data || []);
    setQuotes((quotesResponse.data || []) as PosQuote[]);
    setTutors(tutorsResponse.data || []);
    setSuppliers(suppliersResponse.data || []);
    setPurchases((purchasesResponse.data || []) as ProductPurchase[]);
    setLoading(false);
  }

  useMountEffect(() => {
    loadData();
  });

  function addToCart(product: Product) {
    if (product.estoque <= 0) {
      toast.error("Produto sem estoque");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (!existing) {
        return [...current, { product, quantity: 1 }];
      }

      if (existing.quantity >= product.estoque) {
        toast.error("Quantidade máxima disponível em estoque");
        return current;
      }

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              item.product.estoque,
              Math.max(0, item.quantity + delta),
            ),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function getCustomer() {
    const tutor = tutors.find((item) => String(item.id) === tutorId);
    return {
      tutorId: tutor ? tutor.id : null,
      customerName: tutor?.nome || customerName.trim() || "Consumidor",
    };
  }

  async function handleQuote() {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao orçamento");
      return;
    }

    setProcessing(true);
    const customer = getCustomer();
    const { error } = await createPosQuote({
      ...customer,
      expirationDate: expirationDate || null,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantidade: item.quantity,
      })),
    });
    setProcessing(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Orçamento salvo com sucesso!");
    clearSale();
    await loadData();
    setView("quotes");
  }

  async function handleSale() {
    if (cart.length === 0) {
      toast.error("Adicione produtos à venda");
      return;
    }

    setProcessing(true);
    const customer = getCustomer();
    const { error } = await createPosSale({
      ...customer,
      paymentMethod,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantidade: item.quantity,
      })),
    });
    setProcessing(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Venda finalizada e estoque atualizado!");
    clearSale();
    await loadData();
  }

  function clearSale() {
    setCart([]);
    setTutorId("");
    setCustomerName("");
    setExpirationDate("");
    setPaymentMethod("PIX");
  }

  async function handleProductSave(
    productsToSave: Array<NewProductInput | Product>,
  ) {
    const response =
      productsToSave.length === 1 && "id" in productsToSave[0]
        ? await updateProduct(productsToSave[0])
        : await createProducts(productsToSave as NewProductInput[]);

    if (response.error) {
      toast.error(response.error.message);
      throw response.error;
    }

    toast.success(
      productsToSave.length === 1
        ? "Produto salvo com sucesso!"
        : `${productsToSave.length} variações salvas com sucesso!`,
    );
    await loadData();
  }

  async function handleCategorySave(category: NewProductCategoryInput) {
    const { error } = await createProductCategory(category);

    if (error) {
      toast.error(
        error.code === "23505" ? "Essa categoria já existe" : error.message,
      );
      throw error;
    }

    toast.success("Categoria salva com sucesso!");
    await loadData();
  }

  async function handleSupplierSave(supplier: NewSupplierInput) {
    const { error } = await createSupplier(supplier);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Fornecedor salvo com sucesso!");
    await loadData();
  }

  async function handlePurchaseSave(purchase: PurchaseInput) {
    const { error } = await createProductPurchase(purchase);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Compra registrada e estoque atualizado!");
    await loadData();
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                PDV
              </h1>
              <p className="text-slate-500">
                Produtos, estoque, vendas e orçamentos
              </p>
            </div>
            {view === "products" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <CategoryModal onSave={handleCategorySave} />
                <ProductModal
                  categories={categories}
                  onSave={handleProductSave}
                />
              </div>
            )}
            {view === "purchases" && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <SupplierModal onSave={handleSupplierSave} />
                <PurchaseModal
                  products={products}
                  suppliers={suppliers}
                  onSave={handlePurchaseSave}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Summary
              label="Produtos ativos"
              value={products.filter((p) => p.ativo).length}
            />
            <Summary label="Estoque baixo" value={lowStockCount} warning />
            <Summary
              label="Orçamentos abertos"
              value={quotes.filter((q) => q.status === "Aberto").length}
            />
          </div>

          <div className="flex w-full rounded-xl bg-white p-1 shadow-sm sm:w-fit">
            {[
              ["sale", "Venda"],
              ["products", "Produtos"],
              ["purchases", "Compras"],
              ["quotes", "Orçamentos"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id as typeof view)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none ${
                  view === id
                    ? "bg-[#8A0EEA] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-slate-500">
              Carregando PDV...
            </div>
          ) : view === "sale" ? (
            <SaleView
              products={filteredProducts}
              cart={cart}
              search={search}
              tutorId={tutorId}
              customerName={customerName}
              paymentMethod={paymentMethod}
              expirationDate={expirationDate}
              tutors={tutors}
              total={cartTotal}
              processing={processing}
              onSearch={setSearch}
              onAdd={addToCart}
              onQuantity={updateQuantity}
              onTutor={setTutorId}
              onCustomerName={setCustomerName}
              onPaymentMethod={setPaymentMethod}
              onExpirationDate={setExpirationDate}
              onQuote={handleQuote}
              onSale={handleSale}
              onClear={clearSale}
            />
          ) : view === "products" ? (
            <ProductsView
              products={products}
              categories={categories}
              onSave={handleProductSave}
            />
          ) : view === "purchases" ? (
            <PurchasesView purchases={purchases} suppliers={suppliers} />
          ) : (
            <QuotesView quotes={quotes} />
          )}
        </div>
      </main>
    </div>
  );
}

function PurchasesView({
  purchases,
  suppliers,
}: {
  purchases: ProductPurchase[];
  suppliers: Supplier[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Fornecedor</th>
                <th className="p-4 text-left">Documento</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Nenhuma compra registrada.
                  </td>
                </tr>
              ) : (
                purchases.map((purchase) => (
                  <tr key={purchase.id} className="border-t">
                    <td className="p-4">
                      #{String(purchase.id).padStart(6, "0")}
                    </td>
                    <td className="p-4">{purchase.suppliers?.nome || "-"}</td>
                    <td className="p-4">{purchase.numero_documento || "-"}</td>
                    <td className="p-4">{formatDate(purchase.data_compra)}</td>
                    <td className="p-4">{formatCurrency(purchase.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-xl border bg-white p-4">
        <h2 className="font-bold">Fornecedores</h2>
        <div className="mt-3 divide-y">
          {suppliers.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              Nenhum fornecedor cadastrado.
            </p>
          ) : (
            suppliers.map((supplier) => (
              <div key={supplier.id} className="py-3">
                <p className="font-medium">{supplier.nome}</p>
                <p className="text-xs text-slate-500">
                  {supplier.contato || supplier.telefone || "Sem contato"}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

function SaleView({
  products,
  cart,
  search,
  tutorId,
  customerName,
  paymentMethod,
  expirationDate,
  tutors,
  total,
  processing,
  onSearch,
  onAdd,
  onQuantity,
  onTutor,
  onCustomerName,
  onPaymentMethod,
  onExpirationDate,
  onQuote,
  onSale,
  onClear,
}: {
  products: Product[];
  cart: CartItem[];
  search: string;
  tutorId: string;
  customerName: string;
  paymentMethod: string;
  expirationDate: string;
  tutors: Tutor[];
  total: number;
  processing: boolean;
  onSearch: (value: string) => void;
  onAdd: (product: Product) => void;
  onQuantity: (id: number, delta: number) => void;
  onTutor: (value: string) => void;
  onCustomerName: (value: string) => void;
  onPaymentMethod: (value: string) => void;
  onExpirationDate: (value: string) => void;
  onQuote: () => void;
  onSale: () => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section className="space-y-4">
        <label className="flex items-center gap-3 rounded-xl border bg-white px-4">
          <Search size={18} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Buscar produto, código ou categoria"
            className="min-w-0 flex-1 py-3 outline-none"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAdd(product)}
              className="text-left rounded-xl border bg-white p-4 transition hover:border-[#8A0EEA]"
            >
              <div className="flex items-start justify-between gap-3">
                <Package className="text-[#8A0EEA]" size={22} />
                <span
                  className={`text-xs font-medium ${product.estoque <= product.estoque_minimo ? "text-red-600" : "text-slate-500"}`}
                >
                  {product.estoque} un.
                </span>
              </div>
              <p className="mt-3 font-bold">{formatProductName(product)}</p>
              <p className="text-sm text-slate-500">
                {product.categoria || "Sem categoria"}
              </p>
              <p className="mt-2 text-lg font-bold text-[#8A0EEA]">
                {formatCurrency(product.preco_venda)}
              </p>
            </button>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-xl border bg-white p-4 sm:p-5 xl:sticky xl:top-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingCart size={20} /> Carrinho
          </h2>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-red-600"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
              Selecione produtos para iniciar.
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="rounded-xl border p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {formatProductName(item.product)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(item.product.preco_venda)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuantity(item.product.id, -item.quantity)}
                    aria-label="Remover item"
                  >
                    <Trash2 size={17} className="text-red-500" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onQuantity(item.product.id, -1)}
                      className="rounded-lg border p-1"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-7 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQuantity(item.product.id, 1)}
                      className="rounded-lg border p-1"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong>
                    {formatCurrency(
                      Number(item.product.preco_venda) * item.quantity,
                    )}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <select
            value={tutorId}
            onChange={(event) => onTutor(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">Consumidor sem cadastro</option>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>
                {tutor.nome}
              </option>
            ))}
          </select>
          {!tutorId && (
            <input
              value={customerName}
              onChange={(event) => onCustomerName(event.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="rounded-xl border p-3"
            />
          )}
          <select
            value={paymentMethod}
            onChange={(event) => onPaymentMethod(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option>PIX</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
          </select>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Validade do orçamento
            <input
              type="date"
              value={expirationDate}
              onChange={(event) => onExpirationDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <span className="font-medium">Total</span>
          <strong className="text-2xl text-[#8A0EEA]">
            {formatCurrency(total)}
          </strong>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <button
            type="button"
            onClick={onQuote}
            disabled={processing || cart.length === 0}
            className="rounded-xl border py-3 font-semibold disabled:opacity-50"
          >
            Salvar orçamento
          </button>
          <button
            type="button"
            onClick={onSale}
            disabled={processing || cart.length === 0}
            className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-50"
          >
            {processing ? "Processando..." : "Finalizar venda"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function ProductsView({
  products,
  categories,
  onSave,
}: {
  products: Product[];
  categories: ProductCategory[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Produto</th>
              <th className="p-4 text-left">Categoria</th>
              <th className="p-4 text-left">Venda</th>
              <th className="p-4 text-left">Estoque</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-4">
                    <p className="font-medium">{formatProductName(product)}</p>
                    <p className="text-xs text-slate-500">
                      {product.sku || "Sem código"}
                    </p>
                  </td>
                  <td className="p-4">{product.categoria || "-"}</td>
                  <td className="p-4">{formatCurrency(product.preco_venda)}</td>
                  <td
                    className={`p-4 font-medium ${product.estoque <= product.estoque_minimo ? "text-red-600" : ""}`}
                  >
                    {product.estoque}
                  </td>
                  <td className="p-4">{product.ativo ? "Ativo" : "Inativo"}</td>
                  <td className="p-4">
                    <ProductModal
                      product={product}
                      categories={categories}
                      onSave={onSave}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuotesView({ quotes }: { quotes: PosQuote[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left">Número</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Criado em</th>
              <th className="p-4 text-left">Validade</th>
              <th className="p-4 text-left">Total</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-500">
                  Nenhum orçamento salvo.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-t">
                  <td className="p-4">#{String(quote.id).padStart(6, "0")}</td>
                  <td className="p-4">
                    {quote.tutors?.nome || quote.cliente_nome || "Consumidor"}
                  </td>
                  <td className="p-4">{formatDate(quote.created_at)}</td>
                  <td className="p-4">{formatDate(quote.validade)}</td>
                  <td className="p-4">{formatCurrency(quote.total)}</td>
                  <td className="p-4">{quote.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${warning && value > 0 ? "text-red-600" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
