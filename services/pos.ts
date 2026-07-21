import { supabase } from "@/lib/supabase";
import type {
  NewProductCategoryInput,
  NewProductInput,
  NewSupplierInput,
  PosCashMovementType,
  PosCashRegister,
  Product,
  ProductStocktake,
  ProductStocktakeDraft,
  PurchaseOrder,
  SuspendedPosSale,
} from "@/types/domain";

export interface PosCartItem {
  product_id: number;
  quantidade: number;
}

export async function fetchProducts() {
  return supabase.from("products").select("*").order("nome");
}

export async function completeProductStocktake({
  items,
  notes,
}: {
  items: Array<{ product_id: number; counted_quantity: number }>;
  notes: string;
}) {
  return supabase.rpc("complete_product_stocktake", {
    items,
    notes: notes.trim() || null,
  });
}

export async function fetchProductStocktakes() {
  return supabase
    .from("product_stocktakes")
    .select(
      `
      *,
      user_profiles!product_stocktakes_created_by_fkey (nome),
      product_stocktake_items (*)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ProductStocktake[]>();
}

export async function fetchProductStocktakeDraft() {
  return supabase
    .from("product_stocktake_drafts")
    .select("*")
    .maybeSingle<ProductStocktakeDraft>();
}

export async function saveProductStocktakeDraft({
  items,
  notes,
}: {
  items: Array<{ product_id: number; counted_quantity: number | null }>;
  notes: string;
}) {
  return supabase.rpc("save_product_stocktake_draft", {
    draft_items: items,
    draft_notes: notes.trim() || null,
  });
}

export async function deleteProductStocktakeDraft() {
  return supabase.rpc("delete_product_stocktake_draft");
}

export async function fetchProductCategories() {
  return supabase
    .from("product_categories")
    .select("*")
    .eq("ativo", true)
    .order("nome");
}

export async function createProductCategory(category: NewProductCategoryInput) {
  return supabase.from("product_categories").insert([category]);
}

export async function createProducts(products: NewProductInput[]) {
  return supabase.from("products").insert(
    products.map((product) => ({
      ...product,
      sku: product.sku || product.barcode || null,
      barcode: product.barcode || product.sku || null,
      profit_margin: product.profit_margin ?? 0,
    })),
  );
}

export async function updateProduct(product: Product) {
  return supabase
    .from("products")
    .update({
      nome: product.nome,
      sku: product.sku || product.barcode || null,
      barcode: product.barcode || product.sku || null,
      profit_margin: product.profit_margin ?? 0,
      categoria: product.categoria || null,
      category_id: product.category_id || null,
      tamanho: product.tamanho || null,
      cor: product.cor || null,
      sabor: product.sabor || null,
      preco_custo: product.preco_custo,
      preco_venda: product.preco_venda,
      estoque: product.estoque,
      estoque_minimo: product.estoque_minimo,
      image_url: product.image_url || null,
      ncm: product.ncm || null,
      cfop: product.cfop || null,
      origem_mercadoria: product.origem_mercadoria || null,
      csosn: product.csosn || null,
      unidade_comercial: product.unidade_comercial || null,
      purchase_unit: product.purchase_unit || "UN",
      sale_unit: product.sale_unit || product.unidade_comercial || "UN",
      units_per_purchase: Math.max(1, Number(product.units_per_purchase || 1)),
      ativo: product.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id);
}

export async function archiveProduct(id: number) {
  return supabase
    .from("products")
    .update({
      ativo: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function fetchSuppliers() {
  return supabase.from("suppliers").select("*").order("nome");
}

export async function createSupplier(supplier: NewSupplierInput) {
  return supabase.from("suppliers").insert([supplier]);
}

export async function fetchProductPurchases() {
  return supabase
    .from("product_purchases")
    .select(
      `
        *,
        suppliers (
          nome
        ),
        product_purchase_items (
          product_id,
          quantidade,
          custo_unitario
        )
      `,
    )
    .order("data_compra", { ascending: false })
    .limit(50);
}

export async function createProductPurchase({
  supplierId,
  documentNumber,
  purchaseDate,
  dueDate,
  paymentMethod,
  notes,
  items,
}: {
  supplierId: number;
  documentNumber: string;
  purchaseDate: string;
  dueDate: string;
  paymentMethod: string;
  notes: string;
  items: Array<{
    product_id: number;
    quantidade: number;
    custo_unitario: number;
  }>;
}) {
  return supabase.rpc("create_product_purchase", {
    selected_supplier_id: supplierId,
    document_number: documentNumber,
    purchase_date: purchaseDate,
    due_date: dueDate,
    payment_method: paymentMethod,
    notes,
    items,
  });
}

export async function fetchPurchaseOrders() {
  return supabase
    .from("purchase_orders")
    .select(
      `
    *, suppliers(nome,documento,telefone,email,contato),
    purchase_order_items(*, products(id,nome,sku,tamanho,cor,sabor,purchase_unit,sale_unit,units_per_purchase))
  `,
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<PurchaseOrder[]>();
}

export function createPurchaseOrder(input: {
  supplierId: number;
  expectedDate: string | null;
  notes: string;
  items: Array<{
    product_id: number;
    quantidade: number;
    custo_unitario: number;
  }>;
}) {
  return supabase.rpc("create_purchase_order", {
    selected_supplier_id: input.supplierId,
    selected_expected_date: input.expectedDate,
    selected_notes: input.notes,
    items: input.items,
  });
}

export function setPurchaseOrderStatus(
  orderId: number,
  status: "Enviado" | "Cancelado",
) {
  return supabase.rpc("set_purchase_order_status", {
    selected_order_id: orderId,
    selected_status: status,
  });
}

export function receivePurchaseOrder(
  orderId: number,
  receipts: Array<{ item_id: number; quantidade: number }>,
) {
  return supabase.rpc("receive_purchase_order", {
    selected_order_id: orderId,
    receipts,
  });
}

export async function fetchPosQuotes() {
  return supabase
    .from("pos_quotes")
    .select(
      `
        *,
        tutors (
          nome
        ),
        pos_quote_items (
          id,
          product_id,
          descricao,
          quantidade,
          valor_unitario,
          subtotal
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(30);
}

export async function deletePosQuote(quoteId: number) {
  return supabase.from("pos_quotes").delete().eq("id", quoteId);
}

export async function updatePosQuote({
  quoteId,
  tutorId,
  customerName,
  expirationDate,
  items,
}: {
  quoteId: number;
  tutorId: number | null;
  customerName: string;
  expirationDate: string | null;
  items: Array<{
    product_id: number;
    quantidade: number;
    valor_unitario: number;
  }>;
}) {
  return supabase.rpc("update_pos_quote", {
    selected_quote_id: quoteId,
    customer_tutor_id: tutorId,
    customer_name: customerName,
    expiration_date: expirationDate,
    items,
  });
}

export async function fetchPosSales() {
  return supabase
    .from("pos_sales")
    .select(
      `
        *,
        tutors (
          nome
        ),
        pos_sale_items (
          id,
          product_id,
          descricao,
          quantidade,
          valor_unitario,
          subtotal
        ),
        pos_sale_payments (
          id,
          sale_id,
          payment_method,
          amount,
          created_at
        ),
        pos_sale_returns (
          id,
          sale_id,
          return_type,
          amount,
          reason,
          created_at,
          pos_sale_return_items (*)
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(500);
}

export function returnPosSale(input: {
  saleId: number;
  type: "Devolução" | "Troca";
  reason: string;
  items: Array<{ sale_item_id: number; quantity: number }>;
}) {
  return supabase.rpc("return_pos_sale", {
    selected_sale_id: input.saleId,
    selected_type: input.type,
    selected_reason: input.reason,
    items: input.items,
  });
}

export async function fetchSuspendedPosSales() {
  return supabase
    .from("suspended_pos_sales")
    .select(
      `
    *, tutors(nome),
    suspended_pos_sale_items(*, products(id,nome,sku,tamanho,cor,sabor))
  `,
    )
    .order("created_at", { ascending: false })
    .returns<SuspendedPosSale[]>();
}

export function suspendPosSale(input: {
  tutorId: number | null;
  customerName: string;
  notes: string;
  items: Array<{ product_id: number; quantity: number }>;
}) {
  return supabase.rpc("suspend_pos_sale", {
    selected_tutor_id: input.tutorId,
    selected_customer_name: input.customerName,
    selected_notes: input.notes,
    items: input.items,
  });
}

export function deleteSuspendedPosSale(id: number) {
  return supabase.rpc("delete_suspended_pos_sale", { selected_sale_id: id });
}

export async function fetchPosCashRegisters() {
  return supabase
    .from("pos_cash_registers")
    .select(
      `
        *,
        user_profiles!pos_cash_registers_opened_by_fkey (
          nome
        ),
        pos_cash_movements (
          id,
          cash_register_id,
          movement_type,
          amount,
          sale_id,
          notes,
          created_by,
          created_at,
          pos_sales (
            forma_pagamento,
            pos_sale_payments (
              payment_method,
              amount
            )
          )
        )
      `,
    )
    .order("opened_at", { ascending: false })
    .limit(200)
    .returns<PosCashRegister[]>();
}

export async function openPosCashRegister({
  openingAmount,
  notes,
}: {
  openingAmount: number;
  notes: string;
}) {
  return supabase.rpc("open_pos_cash_register", {
    opening_amount: openingAmount,
    notes,
  });
}

export async function addPosCashMovement({
  cashRegisterId,
  movementType,
  amount,
  notes,
}: {
  cashRegisterId: number;
  movementType: Extract<PosCashMovementType, "suprimento" | "sangria">;
  amount: number;
  notes: string;
}) {
  return supabase.rpc("add_pos_cash_movement", {
    selected_register_id: cashRegisterId,
    selected_movement_type: movementType,
    selected_amount: amount,
    notes,
  });
}

export async function closePosCashRegister({
  cashRegisterId,
  closingAmount,
  notes,
}: {
  cashRegisterId: number;
  closingAmount: number;
  notes: string;
}) {
  return supabase.rpc("close_pos_cash_register", {
    selected_register_id: cashRegisterId,
    selected_closing_amount: closingAmount,
    selected_notes: notes,
  });
}

export async function convertPosQuote(quoteId: number, paymentMethod: string) {
  return supabase.rpc("convert_pos_quote", {
    selected_quote_id: quoteId,
    payment_method: paymentMethod,
  });
}

export async function convertPosQuoteWithPayments(
  quoteId: number,
  payments: Array<{ payment_method: string; amount: number }>,
) {
  return supabase.rpc("convert_pos_quote_with_payments", {
    selected_quote_id: quoteId,
    payments,
  });
}

export async function cancelPosSale(saleId: number) {
  return supabase.rpc("cancel_pos_sale", {
    selected_sale_id: saleId,
  });
}

export async function createPosQuote({
  tutorId,
  customerName,
  expirationDate,
  items,
}: {
  tutorId: number | null;
  customerName: string;
  expirationDate: string | null;
  items: PosCartItem[];
}) {
  return supabase.rpc("create_pos_quote", {
    customer_tutor_id: tutorId,
    customer_name: customerName,
    expiration_date: expirationDate,
    items,
  });
}

export async function createPosSale({
  tutorId,
  customerName,
  paymentMethod,
  items,
  discount,
  surcharge,
  adjustmentReason,
}: {
  tutorId: number | null;
  customerName: string;
  paymentMethod: string;
  items: PosCartItem[];
  discount: number;
  surcharge: number;
  adjustmentReason: string;
}) {
  return supabase.rpc("create_pos_sale_adjusted", {
    customer_tutor_id: tutorId,
    customer_name: customerName,
    payment_method: paymentMethod,
    items,
    selected_discount: discount,
    selected_surcharge: surcharge,
    selected_reason: adjustmentReason,
  });
}

export async function createPosSaleWithPayments({
  tutorId,
  customerName,
  payments,
  items,
  discount,
  surcharge,
  adjustmentReason,
}: {
  tutorId: number | null;
  customerName: string;
  payments: Array<{ payment_method: string; amount: number }>;
  items: PosCartItem[];
  discount: number;
  surcharge: number;
  adjustmentReason: string;
}) {
  return supabase.rpc("create_pos_sale_with_payments_adjusted", {
    customer_tutor_id: tutorId,
    customer_name: customerName,
    payments,
    items,
    selected_discount: discount,
    selected_surcharge: surcharge,
    selected_reason: adjustmentReason,
  });
}

export async function fetchCurrentPosDiscountLimit() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    return {
      data: null,
      error: userError || new Error("Usuário não autenticado"),
    };
  const response = await supabase
    .from("user_profiles")
    .select("is_admin,max_discount_percent")
    .eq("id", userData.user.id)
    .single();
  return {
    data: response.data
      ? response.data.is_admin
        ? 100
        : Number(response.data.max_discount_percent)
      : null,
    error: response.error,
  };
}
