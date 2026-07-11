"use client";

import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CategoryModal } from "@/components/pos/CategoryModal";
import { PosDocumentModal } from "@/components/pos/PosDocumentModal";
import { ProductModal } from "@/components/pos/ProductModal";
import { ProductSelectionModal } from "@/components/pos/ProductSelectionModal";
import {
  type PurchaseInput,
  PurchaseModal,
} from "@/components/pos/PurchaseModal";
import { SupplierModal } from "@/components/pos/SupplierModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  formatCurrency,
  formatDate,
  formatProductName,
} from "@/lib/formatters";
import {
  addPosCashMovement,
  archiveProduct,
  cancelPosSale,
  closePosCashRegister,
  convertPosQuote,
  createPosQuote,
  createPosSale,
  createProductCategory,
  createProductPurchase,
  createProducts,
  createSupplier,
  fetchPosCashRegisters,
  fetchPosQuotes,
  fetchPosSales,
  fetchProductCategories,
  fetchProductPurchases,
  fetchProducts,
  fetchSuppliers,
  openPosCashRegister,
  updateProduct,
} from "@/services/pos";
import { fetchTutors } from "@/services/tutors";
import type {
  NewProductCategoryInput,
  NewProductInput,
  NewSupplierInput,
  PosCashMovementType,
  PosCashRegister,
  PosQuote,
  PosSale,
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

interface ProductGroup {
  key: string;
  name: string;
  category?: string;
  products: Product[];
}

type ManualCashMovementType = Extract<
  PosCashMovementType,
  "suprimento" | "sangria"
>;

function formatCashMovementType(type: PosCashMovementType) {
  const labels: Record<PosCashMovementType, string> = {
    abertura: "Abertura",
    suprimento: "Suprimento",
    sangria: "Sangria",
    venda: "Venda",
    cancelamento_venda: "Cancelamento de venda",
    fechamento: "Fechamento",
  };

  return labels[type];
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [quotes, setQuotes] = useState<PosQuote[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [cashRegisters, setCashRegisters] = useState<PosCashRegister[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<
    "sale" | "cash" | "products" | "purchases" | "quotes" | "sales"
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
          product.barcode?.toLowerCase().includes(term) ||
          product.categoria?.toLowerCase().includes(term) ||
          product.tamanho?.toLowerCase().includes(term) ||
          product.cor?.toLowerCase().includes(term) ||
          product.sabor?.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const productGroups = useMemo(() => {
    const groups = new Map<string, ProductGroup>();

    filteredProducts.forEach((product) => {
      const key = `${product.category_id || product.categoria || ""}:${product.nome.trim().toLowerCase()}`;
      const current = groups.get(key);

      if (current) {
        current.products.push(product);
      } else {
        groups.set(key, {
          key,
          name: product.nome,
          category: product.categoria,
          products: [product],
        });
      }
    });

    return Array.from(groups.values());
  }, [filteredProducts]);

  const cartTotal = cart.reduce(
    (total, item) => total + Number(item.product.preco_venda) * item.quantity,
    0,
  );
  const lowStockCount = products.filter(
    (product) => product.ativo && product.estoque <= product.estoque_minimo,
  ).length;
  const openCashRegister =
    cashRegisters.find((register) => register.status === "Aberto") || null;

  async function loadData() {
    setLoading(true);
    setLoadError("");
    const [
      productsResponse,
      categoriesResponse,
      quotesResponse,
      salesResponse,
      cashRegistersResponse,
      tutorsResponse,
      suppliersResponse,
      purchasesResponse,
    ] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
      fetchPosQuotes(),
      fetchPosSales(),
      fetchPosCashRegisters(),
      fetchTutors(),
      fetchSuppliers(),
      fetchProductPurchases(),
    ]);

    const error =
      productsResponse.error ||
      categoriesResponse.error ||
      quotesResponse.error ||
      salesResponse.error ||
      cashRegistersResponse.error ||
      tutorsResponse.error ||
      suppliersResponse.error ||
      purchasesResponse.error;

    if (error) {
      console.error(error);
      setLoadError(
        "Não foi possível carregar o PDV. Verifique se os scripts SQL 003 a 007 foram executados.",
      );
      setLoading(false);
      return;
    }

    setProducts(productsResponse.data || []);
    setCategories(categoriesResponse.data || []);
    setQuotes((quotesResponse.data || []) as PosQuote[]);
    setSales((salesResponse.data || []) as PosSale[]);
    setCashRegisters((cashRegistersResponse.data || []) as PosCashRegister[]);
    setTutors(tutorsResponse.data || []);
    setSuppliers(suppliersResponse.data || []);
    setPurchases((purchasesResponse.data || []) as ProductPurchase[]);
    setLoading(false);
  }

  useMountEffect(() => {
    loadData();
  });

  function addToCart(product: Product, quantity = 1) {
    if (product.estoque <= 0) {
      toast.error("Produto sem estoque");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (!existing) {
        return [...current, { product, quantity }];
      }

      if (existing.quantity + quantity > product.estoque) {
        toast.error("Quantidade máxima disponível em estoque");
        return current;
      }

      return current.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
  }

  function handleBarcodeScan(value: string) {
    const code = value.trim().toLowerCase();

    if (!code) {
      return;
    }

    const product = products.find(
      (item) =>
        item.ativo &&
        (item.barcode?.trim().toLowerCase() === code ||
          item.sku?.trim().toLowerCase() === code),
    );

    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    addToCart(product);
    setSearch("");
    toast.success(`${formatProductName(product)} adicionado ao carrinho`);
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

    if (!openCashRegister) {
      toast.error("Abra o caixa antes de finalizar a venda");
      setView("cash");
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

  async function handleProductDelete(product: Product) {
    const { error } = await archiveProduct(product.id);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Produto excluído do catálogo");
    setCart((current) =>
      current.filter((item) => item.product.id !== product.id),
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

  async function handleQuoteConvert(quoteId: number, paymentMethod: string) {
    if (!openCashRegister) {
      toast.error("Abra o caixa antes de converter o orcamento em venda");
      setView("cash");
      return;
    }

    const { error } = await convertPosQuote(quoteId, paymentMethod);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Orçamento convertido em venda!");
    await loadData();
    setView("sales");
  }

  async function handleSaleCancel(saleId: number) {
    const { error } = await cancelPosSale(saleId);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Venda excluída e estoque devolvido!");
    await loadData();
  }

  async function handleOpenCashRegister({
    openingAmount,
    notes,
  }: {
    openingAmount: number;
    notes: string;
  }) {
    const { error } = await openPosCashRegister({ openingAmount, notes });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Caixa aberto com sucesso!");
    await loadData();
  }

  async function handleCashMovement({
    movementType,
    amount,
    notes,
  }: {
    movementType: ManualCashMovementType;
    amount: number;
    notes: string;
  }) {
    if (!openCashRegister) {
      toast.error("Abra um caixa antes de registrar movimentações");
      return;
    }

    const { error } = await addPosCashMovement({
      cashRegisterId: openCashRegister.id,
      movementType,
      amount,
      notes,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success(
      movementType === "suprimento"
        ? "Suprimento registrado!"
        : "Sangria registrada!",
    );
    await loadData();
  }

  async function handleCloseCashRegister({
    closingAmount,
    notes,
  }: {
    closingAmount: number;
    notes: string;
  }) {
    if (!openCashRegister) {
      toast.error("Nenhum caixa aberto para fechar");
      return;
    }

    const { error } = await closePosCashRegister({
      cashRegisterId: openCashRegister.id,
      closingAmount,
      notes,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Caixa fechado com sucesso!");
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Summary
              label="Produtos ativos"
              value={products.filter((p) => p.ativo).length}
            />
            <Summary label="Estoque baixo" value={lowStockCount} warning />
            <Summary
              label="Orçamentos abertos"
              value={quotes.filter((q) => q.status === "Aberto").length}
            />
            <Summary
              label="Caixa"
              value={openCashRegister ? 1 : 0}
              textValue={openCashRegister ? "Aberto" : "Fechado"}
              warning={!openCashRegister}
            />
          </div>

          <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm sm:w-fit">
            {[
              ["sale", "Venda"],
              ["cash", "Caixa"],
              ["products", "Produtos"],
              ["purchases", "Compras"],
              ["quotes", "Orçamentos"],
              ["sales", "Vendas"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id as typeof view)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold ${
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
              groups={productGroups}
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
              onBarcodeScan={handleBarcodeScan}
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
          ) : view === "cash" ? (
            <CashRegisterView
              cashRegisters={cashRegisters}
              openCashRegister={openCashRegister}
              onOpen={handleOpenCashRegister}
              onMovement={handleCashMovement}
              onClose={handleCloseCashRegister}
            />
          ) : view === "products" ? (
            <ProductsView
              products={products}
              categories={categories}
              onSave={handleProductSave}
              onDelete={handleProductDelete}
            />
          ) : view === "purchases" ? (
            <PurchasesView purchases={purchases} suppliers={suppliers} />
          ) : view === "quotes" ? (
            <QuotesView quotes={quotes} onConvert={handleQuoteConvert} />
          ) : (
            <SalesView sales={sales} onCancel={handleSaleCancel} />
          )}
        </div>
      </main>
    </div>
  );
}

function CashRegisterView({
  cashRegisters,
  openCashRegister,
  onOpen,
  onMovement,
  onClose,
}: {
  cashRegisters: PosCashRegister[];
  openCashRegister: PosCashRegister | null;
  onOpen: (input: { openingAmount: number; notes: string }) => Promise<void>;
  onMovement: (input: {
    movementType: ManualCashMovementType;
    amount: number;
    notes: string;
  }) => Promise<void>;
  onClose: (input: { closingAmount: number; notes: string }) => Promise<void>;
}) {
  const [openingAmount, setOpeningAmount] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [movementType, setMovementType] =
    useState<ManualCashMovementType>("suprimento");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementNotes, setMovementNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const openMovements =
    openCashRegister?.pos_cash_movements
      ?.slice()
      .sort(
        (first, second) =>
          new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime(),
      ) || [];

  async function submitOpen() {
    const amount = Number(openingAmount || 0);

    if (amount < 0) {
      toast.error("Informe um valor de abertura válido");
      return;
    }

    setProcessing(true);
    try {
      await onOpen({ openingAmount: amount, notes: openingNotes });
      setOpeningAmount("");
      setOpeningNotes("");
    } finally {
      setProcessing(false);
    }
  }

  async function submitMovement() {
    const amount = Number(movementAmount || 0);

    if (amount <= 0) {
      toast.error("Informe um valor maior que zero");
      return;
    }

    setProcessing(true);
    try {
      await onMovement({ movementType, amount, notes: movementNotes });
      setMovementAmount("");
      setMovementNotes("");
    } finally {
      setProcessing(false);
    }
  }

  async function submitClose() {
    const amount = Number(closingAmount || 0);

    if (amount < 0) {
      toast.error("Informe um valor de fechamento válido");
      return;
    }

    setProcessing(true);
    try {
      await onClose({ closingAmount: amount, notes: closingNotes });
      setClosingAmount("");
      setClosingNotes("");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-6">
        <div className="rounded-xl border bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">Caixa do PDV</h2>
              <p className="text-sm text-slate-500">
                Controle de abertura, suprimento, sangria e fechamento.
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                openCashRegister
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {openCashRegister ? "Aberto" : "Fechado"}
            </span>
          </div>

          {openCashRegister ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Summary
                label="Abertura"
                value={Number(openCashRegister.opening_amount || 0)}
                currency
              />
              <Summary
                label="Esperado"
                value={Number(openCashRegister.expected_amount || 0)}
                currency
              />
              <Summary label="Movimentos" value={openMovements.length} />
            </div>
          ) : (
            <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingAmount}
                onChange={(event) => setOpeningAmount(event.target.value)}
                placeholder="Valor inicial"
                className="rounded-xl border bg-white p-3"
              />
              <input
                value={openingNotes}
                onChange={(event) => setOpeningNotes(event.target.value)}
                placeholder="Observação"
                className="rounded-xl border bg-white p-3"
              />
              <button
                type="button"
                onClick={submitOpen}
                disabled={processing}
                className="rounded-xl bg-[#8A0EEA] px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Abrir caixa
              </button>
            </div>
          )}
        </div>

        {openCashRegister && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-4 sm:p-5">
              <h3 className="font-bold">Suprimento ou sangria</h3>
              <div className="mt-4 grid gap-3">
                <select
                  value={movementType}
                  onChange={(event) =>
                    setMovementType(
                      event.target.value as ManualCashMovementType,
                    )
                  }
                  className="rounded-xl border p-3"
                >
                  <option value="suprimento">Suprimento</option>
                  <option value="sangria">Sangria</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={movementAmount}
                  onChange={(event) => setMovementAmount(event.target.value)}
                  placeholder="Valor"
                  className="rounded-xl border p-3"
                />
                <input
                  value={movementNotes}
                  onChange={(event) => setMovementNotes(event.target.value)}
                  placeholder="Motivo"
                  className="rounded-xl border p-3"
                />
                <button
                  type="button"
                  onClick={submitMovement}
                  disabled={processing}
                  className="rounded-xl border py-3 font-semibold disabled:opacity-50"
                >
                  Registrar movimentação
                </button>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 sm:p-5">
              <h3 className="font-bold">Fechamento</h3>
              <div className="mt-4 grid gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={closingAmount}
                  onChange={(event) => setClosingAmount(event.target.value)}
                  placeholder="Valor contado no caixa"
                  className="rounded-xl border p-3"
                />
                <input
                  value={closingNotes}
                  onChange={(event) => setClosingNotes(event.target.value)}
                  placeholder="Observação de fechamento"
                  className="rounded-xl border p-3"
                />
                <button
                  type="button"
                  onClick={submitClose}
                  disabled={processing}
                  className="rounded-xl bg-slate-900 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Fechar caixa
                </button>
              </div>
            </div>
          </div>
        )}

        {openCashRegister && (
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="border-b p-4">
              <h3 className="font-bold">Movimentações do caixa aberto</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-4 text-left">Data</th>
                    <th className="p-4 text-left">Tipo</th>
                    <th className="p-4 text-left">Valor</th>
                    <th className="p-4 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {openMovements.map((movement) => (
                    <tr key={movement.id} className="border-t">
                      <td className="p-4">{formatDate(movement.created_at)}</td>
                      <td className="p-4">
                        {formatCashMovementType(movement.movement_type)}
                      </td>
                      <td className="p-4">{formatCurrency(movement.amount)}</td>
                      <td className="p-4">{movement.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <aside className="h-fit rounded-xl border bg-white p-4 sm:p-5">
        <h3 className="font-bold">Histórico recente</h3>
        <div className="mt-4 space-y-3">
          {cashRegisters.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Nenhum caixa registrado.
            </p>
          ) : (
            cashRegisters.slice(0, 8).map((register) => (
              <div key={register.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Caixa #{String(register.id).padStart(6, "0")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(register.opened_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      register.status === "Aberto"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {register.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Esperado</span>
                  <strong className="text-right">
                    {formatCurrency(register.expected_amount)}
                  </strong>
                  {register.status === "Fechado" && (
                    <>
                      <span className="text-slate-500">Diferença</span>
                      <strong
                        className={`text-right ${
                          Number(register.difference_amount || 0) !== 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(register.difference_amount || 0)}
                      </strong>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
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
  groups,
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
  onBarcodeScan,
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
  groups: ProductGroup[];
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
  onBarcodeScan: (value: string) => void;
  onAdd: (product: Product, quantity?: number) => void;
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
            autoFocus
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onBarcodeScan(event.currentTarget.value);
              }
            }}
            placeholder="Buscar ou bipar código de barras"
            className="min-w-0 flex-1 py-3 outline-none"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <ProductSelectionModal
              key={group.key}
              name={group.name}
              category={group.category}
              products={group.products}
              onAdd={onAdd}
            />
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
  onDelete,
}: {
  products: Product[];
  categories: ProductCategory[];
  onSave: (products: Array<NewProductInput | Product>) => Promise<void>;
  onDelete: (product: Product) => Promise<void>;
}) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const activeProducts = products.filter((product) => product.ativo);

  async function handleConfirmDelete() {
    if (!productToDelete) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(productToDelete);
      setProductToDelete(null);
    } catch {
      return;
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
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
              {activeProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                activeProducts.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="p-4">
                      <p className="font-medium">
                        {formatProductName(product)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.barcode || product.sku || "Sem código"}
                      </p>
                    </td>
                    <td className="p-4">{product.categoria || "-"}</td>
                    <td className="p-4">
                      {formatCurrency(product.preco_venda)}
                    </td>
                    <td
                      className={`p-4 font-medium ${product.estoque <= product.estoque_minimo ? "text-red-600" : ""}`}
                    >
                      {product.estoque}
                    </td>
                    <td className="p-4">
                      {product.ativo ? "Ativo" : "Inativo"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-3">
                        <ProductModal
                          product={product}
                          categories={categories}
                          onSave={onSave}
                        />
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          className="text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(productToDelete)}
        title="Excluir produto"
        description={`Deseja excluir ${productToDelete ? formatProductName(productToDelete) : "este produto"} do catálogo? O histórico de compras e vendas será preservado.`}
        confirmText={deleting ? "Excluindo..." : "Excluir"}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setProductToDelete(null);
          }
        }}
      />
    </>
  );
}

function QuotesView({
  quotes,
  onConvert,
}: {
  quotes: PosQuote[];
  onConvert: (quoteId: number, paymentMethod: string) => Promise<void>;
}) {
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
              <th className="p-4 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
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
                  <td className="p-4">
                    <PosDocumentModal
                      type="Orçamento"
                      number={quote.id}
                      customer={
                        quote.tutors?.nome || quote.cliente_nome || "Consumidor"
                      }
                      date={quote.created_at}
                      expirationDate={quote.validade}
                      status={quote.status}
                      total={quote.total}
                      items={quote.pos_quote_items || []}
                      onConvert={
                        quote.status === "Aberto"
                          ? (paymentMethod) =>
                              onConvert(quote.id, paymentMethod)
                          : undefined
                      }
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

function SalesView({
  sales,
  onCancel,
}: {
  sales: PosSale[];
  onCancel: (saleId: number) => Promise<void>;
}) {
  const [saleToCancel, setSaleToCancel] = useState<PosSale | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function handleConfirmCancel() {
    if (!saleToCancel) {
      return;
    }

    setCancelling(true);
    try {
      await onCancel(saleToCancel.id);
      setSaleToCancel(null);
    } catch {
      return;
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left">Número</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Data</th>
                <th className="p-4 text-left">Caixa</th>
                <th className="p-4 text-left">Pagamento</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Total</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-t">
                    <td className="p-4">#{String(sale.id).padStart(6, "0")}</td>
                    <td className="p-4">
                      {sale.tutors?.nome || sale.cliente_nome || "Consumidor"}
                    </td>
                    <td className="p-4">{formatDate(sale.created_at)}</td>
                    <td className="p-4">
                      {sale.cash_register_id
                        ? `#${String(sale.cash_register_id).padStart(6, "0")}`
                        : "-"}
                    </td>
                    <td className="p-4">{sale.forma_pagamento}</td>
                    <td className="p-4">
                      <span
                        className={
                          sale.status === "Cancelada"
                            ? "text-red-600"
                            : "text-emerald-600"
                        }
                      >
                        {sale.status || "Concluída"}
                      </span>
                    </td>
                    <td className="p-4">{formatCurrency(sale.total)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-3">
                        <PosDocumentModal
                          type="Venda"
                          number={sale.id}
                          customer={
                            sale.tutors?.nome ||
                            sale.cliente_nome ||
                            "Consumidor"
                          }
                          date={sale.created_at}
                          paymentMethod={sale.forma_pagamento}
                          status={sale.status || "Concluída"}
                          total={sale.total}
                          items={sale.pos_sale_items || []}
                        />
                        {sale.status !== "Cancelada" && (
                          <button
                            type="button"
                            onClick={() => setSaleToCancel(sale)}
                            className="text-red-600"
                          >
                            Excluir venda
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={Boolean(saleToCancel)}
        title="Excluir venda"
        description={`Deseja excluir a venda #${String(saleToCancel?.id || 0).padStart(6, "0")}? Os produtos voltarão ao estoque e a receita será removida do Financeiro.`}
        confirmText={cancelling ? "Excluindo..." : "Excluir venda"}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!cancelling) {
            setSaleToCancel(null);
          }
        }}
      />
    </>
  );
}

function Summary({
  label,
  value,
  textValue,
  currency = false,
  warning = false,
}: {
  label: string;
  value: number;
  textValue?: string;
  currency?: boolean;
  warning?: boolean;
}) {
  const displayValue = textValue ?? (currency ? formatCurrency(value) : value);

  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${warning ? "text-red-600" : ""}`}>
        {displayValue}
      </p>
    </div>
  );
}
