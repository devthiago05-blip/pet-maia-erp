"use client";

import {
  AlertTriangle,
  Package,
  PlusCircle,
  Scissors,
  Trash2,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PurchaseDocumentActions } from "@/components/purchases/PurchaseDocumentActions";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  createGroomerDailyPayment,
  createGroomingEquipment,
  createGroomingEquipmentService,
  createGroomingSupply,
  createGroomingSupplyMovement,
  deleteGroomingEquipment,
  deleteGroomingSupplyMovement,
  fetchGroomerDailyPayments,
  fetchGroomingEquipment,
  fetchGroomingEquipmentServices,
  fetchGroomingSupplies,
  fetchGroomingSupplyMovements,
  updateGroomingEquipment,
} from "@/services/grooming";
import { fetchPurchaseDocuments } from "@/services/purchase-recognition";
import type {
  GroomerDailyPayment,
  GroomingEquipment,
  GroomingEquipmentService,
  GroomingEquipmentServiceType,
  GroomingEquipmentStatus,
  GroomingEquipmentType,
  GroomingPaymentStatus,
  GroomingSupply,
  GroomingSupplyMovement,
  GroomingSupplyMovementType,
} from "@/types/domain";
import type { PurchaseDocumentArchive } from "@/types/purchase-recognition";

type ActiveTab =
  | "insumos"
  | "movimentos"
  | "diarias"
  | "equipamentos"
  | "alertas";

const supplyCategories = [
  "Shampoo",
  "Condicionador",
  "Perfume",
  "Hidratante",
  "Algodão",
  "Ouvido",
  "Laço",
  "Bandana",
  "Lâmina",
  "Higiene",
  "Limpeza",
  "Geral",
];

const unitOptions = [
  "unidade",
  "mL",
  "litro",
  "g",
  "kg",
  "pacote",
  "caixa",
  "rolo",
  "frasco",
];

const movementTypeLabels: Record<GroomingSupplyMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  descarte: "Descarte",
  vencido: "Produto vencido",
  perda: "Perda",
  ajuste_positivo: "Ajuste positivo",
  ajuste_negativo: "Ajuste negativo",
};

const equipmentTypes: GroomingEquipmentType[] = [
  "Secador",
  "Lâmina",
  "Máquina",
  "Tesoura",
  "Outro",
];

const equipmentStatuses: GroomingEquipmentStatus[] = [
  "Em uso",
  "Em manutenção",
  "Enviado para afiação",
  "Baixado",
];

const equipmentServiceTypes: GroomingEquipmentServiceType[] = [
  "Afiação",
  "Manutenção",
  "Conserto",
  "Limpeza",
  "Outro",
];

export function GroomingSuppliesManager() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("insumos");
  const [loading, setLoading] = useState(true);
  const [setupMissing, setSetupMissing] = useState(false);
  const [movementToDelete, setMovementToDelete] =
    useState<GroomingSupplyMovement | null>(null);
  const [deletingMovement, setDeletingMovement] = useState(false);
  const [editingEquipment, setEditingEquipment] =
    useState<GroomingEquipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] =
    useState<GroomingEquipment | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState(false);

  const [supplies, setSupplies] = useState<GroomingSupply[]>([]);
  const [movements, setMovements] = useState<GroomingSupplyMovement[]>([]);
  const [purchaseDocuments, setPurchaseDocuments] = useState<
    PurchaseDocumentArchive[]
  >([]);
  const [movementSupplierFilter, setMovementSupplierFilter] = useState("");
  const [movementDocumentFilter, setMovementDocumentFilter] = useState("");
  const [movementStartDateFilter, setMovementStartDateFilter] = useState("");
  const [movementEndDateFilter, setMovementEndDateFilter] = useState("");
  const [movementOnlyWithFile, setMovementOnlyWithFile] = useState(false);
  const [dailyPayments, setDailyPayments] = useState<GroomerDailyPayment[]>([]);
  const [equipment, setEquipment] = useState<GroomingEquipment[]>([]);
  const [equipmentServices, setEquipmentServices] = useState<
    GroomingEquipmentService[]
  >([]);

  const [supplyForm, setSupplyForm] = useState({
    name: "",
    category: "Geral",
    unit: "unidade",
    minimumStock: "1",
    supplier: "",
    notes: "",
  });

  const [movementForm, setMovementForm] = useState({
    supplyId: "",
    movementType: "entrada" as GroomingSupplyMovementType,
    quantity: "1",
    unitCost: "0",
    supplier: "",
    movementDate: getTodayDate(),
    expirationDate: "",
    paymentStatus: "Pago" as GroomingPaymentStatus,
    paymentMethod: "PIX",
    dueDate: "",
    notes: "",
  });

  const [dailyForm, setDailyForm] = useState({
    professionalName: "",
    workDate: getTodayDate(),
    paymentType: "diaria" as "diaria" | "comissao" | "extra",
    amount: "0",
    paymentStatus: "Pendente" as GroomingPaymentStatus,
    paymentMethod: "PIX",
    dueDate: getTodayDate(),
    notes: "",
  });

  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    equipmentType: "Secador" as GroomingEquipmentType,
    sizeOrModel: "",
    serialNumber: "",
    supplier: "",
    purchaseDate: "",
    purchaseCost: "",
    status: "Em uso" as GroomingEquipmentStatus,
    notes: "",
  });

  const [equipmentServiceForm, setEquipmentServiceForm] = useState({
    equipmentId: "",
    serviceType: "Afiação" as GroomingEquipmentServiceType,
    supplier: "",
    sentDate: getTodayDate(),
    expectedReturnDate: "",
    returnedDate: "",
    cost: "0",
    paymentStatus: "Pendente" as GroomingPaymentStatus,
    paymentMethod: "PIX",
    dueDate: getTodayDate(),
    notes: "",
  });

  async function loadData() {
    setLoading(true);
    setSetupMissing(false);

    const [
      suppliesResponse,
      movementsResponse,
      paymentsResponse,
      equipmentResponse,
      equipmentServicesResponse,
      purchaseDocumentsResponse,
    ] = await Promise.all([
      fetchGroomingSupplies(),
      fetchGroomingSupplyMovements(),
      fetchGroomerDailyPayments(),
      fetchGroomingEquipment(),
      fetchGroomingEquipmentServices(),
      fetchPurchaseDocuments("grooming"),
    ]);

    if (
      isMissingGroomingSchemaError(suppliesResponse.error) ||
      isMissingGroomingSchemaError(movementsResponse.error) ||
      isMissingGroomingSchemaError(paymentsResponse.error) ||
      isMissingGroomingSchemaError(equipmentResponse.error) ||
      isMissingGroomingSchemaError(equipmentServicesResponse.error) ||
      isMissingGroomingSchemaError(purchaseDocumentsResponse.error)
    ) {
      setSetupMissing(true);
      setLoading(false);
      return;
    }

    if (suppliesResponse.error) {
      console.error(suppliesResponse.error);
      toast.error("Não foi possível carregar os insumos.");
    } else {
      setSupplies((suppliesResponse.data || []) as GroomingSupply[]);
    }

    if (movementsResponse.error) {
      console.error(movementsResponse.error);
      toast.error("Não foi possível carregar as movimentações.");
    } else {
      setMovements((movementsResponse.data || []) as GroomingSupplyMovement[]);
    }

    if (purchaseDocumentsResponse.error) {
      console.error(purchaseDocumentsResponse.error);
      toast.error("Não foi possível carregar os documentos das compras.");
    } else {
      setPurchaseDocuments(purchaseDocumentsResponse.data || []);
    }

    if (paymentsResponse.error) {
      console.error(paymentsResponse.error);
      toast.error("Não foi possível carregar as diárias.");
    } else {
      setDailyPayments((paymentsResponse.data || []) as GroomerDailyPayment[]);
    }

    if (equipmentResponse.error) {
      console.error(equipmentResponse.error);
      toast.error("Não foi possível carregar os equipamentos.");
    } else {
      setEquipment((equipmentResponse.data || []) as GroomingEquipment[]);
    }

    if (equipmentServicesResponse.error) {
      console.error(equipmentServicesResponse.error);
      toast.error("Não foi possível carregar as manutenções.");
    } else {
      setEquipmentServices(
        (equipmentServicesResponse.data || []) as GroomingEquipmentService[],
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    // A carga inicial precisa buscar dados do Supabase ao montar o componente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const activeSupplies = useMemo(
    () => supplies.filter((supply) => supply.active),
    [supplies],
  );

  const documentByMovementId = useMemo(() => {
    const documentsByDirectId = new Map(
      purchaseDocuments.map((document) => [
        document.linked_record_id,
        document,
      ]),
    );
    const documentByGroup = new Map<string, PurchaseDocumentArchive>();
    movements.forEach((movement) => {
      const document = documentsByDirectId.get(movement.id);
      if (document && movement.purchase_group_id) {
        documentByGroup.set(movement.purchase_group_id, document);
      }
    });
    return new Map(
      movements.map((movement) => [
        movement.id,
        documentsByDirectId.get(movement.id) ||
          (movement.purchase_group_id
            ? documentByGroup.get(movement.purchase_group_id)
            : undefined),
      ]),
    );
  }, [movements, purchaseDocuments]);
  const filteredMovements = useMemo(
    () =>
      movements.filter((movement) => {
        const supplierName = movement.supplier?.toLowerCase() || "";
        const documentNumber = movement.document_number?.toLowerCase() || "";
        return (
          (!movementSupplierFilter ||
            supplierName.includes(
              movementSupplierFilter.trim().toLowerCase(),
            )) &&
          (!movementDocumentFilter ||
            documentNumber.includes(
              movementDocumentFilter.trim().toLowerCase(),
            )) &&
          (!movementStartDateFilter ||
            movement.movement_date >= movementStartDateFilter) &&
          (!movementEndDateFilter ||
            movement.movement_date <= movementEndDateFilter) &&
          (!movementOnlyWithFile ||
            Boolean(documentByMovementId.get(movement.id)))
        );
      }),
    [
      documentByMovementId,
      movementDocumentFilter,
      movementEndDateFilter,
      movementOnlyWithFile,
      movements,
      movementStartDateFilter,
      movementSupplierFilter,
    ],
  );

  function clearMovementFilters() {
    setMovementSupplierFilter("");
    setMovementDocumentFilter("");
    setMovementStartDateFilter("");
    setMovementEndDateFilter("");
    setMovementOnlyWithFile(false);
  }
  const activeEquipment = useMemo(
    () => equipment.filter((item) => item.active),
    [equipment],
  );

  const alerts = useMemo(() => {
    const today = getTodayDate();
    const inThirtyDays = getDateAfterDays(30);

    const lowStockSupplies = activeSupplies.filter(
      (supply) =>
        Number(supply.current_stock || 0) <= Number(supply.minimum_stock || 0),
    );

    const pendingSupplyPayments = movements.filter(
      (movement) =>
        movement.payment_status === "Pendente" &&
        Boolean(movement.due_date) &&
        String(movement.due_date) <= inThirtyDays,
    );

    const pendingDailyPayments = dailyPayments.filter(
      (payment) =>
        payment.payment_status === "Pendente" &&
        Boolean(payment.due_date) &&
        String(payment.due_date) <= inThirtyDays,
    );

    const overdueSupplyPayments = pendingSupplyPayments.filter(
      (movement) => movement.due_date && movement.due_date < today,
    );

    const overdueDailyPayments = pendingDailyPayments.filter(
      (payment) => payment.due_date && payment.due_date < today,
    );

    return {
      lowStockSupplies,
      pendingSupplyPayments,
      pendingDailyPayments,
      overdueSupplyPayments,
      overdueDailyPayments,
      total:
        lowStockSupplies.length +
        pendingSupplyPayments.length +
        pendingDailyPayments.length,
    };
  }, [activeSupplies, dailyPayments, movements]);

  async function handleCreateSupply() {
    const minimumStock = Number(supplyForm.minimumStock.replace(",", "."));

    if (!supplyForm.name.trim()) {
      toast.error("Informe o nome do insumo.");
      return;
    }

    if (Number.isNaN(minimumStock) || minimumStock < 0) {
      toast.error("Informe um estoque mínimo válido.");
      return;
    }

    const { error } = await createGroomingSupply({
      name: supplyForm.name,
      category: supplyForm.category,
      unit: supplyForm.unit,
      minimumStock,
      supplier: supplyForm.supplier,
      notes: supplyForm.notes,
      active: true,
    });

    if (error) {
      console.error(error);
      toast.error("Erro ao cadastrar insumo.");
      return;
    }

    toast.success("Insumo cadastrado com sucesso.");
    setSupplyForm({
      name: "",
      category: "Geral",
      unit: "unidade",
      minimumStock: "1",
      supplier: "",
      notes: "",
    });
    await loadData();
  }

  async function handleCreateMovement() {
    const quantity = Number(movementForm.quantity.replace(",", "."));
    const unitCost = Number(movementForm.unitCost.replace(",", "."));

    if (!movementForm.supplyId) {
      toast.error("Selecione o insumo.");
      return;
    }

    if (Number.isNaN(quantity) || quantity <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }

    if (Number.isNaN(unitCost) || unitCost < 0) {
      toast.error("Informe um custo válido.");
      return;
    }

    if (
      movementForm.paymentStatus === "Pendente" &&
      movementForm.movementType === "entrada" &&
      !movementForm.dueDate
    ) {
      toast.error("Informe o vencimento da conta a pagar.");
      return;
    }

    const { error } = await createGroomingSupplyMovement({
      supplyId: Number(movementForm.supplyId),
      movementType: movementForm.movementType,
      quantity,
      unitCost,
      supplier: movementForm.supplier,
      movementDate: movementForm.movementDate,
      expirationDate: movementForm.expirationDate || undefined,
      paymentStatus: movementForm.paymentStatus,
      paymentMethod: movementForm.paymentMethod,
      dueDate: movementForm.dueDate || undefined,
      notes: movementForm.notes,
    });

    if (error) {
      console.error(error);
      toast.error("Erro ao registrar movimentação.");
      return;
    }

    toast.success("Movimentação registrada com sucesso.");
    setMovementForm({
      supplyId: "",
      movementType: "entrada",
      quantity: "1",
      unitCost: "0",
      supplier: "",
      movementDate: getTodayDate(),
      expirationDate: "",
      paymentStatus: "Pago",
      paymentMethod: "PIX",
      dueDate: "",
      notes: "",
    });
    await loadData();
  }

  async function handleDeleteMovement() {
    if (!movementToDelete) {
      return;
    }

    setDeletingMovement(true);
    const { error } = await deleteGroomingSupplyMovement(movementToDelete.id);

    if (error) {
      console.error(error);
      toast.error(error.message || "Erro ao excluir movimentação.");
      setDeletingMovement(false);
      return;
    }

    toast.success("Movimentação excluída com sucesso.");
    setMovementToDelete(null);
    setDeletingMovement(false);
    await loadData();
  }

  async function handleCreateDailyPayment() {
    const amount = Number(dailyForm.amount.replace(",", "."));

    if (!dailyForm.professionalName.trim()) {
      toast.error("Informe o nome do profissional.");
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    if (dailyForm.paymentStatus === "Pendente" && !dailyForm.dueDate) {
      toast.error("Informe o vencimento da conta a pagar.");
      return;
    }

    const { error } = await createGroomerDailyPayment({
      professionalName: dailyForm.professionalName,
      workDate: dailyForm.workDate,
      paymentType: dailyForm.paymentType,
      amount,
      paymentStatus: dailyForm.paymentStatus,
      paymentMethod: dailyForm.paymentMethod,
      dueDate: dailyForm.dueDate || undefined,
      notes: dailyForm.notes,
    });

    if (error) {
      console.error(error);
      toast.error("Erro ao cadastrar diária.");
      return;
    }

    toast.success("Diária cadastrada com sucesso.");
    setDailyForm({
      professionalName: "",
      workDate: getTodayDate(),
      paymentType: "diaria",
      amount: "0",
      paymentStatus: "Pendente",
      paymentMethod: "PIX",
      dueDate: getTodayDate(),
      notes: "",
    });
    await loadData();
  }

  function resetEquipmentForm() {
    setEquipmentForm({
      name: "",
      equipmentType: "Secador",
      sizeOrModel: "",
      serialNumber: "",
      supplier: "",
      purchaseDate: "",
      purchaseCost: "",
      status: "Em uso",
      notes: "",
    });
    setEditingEquipment(null);
  }

  function handleEditEquipment(item: GroomingEquipment) {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name,
      equipmentType: item.equipment_type,
      sizeOrModel: item.size_or_model || "",
      serialNumber: item.serial_number || "",
      supplier: item.supplier || "",
      purchaseDate: item.purchase_date || "",
      purchaseCost:
        item.purchase_cost === undefined || item.purchase_cost === null
          ? ""
          : String(item.purchase_cost),
      status: item.status,
      notes: item.notes || "",
    });
  }

  async function handleSaveEquipment() {
    const purchaseCost = equipmentForm.purchaseCost
      ? Number(equipmentForm.purchaseCost.replace(",", "."))
      : undefined;

    if (!equipmentForm.name.trim()) {
      toast.error("Informe o nome do equipamento.");
      return;
    }

    if (
      equipmentForm.purchaseCost &&
      (!Number.isFinite(purchaseCost) || Number(purchaseCost) < 0)
    ) {
      toast.error("Informe um valor de compra válido.");
      return;
    }

    const input = {
      name: equipmentForm.name,
      equipmentType: equipmentForm.equipmentType,
      sizeOrModel: equipmentForm.sizeOrModel,
      serialNumber: equipmentForm.serialNumber,
      supplier: equipmentForm.supplier,
      purchaseDate: equipmentForm.purchaseDate,
      purchaseCost,
      status: equipmentForm.status,
      notes: equipmentForm.notes,
      active: true,
    };

    const { error } = editingEquipment
      ? await updateGroomingEquipment(editingEquipment.id, input)
      : await createGroomingEquipment(input);

    if (error) {
      console.error(error);
      toast.error(
        editingEquipment
          ? "Erro ao atualizar equipamento."
          : "Erro ao cadastrar equipamento.",
      );
      return;
    }

    toast.success(
      editingEquipment
        ? "Equipamento atualizado com sucesso."
        : "Equipamento cadastrado com sucesso.",
    );
    resetEquipmentForm();
    await loadData();
  }

  async function handleDeleteEquipment() {
    if (!equipmentToDelete) {
      return;
    }

    setDeletingEquipment(true);
    const { error } = await deleteGroomingEquipment(equipmentToDelete.id);

    if (error) {
      console.error(error);
      toast.error("Erro ao excluir equipamento.");
      setDeletingEquipment(false);
      return;
    }

    if (editingEquipment?.id === equipmentToDelete.id) {
      resetEquipmentForm();
    }

    toast.success("Equipamento excluído com sucesso.");
    setEquipmentToDelete(null);
    setDeletingEquipment(false);
    await loadData();
  }

  async function handleCreateEquipmentService() {
    const cost = Number(equipmentServiceForm.cost.replace(",", "."));

    if (!equipmentServiceForm.equipmentId) {
      toast.error("Selecione o equipamento.");
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      toast.error("Informe um custo válido.");
      return;
    }

    const { error } = await createGroomingEquipmentService({
      equipmentId: Number(equipmentServiceForm.equipmentId),
      serviceType: equipmentServiceForm.serviceType,
      supplier: equipmentServiceForm.supplier,
      sentDate: equipmentServiceForm.sentDate,
      expectedReturnDate: equipmentServiceForm.expectedReturnDate,
      returnedDate: equipmentServiceForm.returnedDate,
      cost,
      paymentStatus: equipmentServiceForm.paymentStatus,
      paymentMethod: equipmentServiceForm.paymentMethod,
      dueDate: equipmentServiceForm.dueDate,
      notes: equipmentServiceForm.notes,
    });

    if (error) {
      console.error(error);
      toast.error("Erro ao registrar manutenção.");
      return;
    }

    toast.success("Manutenção registrada com sucesso.");
    setEquipmentServiceForm({
      equipmentId: "",
      serviceType: "Afiação",
      supplier: "",
      sentDate: getTodayDate(),
      expectedReturnDate: "",
      returnedDate: "",
      cost: "0",
      paymentStatus: "Pendente",
      paymentMethod: "PIX",
      dueDate: getTodayDate(),
      notes: "",
    });
    await loadData();
  }

  return (
    <section className="max-w-full space-y-5 overflow-x-hidden pb-20 md:pb-0">
      <div className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#8A0EEA]">Banho e Tosa</p>
            <h2 className="text-xl font-bold text-slate-900">
              Controle de insumos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Controle shampoo, algodão, laços, produtos vencendo, estoque baixo
              e diárias de tosador.
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-2 gap-2 text-sm sm:grid-cols-5 md:w-auto">
            <SummaryCard
              label="Insumos"
              value={String(activeSupplies.length)}
            />
            <SummaryCard label="Movimentos" value={String(movements.length)} />
            <SummaryCard label="Diárias" value={String(dailyPayments.length)} />
            <SummaryCard
              label="Equipamentos"
              value={String(activeEquipment.length)}
            />
            <SummaryCard label="Alertas" value={String(alerts.total)} alert />
          </div>
        </div>

        <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-5">
          <TabButton
            active={activeTab === "insumos"}
            icon={<Package size={17} />}
            label="Insumos"
            onClick={() => setActiveTab("insumos")}
          />
          <TabButton
            active={activeTab === "movimentos"}
            icon={<PlusCircle size={17} />}
            label="Entradas e saídas"
            onClick={() => setActiveTab("movimentos")}
          />
          <TabButton
            active={activeTab === "diarias"}
            icon={<Scissors size={17} />}
            label="Diárias"
            onClick={() => setActiveTab("diarias")}
          />
          <TabButton
            active={activeTab === "equipamentos"}
            icon={<Wrench size={17} />}
            label="Equipamentos"
            onClick={() => setActiveTab("equipamentos")}
          />
          <TabButton
            active={activeTab === "alertas"}
            icon={<AlertTriangle size={17} />}
            label="Alertas"
            onClick={() => setActiveTab("alertas")}
          />
        </div>
      </div>

      {setupMissing ? (
        <GroomingSetupPanel />
      ) : loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
          Carregando insumos...
        </div>
      ) : (
        <>
          {activeTab === "insumos" && (
            <div className="grid min-w-0 gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
              <FormCard title="Cadastrar insumo">
                <TextInput
                  label="Nome"
                  value={supplyForm.name}
                  onChange={(value) =>
                    setSupplyForm((current) => ({ ...current, name: value }))
                  }
                  placeholder="Ex.: Shampoo neutro 5L"
                />

                <SelectInput
                  label="Categoria"
                  value={supplyForm.category}
                  onChange={(value) =>
                    setSupplyForm((current) => ({
                      ...current,
                      category: value,
                    }))
                  }
                  options={supplyCategories}
                />

                <SelectInput
                  label="Unidade"
                  value={supplyForm.unit}
                  onChange={(value) =>
                    setSupplyForm((current) => ({ ...current, unit: value }))
                  }
                  options={unitOptions}
                />

                <TextInput
                  label="Estoque mínimo"
                  value={supplyForm.minimumStock}
                  onChange={(value) =>
                    setSupplyForm((current) => ({
                      ...current,
                      minimumStock: value,
                    }))
                  }
                  inputMode="decimal"
                />

                <TextInput
                  label="Fornecedor padrão"
                  value={supplyForm.supplier}
                  onChange={(value) =>
                    setSupplyForm((current) => ({
                      ...current,
                      supplier: value,
                    }))
                  }
                />

                <TextArea
                  label="Observações"
                  value={supplyForm.notes}
                  onChange={(value) =>
                    setSupplyForm((current) => ({ ...current, notes: value }))
                  }
                />

                <button
                  type="button"
                  onClick={handleCreateSupply}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white hover:bg-[#7600d1]"
                >
                  Salvar insumo
                </button>
              </FormCard>

              <DataCard title="Insumos cadastrados">
                <div className="space-y-3 md:hidden">
                  {supplies.map((supply) => (
                    <article
                      key={supply.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate font-bold text-slate-900">
                            {supply.name}
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            {supply.category}
                          </p>
                        </div>
                        {supply.active ? (
                          <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                            Ativo
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                            Arquivado
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Estoque
                          </p>
                          <p className="font-bold text-slate-900">
                            {formatNumber(supply.current_stock)} {supply.unit}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">
                            Mínimo
                          </p>
                          <p className="font-bold text-slate-900">
                            {formatNumber(supply.minimum_stock)} {supply.unit}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                        Fornecedor: {supply.supplier || "-"}
                      </p>
                    </article>
                  ))}

                  {supplies.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                      Nenhum insumo cadastrado.
                    </div>
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="p-3">Nome</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Estoque</th>
                        <th className="p-3">Mínimo</th>
                        <th className="p-3">Fornecedor</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplies.map((supply) => (
                        <tr key={supply.id} className="border-b last:border-0">
                          <td className="p-3 font-semibold text-slate-800">
                            {supply.name}
                          </td>
                          <td className="p-3">{supply.category}</td>
                          <td className="p-3">
                            {formatNumber(supply.current_stock)} {supply.unit}
                          </td>
                          <td className="p-3">
                            {formatNumber(supply.minimum_stock)} {supply.unit}
                          </td>
                          <td className="p-3">{supply.supplier || "-"}</td>
                          <td className="p-3">
                            {supply.active ? (
                              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                Ativo
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                                Arquivado
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {supplies.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-slate-500"
                          >
                            Nenhum insumo cadastrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </div>
          )}

          {activeTab === "movimentos" && (
            <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
              <FormCard title="Registrar entrada ou saída">
                <label className="grid gap-2 text-sm font-medium">
                  Insumo
                  <select
                    value={movementForm.supplyId}
                    onChange={(event) =>
                      setMovementForm((current) => ({
                        ...current,
                        supplyId: event.target.value,
                      }))
                    }
                    className="rounded-xl border p-3 font-normal"
                  >
                    <option value="">Selecione</option>
                    {activeSupplies.map((supply) => (
                      <option key={supply.id} value={supply.id}>
                        {supply.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Tipo
                  <select
                    value={movementForm.movementType}
                    onChange={(event) =>
                      setMovementForm((current) => ({
                        ...current,
                        movementType: event.target
                          .value as GroomingSupplyMovementType,
                      }))
                    }
                    className="rounded-xl border p-3 font-normal"
                  >
                    {Object.entries(movementTypeLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Quantidade"
                    value={movementForm.quantity}
                    onChange={(value) =>
                      setMovementForm((current) => ({
                        ...current,
                        quantity: value,
                      }))
                    }
                    inputMode="decimal"
                  />
                  <TextInput
                    label="Custo unitário"
                    value={movementForm.unitCost}
                    onChange={(value) =>
                      setMovementForm((current) => ({
                        ...current,
                        unitCost: value,
                      }))
                    }
                    inputMode="decimal"
                  />
                </div>

                <TextInput
                  label="Fornecedor"
                  value={movementForm.supplier}
                  onChange={(value) =>
                    setMovementForm((current) => ({
                      ...current,
                      supplier: value,
                    }))
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Data"
                    type="date"
                    value={movementForm.movementDate}
                    onChange={(value) =>
                      setMovementForm((current) => ({
                        ...current,
                        movementDate: value,
                      }))
                    }
                  />
                  <TextInput
                    label="Validade"
                    type="date"
                    value={movementForm.expirationDate}
                    onChange={(value) =>
                      setMovementForm((current) => ({
                        ...current,
                        expirationDate: value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2 text-sm font-medium">
                    Pagamento
                    <select
                      value={movementForm.paymentStatus}
                      onChange={(event) =>
                        setMovementForm((current) => ({
                          ...current,
                          paymentStatus: event.target
                            .value as GroomingPaymentStatus,
                        }))
                      }
                      className="rounded-xl border p-3 font-normal"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </label>

                  <TextInput
                    label="Vencimento"
                    type="date"
                    value={movementForm.dueDate}
                    onChange={(value) =>
                      setMovementForm((current) => ({
                        ...current,
                        dueDate: value,
                      }))
                    }
                  />
                </div>

                <TextInput
                  label="Forma de pagamento"
                  value={movementForm.paymentMethod}
                  onChange={(value) =>
                    setMovementForm((current) => ({
                      ...current,
                      paymentMethod: value,
                    }))
                  }
                />

                <TextArea
                  label="Observações"
                  value={movementForm.notes}
                  onChange={(value) =>
                    setMovementForm((current) => ({ ...current, notes: value }))
                  }
                />

                <button
                  type="button"
                  onClick={handleCreateMovement}
                  className="rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white hover:bg-[#7600d1]"
                >
                  Registrar movimentação
                </button>
              </FormCard>

              <DataCard title="Últimas movimentações">
                <div className="mb-4 grid gap-3 rounded-xl border bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-5">
                  <input
                    value={movementSupplierFilter}
                    onChange={(event) =>
                      setMovementSupplierFilter(event.target.value)
                    }
                    placeholder="Filtrar fornecedor"
                    className="rounded-xl border bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={movementDocumentFilter}
                    onChange={(event) =>
                      setMovementDocumentFilter(event.target.value)
                    }
                    placeholder="Número da nota"
                    className="rounded-xl border bg-white px-3 py-2 text-sm"
                  />
                  <label className="grid gap-1 text-xs font-medium text-slate-600">
                    De
                    <input
                      type="date"
                      value={movementStartDateFilter}
                      onChange={(event) =>
                        setMovementStartDateFilter(event.target.value)
                      }
                      className="rounded-xl border bg-white px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-slate-600">
                    Até
                    <input
                      type="date"
                      value={movementEndDateFilter}
                      onChange={(event) =>
                        setMovementEndDateFilter(event.target.value)
                      }
                      className="rounded-xl border bg-white px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="flex min-h-10 flex-1 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={movementOnlyWithFile}
                        onChange={(event) =>
                          setMovementOnlyWithFile(event.target.checked)
                        }
                        className="accent-[#8A0EEA]"
                      />
                      Com arquivo
                    </label>
                    <button
                      type="button"
                      onClick={clearMovementFilters}
                      className="min-h-10 rounded-xl border bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Limpar
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-5">
                    {filteredMovements.length} de {movements.length}{" "}
                    movimento(s)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="p-3">Data</th>
                        <th className="p-3">Insumo</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Quantidade</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Validade</th>
                        <th className="p-3">Pagamento</th>
                        <th className="p-3 text-right">Arquivo</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.map((movement) => (
                        <tr
                          key={movement.id}
                          className="border-b last:border-0"
                        >
                          <td className="p-3">
                            {formatDateLabel(movement.movement_date)}
                          </td>
                          <td className="p-3 font-semibold">
                            {movement.grooming_supplies?.name || "-"}
                          </td>
                          <td className="p-3">
                            {movementTypeLabels[movement.movement_type]}
                          </td>
                          <td className="p-3">
                            {formatNumber(movement.quantity)}{" "}
                            {movement.grooming_supplies?.unit || ""}
                          </td>
                          <td className="p-3">
                            {formatCurrency(Number(movement.total_cost || 0))}
                          </td>
                          <td className="p-3">
                            {movement.expiration_date
                              ? formatDateLabel(movement.expiration_date)
                              : "-"}
                          </td>
                          <td className="p-3">{movement.payment_status}</td>
                          <td className="p-3 text-right">
                            <PurchaseDocumentActions
                              document={documentByMovementId.get(movement.id)}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setMovementToDelete(movement)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={15} />
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredMovements.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-6 text-center text-slate-500"
                          >
                            Nenhuma movimentação encontrada com esses filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </div>
          )}

          {activeTab === "diarias" && (
            <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
              <FormCard title="Cadastrar diária de tosador">
                <TextInput
                  label="Profissional"
                  value={dailyForm.professionalName}
                  onChange={(value) =>
                    setDailyForm((current) => ({
                      ...current,
                      professionalName: value,
                    }))
                  }
                  placeholder="Nome do tosador"
                />

                <TextInput
                  label="Data"
                  type="date"
                  value={dailyForm.workDate}
                  onChange={(value) =>
                    setDailyForm((current) => ({
                      ...current,
                      workDate: value,
                    }))
                  }
                />

                <label className="grid gap-2 text-sm font-medium">
                  Tipo
                  <select
                    value={dailyForm.paymentType}
                    onChange={(event) =>
                      setDailyForm((current) => ({
                        ...current,
                        paymentType: event.target.value as
                          | "diaria"
                          | "comissao"
                          | "extra",
                      }))
                    }
                    className="rounded-xl border p-3 font-normal"
                  >
                    <option value="diaria">Diária</option>
                    <option value="comissao">Comissão</option>
                    <option value="extra">Extra</option>
                  </select>
                </label>

                <TextInput
                  label="Valor"
                  value={dailyForm.amount}
                  onChange={(value) =>
                    setDailyForm((current) => ({ ...current, amount: value }))
                  }
                  inputMode="decimal"
                />

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-2 text-sm font-medium">
                    Pagamento
                    <select
                      value={dailyForm.paymentStatus}
                      onChange={(event) =>
                        setDailyForm((current) => ({
                          ...current,
                          paymentStatus: event.target
                            .value as GroomingPaymentStatus,
                        }))
                      }
                      className="rounded-xl border p-3 font-normal"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </label>

                  <TextInput
                    label="Vencimento"
                    type="date"
                    value={dailyForm.dueDate}
                    onChange={(value) =>
                      setDailyForm((current) => ({
                        ...current,
                        dueDate: value,
                      }))
                    }
                  />
                </div>

                <TextInput
                  label="Forma de pagamento"
                  value={dailyForm.paymentMethod}
                  onChange={(value) =>
                    setDailyForm((current) => ({
                      ...current,
                      paymentMethod: value,
                    }))
                  }
                />

                <TextArea
                  label="Observações"
                  value={dailyForm.notes}
                  onChange={(value) =>
                    setDailyForm((current) => ({ ...current, notes: value }))
                  }
                />

                <button
                  type="button"
                  onClick={handleCreateDailyPayment}
                  className="rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white hover:bg-[#7600d1]"
                >
                  Salvar diária
                </button>
              </FormCard>

              <DataCard title="Diárias e comissões">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="p-3">Data</th>
                        <th className="p-3">Profissional</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Vencimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyPayments.map((payment) => (
                        <tr key={payment.id} className="border-b last:border-0">
                          <td className="p-3">
                            {formatDateLabel(payment.work_date)}
                          </td>
                          <td className="p-3 font-semibold">
                            {payment.professional_name}
                          </td>
                          <td className="p-3">{payment.payment_type}</td>
                          <td className="p-3">
                            {formatCurrency(Number(payment.amount || 0))}
                          </td>
                          <td className="p-3">{payment.payment_status}</td>
                          <td className="p-3">
                            {payment.due_date
                              ? formatDateLabel(payment.due_date)
                              : "-"}
                          </td>
                        </tr>
                      ))}

                      {dailyPayments.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-slate-500"
                          >
                            Nenhuma diária cadastrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </DataCard>
            </div>
          )}

          {activeTab === "equipamentos" && (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <div className="space-y-5">
                <FormCard
                  title={
                    editingEquipment
                      ? `Editar equipamento: ${editingEquipment.name}`
                      : "Cadastrar equipamento"
                  }
                >
                  <TextInput
                    label="Nome"
                    value={equipmentForm.name}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        name: value,
                      }))
                    }
                    placeholder="Ex: Secador grande, Lâmina 10"
                  />

                  <SelectInput
                    label="Tipo"
                    value={equipmentForm.equipmentType}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        equipmentType: value as GroomingEquipmentType,
                      }))
                    }
                    options={equipmentTypes}
                  />

                  <TextInput
                    label="Tamanho ou modelo"
                    value={equipmentForm.sizeOrModel}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        sizeOrModel: value,
                      }))
                    }
                    placeholder="Ex: Grande, pequeno, 10, 7F"
                  />

                  <TextInput
                    label="Número de série"
                    value={equipmentForm.serialNumber}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        serialNumber: value,
                      }))
                    }
                  />

                  <TextInput
                    label="Fornecedor"
                    value={equipmentForm.supplier}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        supplier: value,
                      }))
                    }
                    placeholder="Fornecedor principal"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      label="Data de compra"
                      value={equipmentForm.purchaseDate}
                      onChange={(value) =>
                        setEquipmentForm((current) => ({
                          ...current,
                          purchaseDate: value,
                        }))
                      }
                      type="date"
                    />

                    <TextInput
                      label="Valor de compra"
                      value={equipmentForm.purchaseCost}
                      onChange={(value) =>
                        setEquipmentForm((current) => ({
                          ...current,
                          purchaseCost: value,
                        }))
                      }
                      inputMode="decimal"
                    />
                  </div>

                  <SelectInput
                    label="Status"
                    value={equipmentForm.status}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        status: value as GroomingEquipmentStatus,
                      }))
                    }
                    options={equipmentStatuses}
                  />

                  <TextInput
                    label="Observações"
                    value={equipmentForm.notes}
                    onChange={(value) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        notes: value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    onClick={handleSaveEquipment}
                    className="rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white hover:bg-[#7600d1]"
                  >
                    {editingEquipment
                      ? "Atualizar equipamento"
                      : "Salvar equipamento"}
                  </button>
                  {editingEquipment && (
                    <button
                      type="button"
                      onClick={resetEquipmentForm}
                      className="rounded-xl border px-4 py-2.5 font-semibold text-slate-700"
                    >
                      Cancelar edição
                    </button>
                  )}
                </FormCard>

                <FormCard title="Enviar para manutenção ou afiação">
                  <label className="grid gap-2 text-sm font-medium">
                    Equipamento
                    <select
                      value={equipmentServiceForm.equipmentId}
                      onChange={(event) =>
                        setEquipmentServiceForm((current) => ({
                          ...current,
                          equipmentId: event.target.value,
                        }))
                      }
                      className="rounded-xl border p-3 font-normal"
                    >
                      <option value="">Selecione</option>
                      {activeEquipment.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                          {item.size_or_model ? ` - ${item.size_or_model}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <SelectInput
                    label="Serviço"
                    value={equipmentServiceForm.serviceType}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        serviceType: value as GroomingEquipmentServiceType,
                      }))
                    }
                    options={equipmentServiceTypes}
                  />

                  <TextInput
                    label="Fornecedor"
                    value={equipmentServiceForm.supplier}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        supplier: value,
                      }))
                    }
                    placeholder="Ex: fornecedor que vai amolar"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      label="Data de envio"
                      value={equipmentServiceForm.sentDate}
                      onChange={(value) =>
                        setEquipmentServiceForm((current) => ({
                          ...current,
                          sentDate: value,
                        }))
                      }
                      type="date"
                    />

                    <TextInput
                      label="Previsão de retorno"
                      value={equipmentServiceForm.expectedReturnDate}
                      onChange={(value) =>
                        setEquipmentServiceForm((current) => ({
                          ...current,
                          expectedReturnDate: value,
                        }))
                      }
                      type="date"
                    />
                  </div>

                  <TextInput
                    label="Data de retorno"
                    value={equipmentServiceForm.returnedDate}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        returnedDate: value,
                      }))
                    }
                    type="date"
                  />

                  <TextInput
                    label="Custo"
                    value={equipmentServiceForm.cost}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        cost: value,
                      }))
                    }
                    inputMode="decimal"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectInput
                      label="Status pagamento"
                      value={equipmentServiceForm.paymentStatus}
                      onChange={(value) =>
                        setEquipmentServiceForm((current) => ({
                          ...current,
                          paymentStatus: value as GroomingPaymentStatus,
                        }))
                      }
                      options={["Pago", "Pendente"]}
                    />

                    <TextInput
                      label="Vencimento"
                      value={equipmentServiceForm.dueDate}
                      onChange={(value) =>
                        setEquipmentServiceForm((current) => ({
                          ...current,
                          dueDate: value,
                        }))
                      }
                      type="date"
                    />
                  </div>

                  <SelectInput
                    label="Forma de pagamento"
                    value={equipmentServiceForm.paymentMethod}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        paymentMethod: value,
                      }))
                    }
                    options={["PIX", "Dinheiro", "Cartão", "Não informado"]}
                  />

                  <TextInput
                    label="Observações"
                    value={equipmentServiceForm.notes}
                    onChange={(value) =>
                      setEquipmentServiceForm((current) => ({
                        ...current,
                        notes: value,
                      }))
                    }
                  />

                  <button
                    type="button"
                    onClick={handleCreateEquipmentService}
                    className="rounded-xl bg-[#8A0EEA] px-4 py-2.5 font-semibold text-white hover:bg-[#7600d1]"
                  >
                    Registrar serviço
                  </button>
                </FormCard>
              </div>

              <div className="space-y-5">
                <DataCard title="Equipamentos cadastrados">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-500">
                          <th className="p-3">Nome</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Modelo</th>
                          <th className="p-3">Fornecedor</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipment
                          .filter((item) => item.active)
                          .map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="p-3 font-semibold">{item.name}</td>
                              <td className="p-3">{item.equipment_type}</td>
                              <td className="p-3">
                                {item.size_or_model || "-"}
                              </td>
                              <td className="p-3">{item.supplier || "-"}</td>
                              <td className="p-3">{item.status}</td>
                              <td className="p-3">
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleEditEquipment(item)}
                                    className="font-semibold text-blue-600"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEquipmentToDelete(item)}
                                    className="font-semibold text-red-600"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {equipment.filter((item) => item.active).length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-6 text-center text-slate-500"
                            >
                              Nenhum equipamento cadastrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </DataCard>

                <DataCard title="Histórico de manutenção e afiação">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-500">
                          <th className="p-3">Data</th>
                          <th className="p-3">Equipamento</th>
                          <th className="p-3">Serviço</th>
                          <th className="p-3">Fornecedor</th>
                          <th className="p-3">Custo</th>
                          <th className="p-3">Pagamento</th>
                          <th className="p-3">Retorno</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentServices.map((service) => (
                          <tr key={service.id} className="border-b">
                            <td className="p-3">
                              {formatDateLabel(service.sent_date)}
                            </td>
                            <td className="p-3 font-semibold">
                              {service.grooming_equipment?.name || "-"}
                            </td>
                            <td className="p-3">{service.service_type}</td>
                            <td className="p-3">{service.supplier || "-"}</td>
                            <td className="p-3">
                              {formatCurrency(Number(service.cost || 0))}
                            </td>
                            <td className="p-3">{service.payment_status}</td>
                            <td className="p-3">
                              {service.returned_date
                                ? formatDateLabel(service.returned_date)
                                : service.expected_return_date
                                  ? `Prev. ${formatDateLabel(
                                      service.expected_return_date,
                                    )}`
                                  : "-"}
                            </td>
                          </tr>
                        ))}
                        {equipmentServices.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="p-6 text-center text-slate-500"
                            >
                              Nenhum serviço registrado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </DataCard>
              </div>
            </div>
          )}

          {activeTab === "alertas" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <AlertPanel
                title="Estoque baixo"
                description="Insumos abaixo ou iguais ao estoque mínimo."
                emptyMessage="Nenhum insumo com estoque baixo."
                items={alerts.lowStockSupplies.map((supply) => ({
                  id: supply.id,
                  title: supply.name,
                  description: `${formatNumber(supply.current_stock)} ${
                    supply.unit
                  } em estoque. Mínimo: ${formatNumber(
                    supply.minimum_stock,
                  )} ${supply.unit}.`,
                }))}
              />

              <AlertPanel
                title="Contas de insumos"
                description="Compras de insumos pendentes ou próximas do vencimento."
                emptyMessage="Nenhuma conta de insumo pendente."
                items={alerts.pendingSupplyPayments.map((movement) => ({
                  id: movement.id,
                  title: movement.grooming_supplies?.name || "Compra de insumo",
                  description: `Vencimento: ${
                    movement.due_date ? formatDateLabel(movement.due_date) : "-"
                  }. Valor: ${formatCurrency(
                    Number(movement.total_cost || 0),
                  )}.`,
                }))}
              />

              <AlertPanel
                title="Diárias pendentes"
                description="Pagamentos de tosador pendentes ou próximos do vencimento."
                emptyMessage="Nenhuma diária pendente."
                items={alerts.pendingDailyPayments.map((payment) => ({
                  id: payment.id,
                  title: payment.professional_name,
                  description: `Vencimento: ${
                    payment.due_date ? formatDateLabel(payment.due_date) : "-"
                  }. Valor: ${formatCurrency(Number(payment.amount || 0))}.`,
                }))}
              />
            </div>
          )}
        </>
      )}

      <ConfirmationDialog
        isOpen={Boolean(movementToDelete)}
        title="Excluir movimentação"
        description={
          movementToDelete
            ? `Esta ação vai ajustar o estoque de ${
                movementToDelete.grooming_supplies?.name || "insumo"
              } e remover/atualizar a conta a pagar vinculada se ela ainda estiver pendente. Movimentação: ${
                movementTypeLabels[movementToDelete.movement_type]
              } de ${formatNumber(movementToDelete.quantity)}.`
            : ""
        }
        confirmText={deletingMovement ? "Excluindo..." : "Excluir"}
        onCancel={() => {
          if (!deletingMovement) {
            setMovementToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!deletingMovement) {
            void handleDeleteMovement();
          }
        }}
      />

      <ConfirmationDialog
        isOpen={Boolean(equipmentToDelete)}
        title="Excluir equipamento"
        description={
          equipmentToDelete
            ? `Deseja excluir ${equipmentToDelete.name}? O equipamento será removido das listas de uso, mas o histórico de manutenção e financeiro será preservado.`
            : ""
        }
        confirmText={deletingEquipment ? "Excluindo..." : "Excluir"}
        onCancel={() => {
          if (!deletingEquipment) {
            setEquipmentToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!deletingEquipment) {
            void handleDeleteEquipment();
          }
        }}
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        alert ? "border-amber-200 bg-amber-50" : "bg-slate-50"
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#8A0EEA] bg-purple-50 text-[#8A0EEA]"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4 grid min-w-0 gap-3">{children}</div>
    </div>
  );
}

function DataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-4 min-w-0">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  inputMode?: "decimal";
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full min-w-0 rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-xl border p-3 font-normal"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-medium">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 resize-y rounded-xl border p-3 font-normal"
      />
    </label>
  );
}

function AlertPanel({
  title,
  description,
  emptyMessage,
  items,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  items: Array<{
    id: number;
    title: string;
    description: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
          <AlertTriangle size={18} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border p-3">
              <p className="font-semibold text-slate-800">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GroomingSetupPanel() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-2 text-amber-700">
          <AlertTriangle size={20} />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-amber-950">
              Instalação do módulo pendente no Supabase
            </h3>
            <p className="text-sm text-amber-900">
              Execute os SQLs de insumos no Supabase antes de usar esta tela em
              produção.
            </p>
          </div>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-amber-950">
            <li>supabase/sql/023_grooming_supplies.sql</li>
            <li>supabase/sql/025_grooming_financial_rls.sql</li>
            <li>supabase/sql/026_grooming_supply_invoice_reference.sql</li>
            <li>supabase/sql/027_delete_grooming_supply_movement.sql</li>
          </ol>
          <p className="text-xs text-amber-800">
            O guia completo está em docs/EXECUTAR_SQL_GROOMING_SUPABASE.md.
          </p>
        </div>
      </div>
    </div>
  );
}

function isMissingGroomingSchemaError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "PGRST205"
  );
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(Number(value || 0));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}
