"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { CategoryModal } from "@/components/pos/CategoryModal";
import {
  type CartItem,
  integratedPaymentType,
  type ManualCashMovementType,
  type PaymentSplit,
  type ProductGroup,
  Summary,
} from "@/components/pos/pos-page-shared";
import { CashRegisterView } from "@/components/pos/PosCashViews";
import { type PosQuoteConversion } from "@/components/pos/PosDocumentModal";
import {
  QuotesView,
  SalesView,
} from "@/components/pos/PosHistoryViews";
import { ProductsView } from "@/components/pos/PosProductsView";
import { PurchasesView } from "@/components/pos/PosPurchasesView";
import { SaleView } from "@/components/pos/PosSaleView";
import { ProductCsvImportModal } from "@/components/pos/ProductCsvImportModal";
import { ProductModal } from "@/components/pos/ProductModal";
import {
  type PurchaseInput,
  PurchaseModal,
} from "@/components/pos/PurchaseModal";
import { type NewPurchaseOrderInput } from "@/components/pos/PurchaseOrdersPanel";
import { QuickProductModal } from "@/components/pos/QuickProductModal";
import { type QuoteUpdateInput } from "@/components/pos/QuoteEditModal";
import { StocktakeView } from "@/components/pos/StocktakeView";
import { SupplierModal } from "@/components/pos/SupplierModal";
import { useMountEffect } from "@/hooks/useMountEffect";
import { formatCurrency, formatProductName } from "@/lib/formatters";
import {
  fetchPaymentIntegrationStatus,
  issueNfceForSale,
  linkCheckoutPayments,
  processCheckoutPayment,
} from "@/services/payment-integration";
import {
  addPosCashMovement,
  archiveProduct,
  archiveProducts,
  cancelPosSale,
  closePosCashRegister,
  completeProductStocktake,
  convertPosQuote,
  convertPosQuoteWithPayments,
  createPosQuote,
  createPosSale,
  createPosSaleWithChange,
  createPosSaleWithPayments,
  createProductCategory,
  createProductPurchase,
  createProducts,
  createPurchaseOrder,
  createSupplier,
  deleteInactiveProduct,
  deleteInactiveProducts,
  deletePosQuote,
  deleteProductPurchase,
  deleteProductStocktakeDraft,
  deleteSuspendedPosSale,
  fetchCurrentPosDiscountLimit,
  fetchPosCashRegisters,
  fetchPosQuotes,
  fetchPosSales,
  fetchProductCategories,
  fetchProductPurchases,
  fetchProducts,
  fetchProductStocktakeDraft,
  fetchProductStocktakes,
  fetchPurchaseOrders,
  fetchSuppliers,
  fetchSuspendedPosSales,
  openPosCashRegister,
  receivePurchaseOrder,
  returnPosSale,
  saveProductStocktakeDraft,
  setPurchaseOrderStatus,
  suspendPosSale,
  updatePosQuote,
  updateProduct,
} from "@/services/pos";
import { fetchPurchaseDocuments } from "@/services/purchase-recognition";
import { fetchTutors } from "@/services/tutors";
import type {
  NewProductCategoryInput,
  NewProductInput,
  NewSupplierInput,
  PosCashRegister,
  PosQuote,
  PosSale,
  Product,
  ProductCategory,
  ProductPurchase,
  ProductStocktake,
  ProductStocktakeDraft,
  PurchaseOrder,
  Supplier,
  SuspendedPosSale,
  Tutor,
} from "@/types/domain";
import type { PurchaseDocumentArchive } from "@/types/purchase-recognition";

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [quotes, setQuotes] = useState<PosQuote[]>([]);
  const [sales, setSales] = useState<PosSale[]>([]);
  const [suspendedSales, setSuspendedSales] = useState<SuspendedPosSale[]>([]);
  const [cashRegisters, setCashRegisters] = useState<PosCashRegister[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
  const [purchaseDocuments, setPurchaseDocuments] = useState<
    PurchaseDocumentArchive[]
  >([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
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
  const [discount, setDiscount] = useState("");
  const [surcharge, setSurcharge] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [discountLimitPercent, setDiscountLimitPercent] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeMethod, setChangeMethod] = useState<"Dinheiro" | "PIX">(
    "Dinheiro",
  );
  const [splitPayments, setSplitPayments] = useState(false);
  const [payments, setPayments] = useState<PaymentSplit[]>([
    { id: "payment-1", method: "PIX", amount: "" },
  ]);
  const [expirationDate, setExpirationDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentIntegrationEnabled, setPaymentIntegrationEnabled] =
    useState(false);
  const [nfceEnabled, setNfceEnabled] = useState(false);
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
  const discountAmount = Math.max(0, Number(discount || 0));
  const surchargeAmount = Math.max(0, Number(surcharge || 0));
  const saleTotal = Math.max(0, cartTotal - discountAmount + surchargeAmount);
  const maxDiscountAmount = (cartTotal * discountLimitPercent) / 100;
  const discountIsInvalid =
    discountAmount > maxDiscountAmount || saleTotal <= 0;
  const paymentDifference = Number((saleTotal - paymentTotal).toFixed(2));
  const splitCashTotal = payments
    .filter((payment) => payment.method === "Dinheiro")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const saleChangeDue = splitPayments
    ? Math.max(0, -paymentDifference)
    : paymentMethod === "Dinheiro"
      ? Math.max(0, Number(paymentAmount || 0) - saleTotal)
      : 0;
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
      suspendedSalesResponse,
      cashRegistersResponse,
      tutorsResponse,
      suppliersResponse,
      purchasesResponse,
      purchaseDocumentsResponse,
      purchaseOrdersResponse,
      stocktakesResponse,
      stocktakeDraftResponse,
      discountLimitResponse,
    ] = await Promise.all([
      fetchProducts(),
      fetchProductCategories(),
      fetchPosQuotes(),
      fetchPosSales(),
      fetchSuspendedPosSales(),
      fetchPosCashRegisters(),
      fetchTutors(),
      fetchSuppliers(),
      fetchProductPurchases(),
      fetchPurchaseDocuments("pdv"),
      fetchPurchaseOrders(),
      fetchProductStocktakes(),
      fetchProductStocktakeDraft(),
      fetchCurrentPosDiscountLimit(),
    ]);

    const error =
      productsResponse.error ||
      categoriesResponse.error ||
      quotesResponse.error ||
      salesResponse.error ||
      suspendedSalesResponse.error ||
      cashRegistersResponse.error ||
      tutorsResponse.error ||
      suppliersResponse.error ||
      purchasesResponse.error ||
      purchaseDocumentsResponse.error ||
      purchaseOrdersResponse.error ||
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
    setSuspendedSales(
      (suspendedSalesResponse.data || []) as SuspendedPosSale[],
    );
    setCashRegisters((cashRegistersResponse.data || []) as PosCashRegister[]);
    setTutors(tutorsResponse.data || []);
    setSuppliers(suppliersResponse.data || []);
    setPurchases((purchasesResponse.data || []) as ProductPurchase[]);
    setPurchaseDocuments(purchaseDocumentsResponse.data || []);
    setPurchaseOrders((purchaseOrdersResponse.data || []) as PurchaseOrder[]);
    setStocktakes((stocktakesResponse.data || []) as ProductStocktake[]);
    setStocktakeDraft(
      (stocktakeDraftResponse.data as ProductStocktakeDraft | null) || null,
    );
    setDiscountLimitPercent(discountLimitResponse.data ?? 10);
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
    void fetchPaymentIntegrationStatus()
      .then((status) => {
        setPaymentIntegrationEnabled(status.enabled);
        setNfceEnabled(status.nfceEnabled);
      })
      .catch(() => {
        setPaymentIntegrationEnabled(false);
        setNfceEnabled(false);
      });
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

  function handleSplitPayments(enabled: boolean) {
    setSplitPayments(enabled);

    if (enabled) {
      setPayments([
        {
          id: `payment-${Date.now()}-1`,
          method: paymentMethod,
          amount: saleTotal > 0 ? saleTotal.toFixed(2) : "",
        },
        {
          id: `payment-${Date.now()}-2`,
          method: paymentMethod === "PIX" ? "Dinheiro" : "PIX",
          amount: "",
        },
      ]);
      return;
    }

    setPayments([{ id: "payment-1", method: paymentMethod, amount: "" }]);
  }

  function handlePaymentAmountBlur() {
    const firstAmount = Number(paymentAmount || 0);

    if (
      splitPayments ||
      !Number.isFinite(firstAmount) ||
      firstAmount <= 0 ||
      firstAmount >= saleTotal
    ) {
      return;
    }

    const remaining = saleTotal - firstAmount;
    setSplitPayments(true);
    setPayments([
      {
        id: `payment-${Date.now()}-1`,
        method: paymentMethod,
        amount: firstAmount.toFixed(2),
      },
      {
        id: `payment-${Date.now()}-2`,
        method: paymentMethod === "PIX" ? "Dinheiro" : "PIX",
        amount: remaining.toFixed(2),
      },
    ]);
    toast.success("Segunda forma aberta com o valor restante");
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

    if (discountIsInvalid) {
      toast.error(
        `Seu limite de desconto é ${discountLimitPercent}% (${formatCurrency(maxDiscountAmount)})`,
      );
      return;
    }

    if (
      (discountAmount > 0 || surchargeAmount > 0) &&
      !adjustmentReason.trim()
    ) {
      toast.error("Informe o motivo do desconto ou acréscimo");
      return;
    }

    const customer = getCustomer();
    const saleItems = cart.map((item) => ({
      product_id: item.product.id,
      quantidade: item.quantity,
    }));
    const paymentRecordIds: string[] = [];
    let createdSaleId: number | null = null;

    async function authorizeSmartPosPayments(
      entries: Array<{ method: string; amount: number }>,
    ) {
      if (!paymentIntegrationEnabled) return true;
      for (const entry of entries) {
        const paymentType = integratedPaymentType(entry.method);
        if (!paymentType) continue;
        let response;
        try {
          response = await processCheckoutPayment({
            amount: entry.amount,
            paymentType,
            externalReference: `PDV-${Date.now()}-${cart.length}`,
          });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Falha no SmartPOS.",
          );
          return false;
        }
        if (!response.result || response.result.status !== "approved") {
          toast.error(
            `Pagamento ${response.result?.status || "não processado"}. A venda não foi gravada.`,
          );
          return false;
        }
        if (response.recordId) paymentRecordIds.push(response.recordId);
        toast.success(
          `SmartPOS aprovado · autorização ${response.result.authorizationCode || "MOCK"}`,
        );
      }
      return true;
    }

    if (splitPayments) {
      let normalizedPayments = payments
        .map((payment) => ({
          payment_method: payment.method,
          amount: Number(payment.amount || 0),
        }))
        .filter((payment) => payment.amount > 0);

      if (normalizedPayments.length === 0) {
        toast.error("Informe ao menos um pagamento");
        return;
      }

      if (paymentDifference >= 0.01) {
        toast.error("A soma dos pagamentos precisa fechar o total da venda");
        return;
      }

      if (paymentDifference <= -0.01) {
        let remainingChange = Math.abs(paymentDifference);

        if (splitCashTotal + 0.009 < remainingChange) {
          toast.error("O valor excedente só pode ser recebido em dinheiro");
          return;
        }

        normalizedPayments = normalizedPayments
          .map((payment) => {
            if (payment.payment_method !== "Dinheiro" || remainingChange <= 0) {
              return payment;
            }

            const deduction = Math.min(payment.amount, remainingChange);
            remainingChange = Number((remainingChange - deduction).toFixed(2));
            return {
              ...payment,
              amount: Number((payment.amount - deduction).toFixed(2)),
            };
          })
          .filter((payment) => payment.amount > 0);
      }

      const cashReceived = payments
        .filter((payment) => payment.method === "Dinheiro")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      setProcessing(true);
      const smartPosApproved = await authorizeSmartPosPayments(
        normalizedPayments.map((payment) => ({
          method: payment.payment_method,
          amount: payment.amount,
        })),
      );
      if (!smartPosApproved) {
        setProcessing(false);
        return;
      }
      const { data, error } =
        saleChangeDue > 0
          ? await createPosSaleWithChange({
              ...customer,
              payments: normalizedPayments,
              items: saleItems,
              discount: discountAmount,
              surcharge: surchargeAmount,
              adjustmentReason,
              cashReceived,
              changeAmount: saleChangeDue,
              changeMethod,
            })
          : await createPosSaleWithPayments({
              ...customer,
              payments: normalizedPayments,
              items: saleItems,
              discount: discountAmount,
              surcharge: surchargeAmount,
              adjustmentReason,
            });
      setProcessing(false);

      if (error) {
        toast.error(error.message);
        return;
      }
      createdSaleId = Number(data) || null;
    } else {
      setProcessing(true);
      const smartPosApproved = await authorizeSmartPosPayments([
        { method: paymentMethod, amount: saleTotal },
      ]);
      if (!smartPosApproved) {
        setProcessing(false);
        return;
      }
      const { data, error } =
        saleChangeDue > 0
          ? await createPosSaleWithChange({
              ...customer,
              payments: [{ payment_method: "Dinheiro", amount: saleTotal }],
              items: saleItems,
              discount: discountAmount,
              surcharge: surchargeAmount,
              adjustmentReason,
              cashReceived: Number(paymentAmount),
              changeAmount: saleChangeDue,
              changeMethod,
            })
          : await createPosSale({
              ...customer,
              paymentMethod,
              items: saleItems,
              discount: discountAmount,
              surcharge: surchargeAmount,
              adjustmentReason,
            });
      setProcessing(false);

      if (error) {
        toast.error(error.message);
        return;
      }
      createdSaleId = Number(data) || null;
    }

    if (createdSaleId && paymentRecordIds.length) {
      try {
        await linkCheckoutPayments(createdSaleId, paymentRecordIds);
      } catch {
        toast.warning(
          "Venda concluída, mas o vínculo técnico do pagamento precisa de revisão.",
        );
      }
    }

    if (createdSaleId && nfceEnabled) {
      try {
        const fiscalResult = await issueNfceForSale(createdSaleId);
        toast.success(
          `NFC-e MOCK ${fiscalResult.cStat} · ${fiscalResult.message}`,
        );
      } catch (error) {
        toast.warning(
          error instanceof Error
            ? `Venda concluída; NFC-e não emitida: ${error.message}`
            : "Venda concluída; NFC-e não emitida.",
        );
      }
    }

    toast.success(
      saleChangeDue > 0
        ? `Venda finalizada! Troco: ${formatCurrency(saleChangeDue)}`
        : "Venda finalizada e estoque atualizado!",
    );
    clearSale();
    await loadData();
  }

  function clearSale() {
    setCart([]);
    setTutorId("");
    setCustomerName("");
    setExpirationDate("");
    setPaymentMethod("PIX");
    setPaymentAmount("");
    setChangeMethod("Dinheiro");
    setSplitPayments(false);
    setPayments([{ id: "payment-1", method: "PIX", amount: "" }]);
    setDiscount("");
    setSurcharge("");
    setAdjustmentReason("");
  }

  async function handleSuspendSale(notes: string) {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      throw new Error("empty cart");
    }
    const customer = getCustomer();
    setProcessing(true);
    const { error } = await suspendPosSale({
      ...customer,
      notes,
      items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    });
    setProcessing(false);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    clearSale();
    toast.success("Venda suspensa. O PDV está livre para outro atendimento!");
    await loadData();
  }

  async function handleRecoverSuspendedSale(sale: SuspendedPosSale) {
    if (cart.length > 0) {
      toast.error(
        "Suspenda ou limpe o carrinho atual antes de recuperar outro",
      );
      return;
    }
    const recovered = (sale.suspended_pos_sale_items || []).flatMap((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.product_id && candidate.ativo,
      );
      if (!product || product.estoque <= 0) return [];
      return [{ product, quantity: Math.min(item.quantity, product.estoque) }];
    });
    if (recovered.length === 0) {
      toast.error("Os produtos desta venda estão sem estoque");
      return;
    }
    const { error } = await deleteSuspendedPosSale(sale.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCart(recovered);
    setTutorId(sale.tutor_id ? String(sale.tutor_id) : "");
    setCustomerName(sale.tutor_id ? "" : sale.customer_name);
    setView("sale");
    setSuspendedSales((current) =>
      current.filter((item) => item.id !== sale.id),
    );
    if (
      recovered.some(
        (item) =>
          (sale.suspended_pos_sale_items || []).find(
            (saved) => saved.product_id === item.product.id,
          )?.quantity !== item.quantity,
      )
    )
      toast.warning(
        "Algumas quantidades foram ajustadas ao estoque disponível",
      );
    toast.success("Venda recuperada no carrinho!");
  }

  async function handleDeleteSuspendedSale(sale: SuspendedPosSale) {
    if (
      !window.confirm(
        `Excluir a venda suspensa de ${sale.tutors?.nome || sale.customer_name}?`,
      )
    )
      return;
    const { error } = await deleteSuspendedPosSale(sale.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSuspendedSales((current) =>
      current.filter((item) => item.id !== sale.id),
    );
    toast.success("Venda suspensa excluída");
  }

  async function handleProductSave(
    productsToSave: Array<NewProductInput | Product>,
  ) {
    const productsToUpdate = productsToSave.filter(
      (productToSave): productToSave is Product => "id" in productToSave,
    );
    const productsToCreate = productsToSave.filter(
      (productToSave): productToSave is NewProductInput =>
        !("id" in productToSave),
    );

    for (const productToUpdate of productsToUpdate) {
      const response = await updateProduct(productToUpdate);

      if (response.error) {
        toast.error(response.error.message);
        throw response.error;
      }
    }

    const response =
      productsToCreate.length > 0
        ? await createProducts(productsToCreate)
        : { error: null };

    if (response.error) {
      toast.error(response.error.message);
      throw response.error;
    }

    const createdCount = productsToCreate.length;
    const updatedCount = productsToUpdate.length;

    toast.success(
      updatedCount > 0 && createdCount > 0
        ? `Produto salvo e ${createdCount} ${createdCount === 1 ? "variação adicionada" : "variações adicionadas"}!`
        : productsToSave.length === 1
          ? "Produto salvo com sucesso!"
          : `${productsToSave.length} variações salvas com sucesso!`,
    );
    await loadData();
  }

  async function handleProductDelete(product: Product) {
    const { error } = product.ativo
      ? await archiveProduct(product.id)
      : await deleteInactiveProduct(product.id);

    if (error) {
      toast.error(
        error.code === "23503"
          ? "Este produto possui movimentações vinculadas e não pode ser apagado definitivamente. Mantenha-o inativo para preservar o histórico."
          : error.message,
      );
      throw error;
    }

    toast.success(
      product.ativo
        ? "Produto movido para inativos"
        : "Produto inativo excluído definitivamente",
    );
    setCart((current) =>
      current.filter((item) => item.product.id !== product.id),
    );
    await loadData();
  }

  async function handleProductsBulkDelete(productIds: number[]) {
    const selectedProducts = products.filter((product) =>
      productIds.includes(product.id),
    );
    const activeIds = selectedProducts
      .filter((product) => product.ativo)
      .map((product) => product.id);
    const inactiveIds = selectedProducts
      .filter((product) => !product.ativo)
      .map((product) => product.id);
    const archiveResult = activeIds.length
      ? await archiveProducts(activeIds)
      : { data: [], error: null };
    if (archiveResult.error) {
      toast.error(archiveResult.error.message);
      throw archiveResult.error;
    }
    const deleteResult = inactiveIds.length
      ? await deleteInactiveProducts(inactiveIds)
      : { data: [], error: null };
    if (deleteResult.error) {
      toast.error(
        deleteResult.error.code === "23503"
          ? "Um ou mais produtos possuem movimentações vinculadas. Eles foram mantidos inativos para preservar o histórico."
          : deleteResult.error.message,
      );
      throw deleteResult.error;
    }

    const changedIds = new Set([
      ...(archiveResult.data || []).map((product) => product.id),
      ...(deleteResult.data || []).map((product) => product.id),
    ]);
    setCart((current) =>
      current.filter((item) => !changedIds.has(item.product.id)),
    );
    toast.success(
      `${changedIds.size} produto${changedIds.size === 1 ? " processado" : "s processados"} com sucesso`,
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
    const { data, error } = await createProductPurchase(purchase);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Compra registrada e estoque atualizado!");
    await loadData();
    return Number(data);
  }

  async function handlePurchaseDelete(purchaseId: number) {
    const { error } = await deleteProductPurchase(purchaseId);

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Importação excluída e estoque/financeiro revertidos!");
    await loadData();
  }

  async function handlePurchaseOrderCreate(input: NewPurchaseOrderInput) {
    const { error } = await createPurchaseOrder(input);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Pedido de compra criado sem alterar o estoque!");
    await loadData();
  }

  async function handlePurchaseOrderStatus(
    id: number,
    status: "Enviado" | "Cancelado",
  ) {
    const { error } = await setPurchaseOrderStatus(id, status);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success(
      status === "Enviado"
        ? "Pedido marcado como enviado!"
        : "Pedido cancelado!",
    );
    await loadData();
  }

  async function handlePurchaseOrderReceive(
    id: number,
    receipts: Array<{ item_id: number; quantidade: number }>,
  ) {
    const { error } = await receivePurchaseOrder(id, receipts);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Recebimento registrado e estoque atualizado!");
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
        <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:p-8">
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
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
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
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                <SupplierModal onSave={handleSupplierSave} />
                <PurchaseModal
                  products={products}
                  purchases={purchases}
                  suppliers={suppliers}
                  categories={categories}
                  onProductSave={handleProductSave}
                  onSave={handlePurchaseSave}
                  onDocumentArchived={loadData}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
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

          <div className="sticky top-[73px] z-20 -mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto border-y border-slate-200/70 bg-white/90 p-2 shadow-sm backdrop-blur-xl sm:static sm:mx-0 sm:w-fit sm:rounded-xl sm:border sm:p-1">
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
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold sm:px-4 ${
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
              discount={discount}
              surcharge={surcharge}
              adjustmentReason={adjustmentReason}
              discountLimitPercent={discountLimitPercent}
              maxDiscountAmount={maxDiscountAmount}
              discountIsInvalid={discountIsInvalid}
              paymentMethod={paymentMethod}
              paymentAmount={paymentAmount}
              changeMethod={changeMethod}
              splitPayments={splitPayments}
              payments={payments}
              paymentTotal={paymentTotal}
              paymentDifference={paymentDifference}
              expirationDate={expirationDate}
              tutors={tutors}
              suspendedSales={suspendedSales}
              subtotal={cartTotal}
              total={saleTotal}
              processing={processing}
              onSearch={setSearch}
              onBarcodeScan={handleBarcodeScan}
              onAdd={addToCart}
              onQuantity={updateQuantity}
              onTutor={setTutorId}
              onCustomerName={setCustomerName}
              onDiscount={setDiscount}
              onSurcharge={setSurcharge}
              onAdjustmentReason={setAdjustmentReason}
              onPaymentMethod={setPaymentMethod}
              onPaymentAmount={setPaymentAmount}
              onPaymentAmountBlur={handlePaymentAmountBlur}
              onChangeMethod={setChangeMethod}
              onSplitPayments={handleSplitPayments}
              onPaymentSplit={updatePaymentSplit}
              onAddPaymentSplit={addPaymentSplit}
              onRemovePaymentSplit={removePaymentSplit}
              onExpirationDate={setExpirationDate}
              onQuote={handleQuote}
              onSale={handleSale}
              onClear={clearSale}
              onSuspend={handleSuspendSale}
              onRecoverSuspended={handleRecoverSuspendedSale}
              onDeleteSuspended={handleDeleteSuspendedSale}
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
              onBulkDelete={handleProductsBulkDelete}
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
            <PurchasesView
              purchases={purchases}
              purchaseDocuments={purchaseDocuments}
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              products={products}
              sales={sales}
              onCreateOrder={handlePurchaseOrderCreate}
              onOrderStatus={handlePurchaseOrderStatus}
              onOrderReceive={handlePurchaseOrderReceive}
              onDeletePurchase={handlePurchaseDelete}
            />
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
            <SalesView
              sales={sales}
              onCancel={handleSaleCancel}
              onReturn={async (saleId, input) => {
                const { error } = await returnPosSale({ saleId, ...input });
                if (error) {
                  toast.error(error.message);
                  return false;
                }
                toast.success(
                  input.type === "Troca"
                    ? "Troca registrada e estoque reposto."
                    : "Devolução registrada com sucesso.",
                );
                await loadData();
                return true;
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}


