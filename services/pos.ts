import { supabase } from "@/lib/supabase";
import type {
  NewProductCategoryInput,
  NewProductInput,
  NewSupplierInput,
  Product,
} from "@/types/domain";

export interface PosCartItem {
  product_id: number;
  quantidade: number;
}

export async function fetchProducts() {
  return supabase.from("products").select("*").order("nome");
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
      sku: product.sku || null,
    })),
  );
}

export async function updateProduct(product: Product) {
  return supabase
    .from("products")
    .update({
      nome: product.nome,
      sku: product.sku || null,
      categoria: product.categoria || null,
      category_id: product.category_id || null,
      tamanho: product.tamanho || null,
      cor: product.cor || null,
      sabor: product.sabor || null,
      preco_custo: product.preco_custo,
      preco_venda: product.preco_venda,
      estoque: product.estoque,
      estoque_minimo: product.estoque_minimo,
      ativo: product.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", product.id);
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
  notes,
  items,
}: {
  supplierId: number;
  documentNumber: string;
  purchaseDate: string;
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
    notes,
    items,
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
        )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(30);
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
}: {
  tutorId: number | null;
  customerName: string;
  paymentMethod: string;
  items: PosCartItem[];
}) {
  return supabase.rpc("create_pos_sale", {
    customer_tutor_id: tutorId,
    customer_name: customerName,
    payment_method: paymentMethod,
    items,
  });
}
