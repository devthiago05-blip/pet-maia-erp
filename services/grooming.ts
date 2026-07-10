import { supabase } from "@/lib/supabase";
import type {
  GroomerDailyPaymentInput,
  GroomingSupplyInput,
  GroomingSupplyMovementInput,
} from "@/types/domain";

const groomingSupplyMovementSelect = `
  *,
  grooming_supplies (
    name,
    unit,
    category
  )
`;

export async function fetchGroomingSupplies() {
  return supabase
    .from("grooming_supplies")
    .select("*")
    .order("active", { ascending: false })
    .order("name", { ascending: true });
}

export async function fetchActiveGroomingSupplies() {
  return supabase
    .from("grooming_supplies")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });
}

export async function createGroomingSupply(input: GroomingSupplyInput) {
  return supabase.from("grooming_supplies").insert([
    {
      name: input.name.trim(),
      category: input.category.trim() || "Geral",
      unit: input.unit.trim() || "unidade",
      minimum_stock: input.minimumStock,
      supplier: input.supplier?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
    },
  ]);
}

export async function updateGroomingSupply(input: GroomingSupplyInput) {
  if (!input.id) {
    return {
      data: null,
      error: new Error("ID do insumo não informado"),
    };
  }

  return supabase
    .from("grooming_supplies")
    .update({
      name: input.name.trim(),
      category: input.category.trim() || "Geral",
      unit: input.unit.trim() || "unidade",
      minimum_stock: input.minimumStock,
      supplier: input.supplier?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
}

export async function archiveGroomingSupply(id: number) {
  return supabase
    .from("grooming_supplies")
    .update({
      active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function fetchGroomingSupplyMovements() {
  return supabase
    .from("grooming_supply_movements")
    .select(groomingSupplyMovementSelect)
    .order("movement_date", { ascending: false })
    .order("id", { ascending: false });
}

export async function fetchGroomingSupplyAlerts() {
  const today = new Date();
  const thirtyDaysFromNow = new Date();

  today.setHours(0, 0, 0, 0);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  thirtyDaysFromNow.setHours(23, 59, 59, 999);

  const todayString = today.toISOString().slice(0, 10);
  const thirtyDaysString = thirtyDaysFromNow.toISOString().slice(0, 10);

  const [
    suppliesResponse,
    expirationResponse,
    payableResponse,
    groomerPaymentsResponse,
  ] = await Promise.all([
    supabase
      .from("grooming_supplies")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("grooming_supply_movements")
      .select(groomingSupplyMovementSelect)
      .not("expiration_date", "is", null)
      .lte("expiration_date", thirtyDaysString)
      .order("expiration_date", { ascending: true }),
    supabase
      .from("grooming_supply_movements")
      .select(groomingSupplyMovementSelect)
      .eq("payment_status", "Pendente")
      .not("due_date", "is", null)
      .lte("due_date", thirtyDaysString)
      .order("due_date", { ascending: true }),
    supabase
      .from("groomer_daily_payments")
      .select("*")
      .eq("payment_status", "Pendente")
      .not("due_date", "is", null)
      .lte("due_date", thirtyDaysString)
      .order("due_date", { ascending: true }),
  ]);

  if (suppliesResponse.error) {
    return suppliesResponse;
  }

  if (expirationResponse.error) {
    return expirationResponse;
  }

  if (payableResponse.error) {
    return payableResponse;
  }

  if (groomerPaymentsResponse.error) {
    return groomerPaymentsResponse;
  }

  const lowStockSupplies =
    suppliesResponse.data?.filter(
      (supply) => Number(supply.current_stock) <= Number(supply.minimum_stock),
    ) || [];

  return {
    data: {
      today: todayString,
      thirtyDaysFromNow: thirtyDaysString,
      lowStockSupplies,
      expiringMovements: expirationResponse.data || [],
      pendingPayables: payableResponse.data || [],
      pendingGroomerPayments: groomerPaymentsResponse.data || [],
    },
    error: null,
  };
}

export async function createGroomingSupplyMovement(
  input: GroomingSupplyMovementInput,
) {
  const movementResponse = await supabase
    .from("grooming_supply_movements")
    .insert([
      {
        supply_id: input.supplyId,
        movement_type: input.movementType,
        quantity: input.quantity,
        unit_cost: input.unitCost,
        supplier: input.supplier?.trim() || null,
        movement_date: input.movementDate,
        expiration_date: input.expirationDate || null,
        payment_status: input.paymentStatus,
        payment_method: input.paymentMethod || null,
        due_date: input.dueDate || null,
        notes: input.notes?.trim() || null,
      },
    ])
    .select("id, total_cost")
    .single();

  if (movementResponse.error || !movementResponse.data) {
    return movementResponse;
  }

  if (
    input.movementType === "entrada" &&
    input.paymentStatus === "Pendente" &&
    Number(movementResponse.data.total_cost || 0) > 0
  ) {
    const financialResponse = await supabase
      .from("financial_entries")
      .insert([
        {
          descricao: `Compra de insumo banho e tosa`,
          valor: Number(movementResponse.data.total_cost || 0),
          tipo: "Despesa",
          forma_pagamento: input.paymentMethod || "Não informado",
          status_pagamento: "Pendente",
          data_vencimento: input.dueDate || null,
          origem: "grooming_supply",
          referencia_id: movementResponse.data.id,
        },
      ])
      .select("id")
      .single();

    if (financialResponse.error || !financialResponse.data) {
      return financialResponse;
    }

    await supabase
      .from("grooming_supply_movements")
      .update({
        financial_entry_id: financialResponse.data.id,
      })
      .eq("id", movementResponse.data.id);
  }

  return movementResponse;
}

export async function fetchGroomerDailyPayments() {
  return supabase
    .from("groomer_daily_payments")
    .select("*")
    .order("work_date", { ascending: false })
    .order("id", { ascending: false });
}

export async function createGroomerDailyPayment(
  input: GroomerDailyPaymentInput,
) {
  const paymentResponse = await supabase
    .from("groomer_daily_payments")
    .insert([
      {
        professional_name: input.professionalName.trim(),
        work_date: input.workDate,
        payment_type: input.paymentType,
        amount: input.amount,
        payment_status: input.paymentStatus,
        payment_method: input.paymentMethod || null,
        due_date: input.dueDate || null,
        notes: input.notes?.trim() || null,
      },
    ])
    .select("id")
    .single();

  if (paymentResponse.error || !paymentResponse.data) {
    return paymentResponse;
  }

  if (input.paymentStatus === "Pendente" && input.amount > 0) {
    const financialResponse = await supabase
      .from("financial_entries")
      .insert([
        {
          descricao: `${getGroomerPaymentLabel(input.paymentType)} - ${
            input.professionalName
          }`,
          valor: input.amount,
          tipo: "Despesa",
          forma_pagamento: input.paymentMethod || "Não informado",
          status_pagamento: "Pendente",
          data_vencimento: input.dueDate || null,
          origem: "groomer_daily_payment",
          referencia_id: paymentResponse.data.id,
        },
      ])
      .select("id")
      .single();

    if (financialResponse.error || !financialResponse.data) {
      return financialResponse;
    }

    await supabase
      .from("groomer_daily_payments")
      .update({
        financial_entry_id: financialResponse.data.id,
      })
      .eq("id", paymentResponse.data.id);
  }

  return paymentResponse;
}

function getGroomerPaymentLabel(type: GroomerDailyPaymentInput["paymentType"]) {
  if (type === "comissao") {
    return "Comissão de tosador";
  }

  if (type === "extra") {
    return "Extra de tosador";
  }

  return "Diária de tosador";
}

export interface GroomingSupplyPurchaseBatchItemInput {
  supplyId: number;
  quantity: number;
  unitCost: number;
  expirationDate?: string;
  notes?: string;
}

export interface GroomingSupplyPurchaseBatchInput {
  documentNumber?: string;
  supplier?: string;
  movementDate: string;
  paymentStatus: "Pago" | "Pendente";
  paymentMethod?: string;
  dueDate?: string;
  notes?: string;
  items: GroomingSupplyPurchaseBatchItemInput[];
}

export async function createGroomingSupplyPurchaseBatch(
  batch: GroomingSupplyPurchaseBatchInput,
) {
  const validItems = batch.items.filter(
    (item) => item.supplyId > 0 && item.quantity > 0,
  );

  if (validItems.length === 0) {
    return {
      data: null,
      error: {
        message: "Adicione pelo menos um item válido na entrada.",
      },
    };
  }

  const total = validItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0,
  );

  const purchaseGroupId = crypto.randomUUID();

  const notePrefix = batch.documentNumber
    ? `Nota ${batch.documentNumber}`
    : "Entrada por nota";

  const movementRows = validItems.map((item) => {
    return {
      supply_id: item.supplyId,
      movement_type: "entrada",
      quantity: item.quantity,
      unit_cost: item.unitCost,
      supplier: batch.supplier || null,
      movement_date: batch.movementDate,
      expiration_date: item.expirationDate || null,
      payment_status: batch.paymentStatus,
      payment_method: batch.paymentMethod || null,
      due_date: batch.dueDate || null,
      document_number: batch.documentNumber || null,
      purchase_group_id: purchaseGroupId,
      notes: [notePrefix, batch.notes, item.notes].filter(Boolean).join(" - "),
    };
  });

  const movementsResponse = await supabase
    .from("grooming_supply_movements")
    .insert(movementRows)
    .select("id");

  if (movementsResponse.error) {
    return movementsResponse;
  }

  const movementIds = (movementsResponse.data || []).map((movement) =>
    Number(movement.id),
  );

  if (
    batch.paymentStatus === "Pendente" &&
    total > 0 &&
    movementIds.length > 0
  ) {
    const financialResponse = await supabase
      .from("financial_entries")
      .insert([
        {
          descricao: batch.documentNumber
            ? `Compra de insumos banho e tosa - Nota ${batch.documentNumber}`
            : "Compra de insumos banho e tosa",
          valor: total,
          tipo: "Despesa",
          forma_pagamento: batch.paymentMethod || null,
          status_pagamento: "Pendente",
          data_vencimento: batch.dueDate || null,
          origem: "grooming_supply",
          referencia_id: movementIds[0],
        },
      ])
      .select("id")
      .single();

    if (financialResponse.error) {
      return financialResponse;
    }

    await supabase
      .from("grooming_supply_movements")
      .update({
        financial_entry_id: financialResponse.data.id,
      })
      .in("id", movementIds);
  }

  return {
    data: movementsResponse.data,
    error: null,
  };
}

export async function deleteGroomingSupplyMovement(movementId: number) {
  return supabase.rpc("delete_grooming_supply_movement", {
    selected_movement_id: movementId,
  });
}
