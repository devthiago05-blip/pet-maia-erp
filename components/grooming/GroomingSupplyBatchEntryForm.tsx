"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PurchaseDocumentImporter } from "@/components/purchases/PurchaseDocumentImporter";
import {
  createGroomingSupply,
  createGroomingSupplyPurchaseBatch,
  fetchActiveGroomingSupplies,
} from "@/services/grooming";
import {
  fetchPurchaseItemMappings,
  normalizePurchaseDescription,
  savePurchaseItemMapping,
} from "@/services/purchase-recognition";
import type { GroomingSupply } from "@/types/domain";
import type { RecognizedPurchaseDocument } from "@/types/purchase-recognition";

interface BatchItem {
  id: string;
  originalDescription: string;
  supplyId: number;
  quantity: string;
  unitCost: string;
  expirationDate: string;
  notes: string;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyItem(): BatchItem {
  return {
    id: crypto.randomUUID(),
    originalDescription: "",
    supplyId: 0,
    quantity: "",
    unitCost: "",
    expirationDate: "",
    notes: "",
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function GroomingSupplyBatchEntryForm() {
  const [supplies, setSupplies] = useState<GroomingSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMappings, setSavedMappings] = useState<Record<string, number>>(
    {},
  );

  const [documentNumber, setDocumentNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [movementDate, setMovementDate] = useState(getTodayDate());
  const [paymentStatus, setPaymentStatus] = useState<"Pago" | "Pendente">(
    "Pendente",
  );
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BatchItem[]>([createEmptyItem()]);

  const loadSupplies = useCallback(async () => {
    setLoading(true);

    const response = await fetchActiveGroomingSupplies();

    if (response.error) {
      toast.error("Não foi possível carregar os insumos.");
    } else {
      setSupplies(response.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    // A tela precisa buscar os insumos ativos ao carregar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSupplies();
  }, [loadSupplies]);

  useEffect(() => {
    void fetchPurchaseItemMappings("grooming").then(({ data }) => {
      setSavedMappings(
        Object.fromEntries(
          (data || []).map((item) => [
            item.normalized_description,
            Number(item.target_id),
          ]),
        ),
      );
    });
  }, []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity.replace(",", ".") || 0) *
            Number(item.unitCost.replace(",", ".") || 0),
        0,
      ),
    [items],
  );

  function updateItem(id: string, field: keyof BatchItem, value: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === "supplyId" ? Number(value) : value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((item) => item.id !== id),
    );
  }

  function applyRecognizedDocument(
    document: RecognizedPurchaseDocument,
    file: File,
  ) {
    const recognizedItems = document.items.map((recognized) => {
      const mappedId =
        savedMappings[normalizePurchaseDescription(recognized.description)];
      const matched =
        supplies.find((item) => item.id === mappedId) ||
        findBestSupply(recognized.description, supplies);
      return {
        ...createEmptyItem(),
        originalDescription: recognized.description,
        supplyId: matched?.id || 0,
        quantity: String(recognized.quantity || 1),
        unitCost: String(
          recognized.unitCost ||
            recognized.total / Math.max(recognized.quantity, 1) ||
            "",
        ),
      };
    });
    if (recognizedItems.length) setItems(recognizedItems);
    if (document.documentNumber) setDocumentNumber(document.documentNumber);
    if (document.supplierName) setSupplier(document.supplierName);
    if (document.purchaseDate) setMovementDate(document.purchaseDate);
    if (document.dueDate) setDueDate(document.dueDate);
    if (document.paymentMethod) setPaymentMethod(document.paymentMethod);
    setNotes((current) =>
      [current, `Documento importado: ${file.name}`, ...document.warnings]
        .filter(Boolean)
        .join(" · "),
    );
  }

  async function createSupplyFromItem(item: BatchItem) {
    if (!item.originalDescription) return;
    const response = await createGroomingSupply({
      name: item.originalDescription,
      category: "Geral",
      unit: "unidade",
      minimumStock: 0,
      supplier,
      active: true,
      notes: "Cadastrado durante importação de documento.",
    });
    if (response.error) {
      toast.error(response.error.message);
      return;
    }
    const refreshed = await fetchActiveGroomingSupplies();
    const created = (refreshed.data || []).find(
      (supply) =>
        normalize(supply.name) === normalize(item.originalDescription),
    );
    if (created) {
      setSupplies(refreshed.data || []);
      updateItem(item.id, "supplyId", String(created.id));
      const key = normalizePurchaseDescription(item.originalDescription);
      setSavedMappings((current) => ({ ...current, [key]: created.id }));
      void savePurchaseItemMapping(
        "grooming",
        item.originalDescription,
        created.id,
      );
      toast.success("Insumo cadastrado e associado!");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validItems = items.filter(
      (item) =>
        item.supplyId > 0 && Number(item.quantity.replace(",", ".")) > 0,
    );

    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um produto na nota.");
      return;
    }

    setSaving(true);

    const response = await createGroomingSupplyPurchaseBatch({
      documentNumber: documentNumber.trim() || undefined,
      supplier: supplier.trim() || undefined,
      movementDate,
      paymentStatus,
      paymentMethod: paymentMethod.trim() || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      items: validItems.map((item) => ({
        supplyId: item.supplyId,
        quantity: Number(item.quantity.replace(",", ".")),
        unitCost: Number(item.unitCost.replace(",", ".") || 0),
        expirationDate: item.expirationDate || undefined,
        notes: item.notes.trim() || undefined,
      })),
    });

    setSaving(false);

    if (response.error) {
      toast.error(response.error.message || "Não foi possível salvar a nota.");
      return;
    }

    toast.success("Entrada por nota salva com sucesso.");

    setDocumentNumber("");
    setSupplier("");
    setMovementDate(getTodayDate());
    setPaymentStatus("Pendente");
    setPaymentMethod("");
    setDueDate("");
    setNotes("");
    setItems([createEmptyItem()]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Entrada por nota
            </h2>
            <p className="text-sm text-slate-500">
              Lance vários produtos de uma mesma compra em uma única entrada.
            </p>
          </div>

          <Link
            href="/services/insumos"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Voltar para insumos
          </Link>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <PurchaseDocumentImporter onRecognized={applyRecognizedDocument} />
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Número da nota
              </span>
              <input
                value={documentNumber}
                onChange={(event) => setDocumentNumber(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Ex: NF 123"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Fornecedor
              </span>
              <input
                value={supplier}
                onChange={(event) => setSupplier(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Nome do fornecedor"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Data da compra
              </span>
              <input
                type="date"
                value={movementDate}
                onChange={(event) => setMovementDate(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Pagamento
              </span>
              <select
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as "Pago" | "Pendente")
                }
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Forma de pagamento
              </span>
              <input
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Pix, cartão, dinheiro..."
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">
                Vencimento
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />
            </label>

            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Observação geral
              </span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Ex: compra mensal do banho e tosa"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold text-slate-800">Produtos da nota</h3>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8A0EEA] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7609c9]"
              >
                <PlusCircle size={16} />
                Adicionar produto
              </button>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                Carregando insumos...
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-2xl border bg-slate-50 p-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
                  >
                    {item.originalDescription && (
                      <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 lg:col-span-6">
                        Item reconhecido:{" "}
                        <strong>{item.originalDescription}</strong>
                        {item.supplyId === 0 && (
                          <button
                            type="button"
                            onClick={() => void createSupplyFromItem(item)}
                            className="ml-2 font-bold text-[#8A0EEA] underline"
                          >
                            Cadastrar este insumo
                          </button>
                        )}
                      </div>
                    )}
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Produto {index + 1}
                      </span>
                      <select
                        value={item.supplyId}
                        onChange={(event) => {
                          updateItem(item.id, "supplyId", event.target.value);
                          if (
                            item.originalDescription &&
                            event.target.value !== "0"
                          ) {
                            const targetId = Number(event.target.value);
                            const key = normalizePurchaseDescription(
                              item.originalDescription,
                            );
                            setSavedMappings((current) => ({
                              ...current,
                              [key]: targetId,
                            }));
                            void savePurchaseItemMapping(
                              "grooming",
                              item.originalDescription,
                              targetId,
                            );
                          }
                        }}
                        className="w-full rounded-xl border px-3 py-2"
                        required
                      >
                        <option value={0}>Selecione</option>
                        {supplies.map((supply) => (
                          <option key={supply.id} value={supply.id}>
                            {supply.name} ({supply.unit})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Quantidade
                      </span>
                      <input
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(item.id, "quantity", event.target.value)
                        }
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="0"
                        inputMode="decimal"
                        required
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Custo unitário
                      </span>
                      <input
                        value={item.unitCost}
                        onChange={(event) =>
                          updateItem(item.id, "unitCost", event.target.value)
                        }
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Validade
                      </span>
                      <input
                        type="date"
                        value={item.expirationDate}
                        onChange={(event) =>
                          updateItem(
                            item.id,
                            "expirationDate",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border px-3 py-2"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs font-medium text-slate-600">
                        Observação
                      </span>
                      <input
                        value={item.notes}
                        onChange={(event) =>
                          updateItem(item.id, "notes", event.target.value)
                        }
                        className="w-full rounded-xl border px-3 py-2"
                        placeholder="Opcional"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 lg:mt-5"
                      title="Remover produto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total da nota
              </p>
              <p className="text-2xl font-bold text-[#8A0EEA]">
                {formatCurrency(total)}
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center rounded-xl bg-[#8A0EEA] px-5 py-3 font-semibold text-white transition hover:bg-[#7609c9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar entrada por nota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findBestSupply(description: string, supplies: GroomingSupply[]) {
  const source = normalize(description);
  const words = new Set(source.split(" ").filter((word) => word.length > 2));
  return supplies
    .map((supply) => {
      const candidate = normalize(supply.name);
      const matches = [...words].filter((word) =>
        candidate.includes(word),
      ).length;
      return {
        supply,
        score: candidate === source ? 100 : matches / Math.max(words.size, 1),
      };
    })
    .sort((a, b) => b.score - a.score)
    .find((item) => item.score >= 0.5)?.supply;
}
