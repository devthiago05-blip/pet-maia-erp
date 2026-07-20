"use client";

import {
  Minus,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CategoryModal } from "@/components/pos/CategoryModal";
import {
  PosDocumentModal,
  type PosQuoteConversion,
} from "@/components/pos/PosDocumentModal";
import { ProductCsvImportModal } from "@/components/pos/ProductCsvImportModal";
import { ProductModal } from "@/components/pos/ProductModal";
import { ProductSelectionModal } from "@/components/pos/ProductSelectionModal";
import {
  type PurchaseInput,
  PurchaseModal,
} from "@/components/pos/PurchaseModal";
import { QuickProductModal } from "@/components/pos/QuickProductModal";
import {
  QuoteEditModal,
  type QuoteUpdateInput,
} from "@/components/pos/QuoteEditModal";
import { StocktakeView } from "@/components/pos/StocktakeView";
import { SupplierModal } from "@/components/pos/SupplierModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useMountEffect } from "@/hooks/useMountEffect";
import { financialPaymentMethods } from "@/lib/financial-options";
import {
  formatCurrency,
  formatDate,
  formatProductName,
} from "@/lib/formatters";
import { isProductFiscalReady } from "@/lib/product-fiscal";
import {
  addPosCashMovement,
  archiveProduct,
  cancelPosSale,
  closePosCashRegister,
  completeProductStocktake,
  convertPosQuote,
  convertPosQuoteWithPayments,
  createPosQuote,
  createPosSale,
  createPosSaleWithPayments,
  createProductCategory,
  createProductPurchase,
  createProducts,
  createSupplier,
  deletePosQuote,
  deleteProductStocktakeDraft,
  fetchPosCashRegisters,
  fetchPosQuotes,
  fetchPosSales,
  fetchProductCategories,
  fetchProductPurchases,
  fetchProducts,
  fetchProductStocktakeDraft,
  fetchProductStocktakes,
  fetchSuppliers,
  openPosCashRegister,
  saveProductStocktakeDraft,
  updatePosQuote,
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
  ProductStocktake,
  ProductStocktakeDraft,
  Supplier,
  Tutor,
} from "@/types/domain";

interface CartItem {
  product: Product;
  quantity: number;
}

interface PaymentSplit {
  id: string;
  method: string;
  amount: string;
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

function getCashMovements(register: PosCashRegister) {
  return (
    register.pos_cash_movements
      ?.slice()
      .sort(
        (first, second) =>
          new Date(first.created_at).getTime() -
          new Date(second.created_at).getTime(),
      ) || []
  );
}

function sumCashMovements(
  register: PosCashRegister,
  movementType: PosCashMovementType,
) {
  return getCashMovements(register)
    .filter((movement) => movement.movement_type === movementType)
    .reduce((total, movement) => total + Number(movement.amount || 0), 0);
}

function getCashPaymentSummary(register: PosCashRegister) {
  const summary = new Map<string, number>();

  getCashMovements(register).forEach((movement) => {
    if (
      movement.movement_type !== "venda" &&
      movement.movement_type !== "cancelamento_venda"
    ) {
      return;
    }

    const sign = movement.movement_type === "cancelamento_venda" ? -1 : 1;
    const salePayments = movement.pos_sales?.pos_sale_payments || [];

    if (salePayments.length > 0) {
      salePayments.forEach((payment) => {
        const current = summary.get(payment.payment_method) || 0;
        summary.set(
          payment.payment_method,
          current + sign * Number(payment.amount || 0),
        );
      });
      return;
    }

    const method = movement.pos_sales?.forma_pagamento || "Nao informado";
    const current = summary.get(method) || 0;
    summary.set(method, current + sign * Number(movement.amount || 0));
  });

  return Array.from(summary.entries())
    .map(([method, amount]) => ({ method, amount }))
    .filter((item) => Math.abs(item.amount) >= 0.01)
    .sort((first, second) => second.amount - first.amount);
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [quotes, setQuotes] = useState<PosQuote[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [cashRegisters, setCashRegisters] = useState<PosCashRegister[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [stocktakes, setStocktakes] = useState<ProductStocktake[]>([]);
  const [stocktakeDraft, setStocktakeDraft] =
    useState<ProductStocktakeDraft | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<
    | "sale"
    | "cash"
    | "products"
    | "stocktake"
    | "purchases"
    | "quotes"
    | "sales"
  >("sale");
  const [search, setSearch] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [splitPayments, setSplitPayments] = useState(false);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: "payment-1", method: "PIX", amount: "" },
  ]);
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
  const paymentTotal = payments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0,
  );
  const paymentDifference = Number((cartTotal - paymentTotal).toFixed(2));
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
      stocktakesResponse,
      stocktakeDraftResponse,
    ] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
      fetchPosQuotes(),
      fetchPosSales(),
      fetchPosCashRegisters(),
      fetchTutors(),
      fetchSuppliers(),
      fetchProductPurchases(),
      fetchProductStocktakes(),
      fetchProductStocktakeDraft(),
    ]);

    const error =
      productsResponse.error ||
      categoriesResponse.error ||
      quotesResponse.error ||
      salesResponse.error ||
      cashRegistersResponse.error ||
      tutorsResponse.error ||
      suppliersResponse.error ||
      purchasesResponse.error ||
      stocktakesResponse.error ||
      stocktakeDraftResponse.error;

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
    setStocktakes((stocktakesResponse.data || []) as ProductStocktake[]);
    setStocktakeDraft(
      (stocktakeDraftResponse.data as ProductStocktakeDraft | null) || null,
    );
    setLoading(false);
  }

  async function handleCompleteStocktake(input: {
    items: Array<{ product_id: number; counted_quantity: number }>;
    notes: string;
  }) {
    setProcessing(true);
    const { data, error } = await completeProductStocktake(input);
    setProcessing(false);

    if (error) {
      console.error(error);
      toast.error(error.message || "Erro ao finalizar balanço");
      return false;
    }

    const result = data as { changed_count?: number } | null;
    toast.success(
      `Balanço finalizado! ${result?.changed_count ?? 0} produto(s) ajustado(s).`,
    );
    await loadData();
    return true;
  }

  async function handleSaveStocktakeDraft(input: {
    items: Array<{ product_id: number; counted_quantity: number | null }>;
    notes: string;
  }) {
    setProcessing(true);
    const { error } = await saveProductStocktakeDraft(input);
    setProcessing(false);

    if (error) {
      console.error(error);
      toast.error(error.message || "Erro ao salvar rascunho");
      return false;
    }

    toast.success("Rascunho do balanço salvo!");
    await loadData();
    return true;
  }

  async function handleDeleteStocktakeDraft() {
    setProcessing(true);
    const { error } = await deleteProductStocktakeDraft();
    setProcessing(false);

    if (error) {
      console.error(error);
      toast.error(error.message || "Erro ao descartar rascunho");
      return false;
    }

    setStocktakeDraft(null);
    toast.success("Rascunho descartado");
    return true;
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

  function updatePaymentSplit(
    paymentId: string,
    field: "method" | "amount",
    value: string,
  ) {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === paymentId ? { ...payment, [field]: value } : payment,
      ),
    );
  }

  function addPaymentSplit() {
    setPayments((current) => [
      ...current,
      {
        id: `payment-${Date.now()}`,
        method: "PIX",
        amount: "",
      },
    ]);
  }

  function removePaymentSplit(paymentId: string) {
    setPayments((current) =>
      current.length === 1
        ? current
        : current.filter((payment) => payment.id !== paymentId),
    );
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

    const customer = getCustomer();
    const saleItems = cart.map((item) => ({
      product_id: item.product.id,
      quantidade: item.quantity,
    }));

    if (splitPayments) {
      const normalizedPayments = payments
        .map((payment) => ({
          payment_method: payment.method,
          amount: Number(payment.amount || 0),
        }))
        .filter((payment) => payment.amount > 0);

      if (normalizedPayments.length === 0) {
        toast.error("Informe ao menos um pagamento");
        return;
      }

      if (Math.abs(paymentDifference) >= 0.01) {
        toast.error("A soma dos pagamentos precisa fechar o total da venda");
        return;
      }

      setProcessing(true);
      const { error } = await createPosSaleWithPayments({
        ...customer,
        payments: normalizedPayments,
        items: saleItems,
      });
      setProcessing(false);

      if (error) {
        toast.error(error.message);
        return;
      }
    } else {
      setProcessing(true);
      const { error } = await createPosSale({
        ...customer,
        paymentMethod,
        items: saleItems,
      });
      setProcessing(false);

      if (error) {
        toast.error(error.message);
        return;
      }
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
    setSplitPayments(false);
    setPayments([{ id: "payment-1", method: "PIX", amount: "" }]);
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

  async function handleQuoteConvert(
    quoteId: number,
    conversion: PosQuoteConversion,
  ) {
    if (!openCashRegister) {
      toast.error("Abra o caixa antes de converter o orcamento em venda");
      setView("cash");
      return;
    }

    const response = conversion.payments
      ? await convertPosQuoteWithPayments(quoteId, conversion.payments)
      : await convertPosQuote(quoteId, conversion.paymentMethod || "PIX");

    const { error } = response;

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Orçamento convertido em venda!");
    await loadData();
    setView("sales");
  }

  async function handleQuoteDelete(quoteId: number) {
    const { error } = await deletePosQuote(quoteId);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Orçamento excluído com sucesso!");
    setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
  }

  async function handleQuoteUpdate(input: QuoteUpdateInput) {
    const { error } = await updatePosQuote(input);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Orçamento atualizado com sucesso!");
    await loadData();
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
                <QuickProductModal
                  categories={categories}
                  onSave={handleProductSave}
                />
                <ProductCsvImportModal
                  categories={categories}
                  onSave={handleProductSave}
                />
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
              ["stocktake", "Balanço"],
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
              splitPayments={splitPayments}
              payments={payments}
              paymentTotal={paymentTotal}
              paymentDifference={paymentDifference}
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
              onSplitPayments={setSplitPayments}
              onPaymentSplit={updatePaymentSplit}
              onAddPaymentSplit={addPaymentSplit}
              onRemovePaymentSplit={removePaymentSplit}
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
              sales={sales}
              onSave={handleProductSave}
              onDelete={handleProductDelete}
            />
          ) : view === "stocktake" ? (
            <StocktakeView
              products={products}
              stocktakes={stocktakes}
              draft={stocktakeDraft}
              processing={processing}
              onComplete={handleCompleteStocktake}
              onSaveDraft={handleSaveStocktakeDraft}
              onDeleteDraft={handleDeleteStocktakeDraft}
            />
          ) : view === "purchases" ? (
            <PurchasesView purchases={purchases} suppliers={suppliers} />
          ) : view === "quotes" ? (
            <QuotesView
              quotes={quotes}
              products={products}
              tutors={tutors}
              onConvert={handleQuoteConvert}
              onDelete={handleQuoteDelete}
              onUpdate={handleQuoteUpdate}
            />
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
  const [registerToPrint, setRegisterToPrint] =
    useState<PosCashRegister | null>(null);

  const openMovements = openCashRegister
    ? getCashMovements(openCashRegister)
    : [];

  function printRegister(register: PosCashRegister) {
    setRegisterToPrint(register);
    window.addEventListener("afterprint", () => setRegisterToPrint(null), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

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
    <>
      <CashDashboard cashRegisters={cashRegisters} />

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
              <div className="flex flex-wrap items-center gap-2">
                {openCashRegister && (
                  <button
                    type="button"
                    onClick={() => printRegister(openCashRegister)}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
                  >
                    <Printer size={16} />
                    Imprimir caixa
                  </button>
                )}
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
                        <td className="p-4">
                          {formatDate(movement.created_at)}
                        </td>
                        <td className="p-4">
                          {formatCashMovementType(movement.movement_type)}
                        </td>
                        <td className="p-4">
                          {formatCurrency(movement.amount)}
                        </td>
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
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          register.status === "Aberto"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {register.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => printRegister(register)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#8A0EEA]"
                      >
                        <Printer size={13} />
                        Imprimir
                      </button>
                    </div>
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

      {registerToPrint && (
        <CashRegisterPrintDocument register={registerToPrint} />
      )}
    </>
  );
}

function CashDashboard({
  cashRegisters,
}: {
  cashRegisters: PosCashRegister[];
}) {
  const now = new Date();
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
  );
  const [operatorId, setOperatorId] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [dashboardToPrint, setDashboardToPrint] = useState(false);

  const operators = useMemo(() => {
    const uniqueOperators = new Map<string, string>();

    cashRegisters.forEach((register) => {
      if (register.opened_by) {
        uniqueOperators.set(
          register.opened_by,
          register.user_profiles?.nome ||
            `Operador ${register.opened_by.slice(0, 8)}`,
        );
      }
    });

    return Array.from(uniqueOperators.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
  }, [cashRegisters]);

  const filteredRegisters = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return cashRegisters.filter((register) => {
      const openedAt = new Date(register.opened_at);

      return (
        (!start || openedAt >= start) &&
        (!end || openedAt <= end) &&
        (operatorId === "todos" || register.opened_by === operatorId) &&
        (status === "todos" || register.status === status)
      );
    });
  }, [cashRegisters, endDate, operatorId, startDate, status]);

  const totals = useMemo(() => {
    const paymentMethods = new Map<string, number>();
    let sales = 0;
    let cancellations = 0;
    let supplies = 0;
    let withdrawals = 0;
    let expected = 0;
    let counted = 0;
    let difference = 0;

    filteredRegisters.forEach((register) => {
      sales += sumCashMovements(register, "venda");
      cancellations += sumCashMovements(register, "cancelamento_venda");
      supplies += sumCashMovements(register, "suprimento");
      withdrawals += sumCashMovements(register, "sangria");
      expected += Number(register.expected_amount || 0);

      if (register.status === "Fechado") {
        counted += Number(register.closing_amount || 0);
        difference += Number(register.difference_amount || 0);
      }

      getCashPaymentSummary(register).forEach((payment) => {
        paymentMethods.set(
          payment.method,
          (paymentMethods.get(payment.method) || 0) + payment.amount,
        );
      });
    });

    return {
      sales,
      cancellations,
      supplies,
      withdrawals,
      expected,
      counted,
      difference,
      paymentMethods: Array.from(paymentMethods.entries())
        .map(([method, amount]) => ({ method, amount }))
        .filter((payment) => Math.abs(payment.amount) >= 0.01)
        .sort((first, second) => second.amount - first.amount),
    };
  }, [filteredRegisters]);

  function printDashboard() {
    setDashboardToPrint(true);
    window.addEventListener("afterprint", () => setDashboardToPrint(false), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      <section className="mb-6 space-y-5 rounded-xl border bg-white p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Dashboard do caixa</h2>
            <p className="text-sm text-slate-500">
              Acompanhe resultados por período e operador.
            </p>
          </div>
          <button
            type="button"
            onClick={printDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
          >
            <Printer size={16} />
            Imprimir relatório
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Data inicial
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Data final
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Operador
            <select
              value={operatorId}
              onChange={(event) => setOperatorId(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            >
              <option value="todos">Todos os operadores</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-500">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border p-3 text-sm text-slate-900"
            >
              <option value="todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Fechado">Fechado</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Summary label="Caixas" value={filteredRegisters.length} />
          <Summary label="Vendas" value={totals.sales} currency />
          <Summary
            label="Cancelamentos"
            value={totals.cancellations}
            currency
          />
          <Summary label="Esperado" value={totals.expected} currency />
          <Summary label="Contado" value={totals.counted} currency />
          <Summary label="Diferença" value={totals.difference} currency />
          <Summary label="Suprimentos" value={totals.supplies} currency />
          <Summary label="Sangrias" value={totals.withdrawals} currency />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.45fr)]">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left">Caixa</th>
                  <th className="p-3 text-left">Operador</th>
                  <th className="p-3 text-left">Abertura</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Vendas</th>
                  <th className="p-3 text-right">Esperado</th>
                  <th className="p-3 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegisters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-5 text-center text-slate-500">
                      Nenhum caixa encontrado nos filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredRegisters.map((register) => (
                    <tr key={register.id} className="border-t">
                      <td className="p-3 font-medium">
                        #{String(register.id).padStart(6, "0")}
                      </td>
                      <td className="p-3">
                        {register.user_profiles?.nome ||
                          (register.opened_by
                            ? `Operador ${register.opened_by.slice(0, 8)}`
                            : "-")}
                      </td>
                      <td className="p-3">{formatDate(register.opened_at)}</td>
                      <td className="p-3">{register.status}</td>
                      <td className="p-3 text-right">
                        {formatCurrency(sumCashMovements(register, "venda"))}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(register.expected_amount)}
                      </td>
                      <td className="p-3 text-right">
                        {register.status === "Fechado"
                          ? formatCurrency(register.difference_amount || 0)
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-bold">Formas de pagamento</h3>
            <div className="mt-3 space-y-2">
              {totals.paymentMethods.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma venda encontrada.
                </p>
              ) : (
                totals.paymentMethods.map((payment) => (
                  <div
                    key={payment.method}
                    className="flex justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                  >
                    <span>{payment.method}</span>
                    <strong>{formatCurrency(payment.amount)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {dashboardToPrint && (
        <CashDashboardPrintDocument
          registers={filteredRegisters}
          startDate={startDate}
          endDate={endDate}
          totals={totals}
        />
      )}
    </>
  );
}

function CashDashboardPrintDocument({
  registers,
  startDate,
  endDate,
  totals,
}: {
  registers: PosCashRegister[];
  startDate: string;
  endDate: string;
  totals: {
    sales: number;
    cancellations: number;
    supplies: number;
    withdrawals: number;
    expected: number;
    counted: number;
    difference: number;
    paymentMethods: Array<{ method: string; amount: number }>;
  };
}) {
  return (
    <section className="document-print-area hidden bg-white p-8 text-slate-950 print:block">
      <header className="border-b-4 border-[#8A0EEA] pb-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
          Clínica Veterinária Pet Maia
        </p>
        <h1 className="mt-1 text-2xl font-bold">Dashboard do caixa</h1>
        <p className="mt-1 text-sm text-slate-600">
          Período: {startDate || "início"} até {endDate || "hoje"} · Emitido em {formatDate(new Date().toISOString())}
        </p>
      </header>

      <div className="mt-6 grid grid-cols-4 gap-3">
        <PrintMetric label="Caixas" textValue={String(registers.length)} />
        <PrintMetric label="Vendas" value={totals.sales} />
        <PrintMetric label="Cancelamentos" value={totals.cancellations} />
        <PrintMetric label="Esperado" value={totals.expected} />
        <PrintMetric label="Contado" value={totals.counted} />
        <PrintMetric label="Diferença" value={totals.difference} />
        <PrintMetric label="Suprimentos" value={totals.supplies} />
        <PrintMetric label="Sangrias" value={totals.withdrawals} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {totals.paymentMethods.map((payment) => (
          <div key={payment.method} className="flex justify-between border p-3 text-sm">
            <span>{payment.method}</span>
            <strong>{formatCurrency(payment.amount)}</strong>
          </div>
        ))}
      </div>

      <table className="mt-6 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border p-2">Caixa</th>
            <th className="border p-2">Operador</th>
            <th className="border p-2">Abertura</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Vendas</th>
            <th className="border p-2">Esperado</th>
            <th className="border p-2">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {registers.map((register) => (
            <tr key={register.id}>
              <td className="border p-2">#{String(register.id).padStart(6, "0")}</td>
              <td className="border p-2">
                {register.user_profiles?.nome ||
                  (register.opened_by
                    ? `Operador ${register.opened_by.slice(0, 8)}`
                    : "-")}
              </td>
              <td className="border p-2">{formatDate(register.opened_at)}</td>
              <td className="border p-2">{register.status}</td>
              <td className="border p-2">{formatCurrency(sumCashMovements(register, "venda"))}</td>
              <td className="border p-2">{formatCurrency(register.expected_amount)}</td>
              <td className="border p-2">
                {register.status === "Fechado"
                  ? formatCurrency(register.difference_amount || 0)
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CashRegisterPrintDocument({
  register,
}: {
  register: PosCashRegister;
}) {
  const movements = getCashMovements(register);
  const openingAmount = Number(register.opening_amount || 0);
  const salesAmount = sumCashMovements(register, "venda");
  const canceledSalesAmount = sumCashMovements(register, "cancelamento_venda");
  const supplyAmount = sumCashMovements(register, "suprimento");
  const withdrawalAmount = sumCashMovements(register, "sangria");
  const expectedAmount = Number(register.expected_amount || 0);
  const closingAmount = Number(register.closing_amount || 0);
  const differenceAmount = Number(register.difference_amount || 0);
  const paymentSummary = getCashPaymentSummary(register);

  return (
    <section className="cash-print-area hidden bg-white p-8 text-slate-950 print:block">
      <header className="flex items-start justify-between border-b-4 border-[#8A0EEA] pb-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
            Clinica Veterinaria Pet Maia
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            Relatorio de fechamento de caixa
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Caixa #{String(register.id).padStart(6, "0")} - {register.status}
          </p>
        </div>
        <div className="text-right text-sm">
          <p>Aberto em: {formatDate(register.opened_at)}</p>
          <p>
            Fechado em:{" "}
            {register.closed_at ? formatDate(register.closed_at) : "-"}
          </p>
          <p>Emitido em: {formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <PrintMetric label="Abertura" value={openingAmount} />
        <PrintMetric label="Vendas" value={salesAmount} />
        <PrintMetric label="Cancelamentos" value={canceledSalesAmount} />
        <PrintMetric label="Suprimentos" value={supplyAmount} />
        <PrintMetric label="Sangrias" value={withdrawalAmount} />
        <PrintMetric label="Esperado" value={expectedAmount} />
        <PrintMetric label="Valor contado" value={closingAmount} />
        <PrintMetric label="Diferenca" value={differenceAmount} />
        <PrintMetric label="Movimentos" textValue={String(movements.length)} />
      </div>

      <div className="mt-6 rounded-lg border border-slate-300">
        <div className="border-b border-slate-300 bg-slate-100 p-3 font-semibold">
          Totais por forma de pagamento
        </div>
        <div className="grid grid-cols-2 gap-3 p-3">
          {paymentSummary.length === 0 ? (
            <p className="col-span-2 text-sm text-slate-500">
              Nenhuma venda vinculada ao caixa.
            </p>
          ) : (
            paymentSummary.map((item) => (
              <div
                key={item.method}
                className="flex justify-between rounded-lg border border-slate-200 p-3 text-sm"
              >
                <span>{item.method}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-300">
        <div className="border-b border-slate-300 bg-slate-100 p-3 font-semibold">
          Movimentacoes
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="p-3 text-left">Data</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Observacao</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">
                  Nenhuma movimentacao registrada.
                </td>
              </tr>
            ) : (
              movements.map((movement) => (
                <tr key={movement.id} className="border-b border-slate-200">
                  <td className="p-3">{formatDate(movement.created_at)}</td>
                  <td className="p-3">
                    {formatCashMovementType(movement.movement_type)}
                  </td>
                  <td className="p-3">{movement.notes || "-"}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(movement.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-10 grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-slate-400 pt-2">
          Responsavel pelo caixa
        </div>
        <div className="border-t border-slate-400 pt-2">Conferencia</div>
      </footer>
    </section>
  );
}

function PrintMetric({
  label,
  value,
  textValue,
}: {
  label: string;
  value?: number;
  textValue?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-300 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">
        {textValue ?? formatCurrency(value || 0)}
      </p>
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
  splitPayments,
  payments,
  paymentTotal,
  paymentDifference,
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
  onSplitPayments,
  onPaymentSplit,
  onAddPaymentSplit,
  onRemovePaymentSplit,
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
  splitPayments: boolean;
  payments: PaymentSplit[];
  paymentTotal: number;
  paymentDifference: number;
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
  onSplitPayments: (value: boolean) => void;
  onPaymentSplit: (
    paymentId: string,
    field: "method" | "amount",
    value: string,
  ) => void;
  onAddPaymentSplit: () => void;
  onRemovePaymentSplit: (paymentId: string) => void;
  onExpirationDate: (value: string) => void;
  onQuote: () => void;
  onSale: () => void;
  onClear: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [stockFilter, setStockFilter] = useState("disponiveis");
  const categoryOptions = useMemo(() => {
    const categories = groups.map((group) => group.category || "Sem categoria");

    return Array.from(new Set(categories)).sort((first, second) =>
      first.localeCompare(second, "pt-BR"),
    );
  }, [groups]);
  const displayedGroups = useMemo(() => {
    return groups.filter((group) => {
      const category = group.category || "Sem categoria";
      const totalStock = group.products.reduce(
        (totalStockInGroup, product) => totalStockInGroup + product.estoque,
        0,
      );
      const hasLowStock = group.products.some(
        (product) => product.estoque <= product.estoque_minimo,
      );

      return (
        (categoryFilter === "Todas" || category === categoryFilter) &&
        (stockFilter === "todos" ||
          (stockFilter === "disponiveis" && totalStock > 0) ||
          (stockFilter === "baixo" && hasLowStock))
      );
    });
  }, [categoryFilter, groups, stockFilter]);

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

        <div className="grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-3">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="Todas">Todas as categorias</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="disponiveis">Somente com estoque</option>
            <option value="baixo">Estoque baixo</option>
            <option value="todos">Todos os produtos</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter("Todas");
              setStockFilter("disponiveis");
              onSearch("");
            }}
            className="rounded-xl border border-[#8A0EEA]/20 px-4 py-3 font-semibold text-[#8A0EEA] transition hover:bg-purple-50"
          >
            Limpar busca
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayedGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              Nenhum produto encontrado com os filtros atuais.
            </div>
          ) : (
            displayedGroups.map((group) => (
              <ProductSelectionModal
                key={group.key}
                name={group.name}
                category={group.category}
                products={group.products}
                onAdd={onAdd}
              />
            ))
          )}
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
            {financialPaymentMethods.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Pagamento dividido</span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={splitPayments}
                  onChange={(event) => onSplitPayments(event.target.checked)}
                  className="size-4 accent-[#8A0EEA]"
                />
                Ativar
              </label>
            </div>

            {splitPayments && (
              <div className="mt-3 space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
                  >
                    <select
                      value={payment.method}
                      onChange={(event) =>
                        onPaymentSplit(payment.id, "method", event.target.value)
                      }
                      className="rounded-lg border p-2 text-sm"
                    >
                      {financialPaymentMethods.map((method) => (
                        <option key={method}>{method}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={(event) =>
                        onPaymentSplit(payment.id, "amount", event.target.value)
                      }
                      placeholder="Valor"
                      className="rounded-lg border p-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => onRemovePaymentSplit(payment.id)}
                      disabled={payments.length === 1}
                      className="rounded-lg border px-3 text-sm text-red-600 disabled:opacity-40"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onAddPaymentSplit}
                  className="text-sm font-semibold text-[#8A0EEA]"
                >
                  Adicionar forma de pagamento
                </button>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
                  <span className="text-slate-500">Pago</span>
                  <strong className="text-right">
                    {formatCurrency(paymentTotal)}
                  </strong>
                  <span className="text-slate-500">Diferenca</span>
                  <strong
                    className={`text-right ${
                      Math.abs(paymentDifference) >= 0.01
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {formatCurrency(paymentDifference)}
                  </strong>
                </div>
              </div>
            )}
          </div>
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
            disabled={
              processing ||
              cart.length === 0 ||
              (splitPayments && Math.abs(paymentDifference) >= 0.01)
            }
            className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-50"
          >
            {processing ? "Processando..." : "Finalizar venda"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function StockTurnoverDashboard({
  products,
  sales,
}: {
  products: Product[];
  sales: PosSale[];
}) {
  const [reportToPrint, setReportToPrint] = useState(false);

  const report = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const soldByProduct = new Map<
      number,
      { quantity: number; revenue: number }
    >();

    sales
      .filter(
        (sale) =>
          sale.status !== "Cancelada" && new Date(sale.created_at) >= cutoffDate,
      )
      .forEach((sale) => {
        sale.pos_sale_items?.forEach((item) => {
          if (!item.product_id) {
            return;
          }

          const current = soldByProduct.get(item.product_id) || {
            quantity: 0,
            revenue: 0,
          };
          soldByProduct.set(item.product_id, {
            quantity: current.quantity + Number(item.quantidade || 0),
            revenue: current.revenue + Number(item.subtotal || 0),
          });
        });
      });

    const rows = products
      .map((product) => ({
        product,
        quantitySold: soldByProduct.get(product.id)?.quantity || 0,
        revenue: soldByProduct.get(product.id)?.revenue || 0,
      }))
      .sort((first, second) => second.quantitySold - first.quantitySold);

    return {
      rows,
      lowStock: rows.filter(
        ({ product }) => product.estoque <= product.estoque_minimo,
      ),
      noMovement: rows.filter(({ quantitySold }) => quantitySold === 0),
      unitsSold: rows.reduce((sum, row) => sum + row.quantitySold, 0),
      revenue: rows.reduce((sum, row) => sum + row.revenue, 0),
      inventoryCost: products.reduce(
        (sum, product) =>
          sum + Number(product.preco_custo || 0) * Number(product.estoque || 0),
        0,
      ),
    };
  }, [products, sales]);

  function printReport() {
    setReportToPrint(true);
    window.addEventListener("afterprint", () => setReportToPrint(false), {
      once: true,
    });
    window.setTimeout(() => window.print(), 100);
  }

  return (
    <>
      <section className="mb-6 space-y-4 rounded-xl border bg-white p-4 sm:p-5 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Estoque e giro de produtos</h2>
            <p className="text-sm text-slate-500">
              Vendas e movimentação dos últimos 30 dias.
            </p>
          </div>
          <button
            type="button"
            onClick={printReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-[#8A0EEA]"
          >
            <Printer size={16} />
            Imprimir relatório
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Summary label="Produtos ativos" value={products.length} />
          <Summary label="Estoque baixo" value={report.lowStock.length} />
          <Summary label="Sem giro" value={report.noMovement.length} />
          <Summary label="Unidades vendidas" value={report.unitsSold} />
          <Summary label="Custo em estoque" value={report.inventoryCost} currency />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-red-50 p-3 font-semibold text-red-700">
              Reposição necessária
            </div>
            <div className="max-h-64 overflow-y-auto">
              {report.lowStock.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">
                  Nenhum produto com estoque baixo.
                </p>
              ) : (
                report.lowStock.map(({ product }) => (
                  <div
                    key={product.id}
                    className="flex justify-between gap-3 border-b p-3 text-sm last:border-b-0"
                  >
                    <span>{formatProductName(product)}</span>
                    <strong className="text-red-600">
                      {product.estoque} / mín. {product.estoque_minimo}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-purple-50 p-3 font-semibold text-[#8A0EEA]">
              Produtos com maior giro
            </div>
            <div className="max-h-64 overflow-y-auto">
              {report.rows.slice(0, 10).map((row) => (
                <div
                  key={row.product.id}
                  className="grid grid-cols-[1fr_auto_auto] gap-3 border-b p-3 text-sm last:border-b-0"
                >
                  <span>{formatProductName(row.product)}</span>
                  <strong>{row.quantitySold} un.</strong>
                  <strong>{formatCurrency(row.revenue)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {reportToPrint && (
        <section className="document-print-area hidden bg-white p-8 text-slate-950 print:block">
          <header className="border-b-4 border-[#8A0EEA] pb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#8A0EEA]">
              Clínica Veterinária Pet Maia
            </p>
            <h1 className="mt-1 text-2xl font-bold">
              Relatório de estoque e giro
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Últimos 30 dias · Emitido em {formatDate(new Date().toISOString())}
            </p>
          </header>

          <div className="mt-6 grid grid-cols-5 gap-3">
            <PrintMetric label="Produtos" textValue={String(products.length)} />
            <PrintMetric
              label="Estoque baixo"
              textValue={String(report.lowStock.length)}
            />
            <PrintMetric
              label="Sem giro"
              textValue={String(report.noMovement.length)}
            />
            <PrintMetric
              label="Unidades vendidas"
              textValue={String(report.unitsSold)}
            />
            <PrintMetric label="Custo em estoque" value={report.inventoryCost} />
          </div>

          <table className="mt-6 w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border p-2">Produto</th>
                <th className="border p-2">Categoria</th>
                <th className="border p-2">Estoque</th>
                <th className="border p-2">Mínimo</th>
                <th className="border p-2">Vendidos</th>
                <th className="border p-2">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.product.id}>
                  <td className="border p-2">
                    {formatProductName(row.product)}
                  </td>
                  <td className="border p-2">{row.product.categoria || "-"}</td>
                  <td className="border p-2">{row.product.estoque}</td>
                  <td className="border p-2">{row.product.estoque_minimo}</td>
                  <td className="border p-2">{row.quantitySold}</td>
                  <td className="border p-2">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

function ProductsView({
  products,
  categories,
  sales,
  onSave,
  onDelete,
}: {
  products: Product[];
  categories: ProductCategory[];
  sales: PosSale[];
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
      <StockTurnoverDashboard products={activeProducts} sales={sales} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Catálogo de produtos</h2>
          <p className="text-sm text-slate-500">
            Preços, estoque e manutenção dos produtos ativos.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {activeProducts.length}
        </span>
      </div>

      <div className="space-y-3 md:hidden">
        {activeProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Nenhum produto cadastrado.
          </div>
        ) : (
          activeProducts.map((product) => {
            const lowStock = product.estoque <= product.estoque_minimo;
            const fiscalReady = isProductFiscalReady(product);

            return (
              <article
                key={product.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-slate-900">
                      {formatProductName(product)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.barcode || product.sku || "Sem código"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.categoria || "Sem categoria"}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-[#8A0EEA]">
                    {formatCurrency(product.preco_venda)}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Estoque atual</p>
                    <p className={`text-xl font-bold ${lowStock ? "text-red-600" : "text-slate-900"}`}>
                      {product.estoque}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      lowStock
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {lowStock ? "Estoque baixo" : "Estoque normal"}
                  </span>
                </div>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${fiscalReady ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                  {fiscalReady ? "Fiscal completo" : "Fiscal pendente"}
                </span>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
                  <div className="flex min-h-10 items-center justify-center rounded-xl bg-purple-50 font-semibold text-[#8A0EEA]">
                    <ProductModal
                      product={product}
                      categories={categories}
                      onSave={onSave}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(product)}
                    className="min-h-10 rounded-xl bg-red-50 font-semibold text-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
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
                      <div className="flex flex-col items-start gap-1">
                        <span>{product.ativo ? "Ativo" : "Inativo"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isProductFiscalReady(product) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {isProductFiscalReady(product) ? "Fiscal completo" : "Fiscal pendente"}
                        </span>
                      </div>
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
  products,
  tutors,
  onConvert,
  onDelete,
  onUpdate,
}: {
  quotes: PosQuote[];
  products: Product[];
  tutors: Tutor[];
  onConvert: (
    quoteId: number,
    conversion: PosQuoteConversion,
  ) => Promise<void>;
  onDelete: (quoteId: number) => Promise<void>;
  onUpdate: (input: QuoteUpdateInput) => Promise<void>;
}) {
  const [quoteToDelete, setQuoteToDelete] = useState<PosQuote | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!quoteToDelete) return;
    setDeleting(true);
    try {
      await onDelete(quoteToDelete.id);
      setQuoteToDelete(null);
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
                    <div className="flex flex-wrap items-center gap-3">
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
                          ? (conversion) => onConvert(quote.id, conversion)
                          : undefined
                      }
                    />
                    {quote.status === "Aberto" && (
                      <QuoteEditModal
                        quote={quote}
                        products={products}
                        tutors={tutors}
                        onSave={onUpdate}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setQuoteToDelete(quote)}
                      className="font-semibold text-red-600"
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
      isOpen={Boolean(quoteToDelete)}
      title="Excluir orçamento?"
      description={quoteToDelete ? `O orçamento #${String(quoteToDelete.id).padStart(6, "0")} e todos os seus itens serão removidos permanentemente.` : ""}
      confirmText={deleting ? "Excluindo..." : "Excluir orçamento"}
      onConfirm={() => void handleConfirmDelete()}
      onCancel={() => { if (!deleting) setQuoteToDelete(null); }}
    />
    </>
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">Histórico de vendas</h2>
          <p className="text-sm text-slate-500">
            Consulte comprovantes e acompanhe o status das vendas.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {sales.length}
        </span>
      </div>

      <div className="space-y-3 md:hidden">
        {sales.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            Nenhuma venda registrada.
          </div>
        ) : (
          sales.map((sale) => {
            const customer =
              sale.tutors?.nome || sale.cliente_nome || "Consumidor";
            const cancelled = sale.status === "Cancelada";

            return (
              <article
                key={sale.id}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      VENDA #{String(sale.id).padStart(6, "0")}
                    </p>
                    <h3 className="mt-1 font-bold text-slate-900">{customer}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(sale.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#8A0EEA]">
                      {formatCurrency(sale.total)}
                    </p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        cancelled
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {sale.status || "Concluída"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Pagamento</p>
                    <p className="font-semibold text-slate-700">
                      {sale.forma_pagamento || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Caixa</p>
                    <p className="font-semibold text-slate-700">
                      {sale.cash_register_id
                        ? `#${String(sale.cash_register_id).padStart(6, "0")}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className={`mt-3 grid gap-2 border-t pt-3 ${cancelled ? "grid-cols-1" : "grid-cols-2"}`}>
                  <div className="flex min-h-10 items-center justify-center rounded-xl bg-purple-50 font-semibold text-[#8A0EEA]">
                    <PosDocumentModal
                      type="Venda"
                      number={sale.id}
                      customer={customer}
                      date={sale.created_at}
                      paymentMethod={sale.forma_pagamento}
                      status={sale.status || "Concluída"}
                      total={sale.total}
                      items={sale.pos_sale_items || []}
                    />
                  </div>
                  {!cancelled && (
                    <button
                      type="button"
                      onClick={() => setSaleToCancel(sale)}
                      className="min-h-10 rounded-xl bg-red-50 font-semibold text-red-600"
                    >
                      Excluir venda
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-white md:block">
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
