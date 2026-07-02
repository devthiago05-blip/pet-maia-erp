"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ExtraService {
  id: string;
  nome: string;
  valor: string;
}

interface FinishAppointmentModalProps {
  pet: string;
  porte?: string;
  servico: string;
  valorSugerido: number | null;
  onSave: (dados: {
    valor: number;
    formaPagamento: string;
    servicoDescricao: string;
    observacoes?: string;
  }) => void;
}

export function FinishAppointmentModal({
  pet,
  porte,
  servico,
  valorSugerido,
  onSave,
}: FinishAppointmentModalProps) {
  const [valorPrincipal, setValorPrincipal] = useState(
    valorSugerido === null ? "" : String(valorSugerido),
  );
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [extras, setExtras] = useState<ExtraService[]>([]);

  const total = useMemo(() => {
    const principal = Number(valorPrincipal) || 0;
    const extrasTotal = extras.reduce(
      (sum, extra) => sum + (Number(extra.valor) || 0),
      0,
    );

    return principal + extrasTotal;
  }, [extras, valorPrincipal]);

  function handleAddExtra() {
    setExtras((currentExtras) => [
      ...currentExtras,
      {
        id: crypto.randomUUID(),
        nome: "",
        valor: "",
      },
    ]);
  }

  function handleRemoveExtra(id: string) {
    setExtras((currentExtras) =>
      currentExtras.filter((extra) => extra.id !== id),
    );
  }

  function handleUpdateExtra(
    id: string,
    field: keyof Omit<ExtraService, "id">,
    value: string,
  ) {
    setExtras((currentExtras) =>
      currentExtras.map((extra) =>
        extra.id === id ? { ...extra, [field]: value } : extra,
      ),
    );
  }

  function handleSave() {
    const principal = Number(valorPrincipal);

    if (!valorPrincipal.trim()) {
      toast.error("Informe o valor principal");
      return;
    }

    if (!Number.isFinite(principal) || principal <= 0) {
      toast.error("Informe um valor principal válido");
      return;
    }

    const hasInvalidExtra = extras.some(
      (extra) =>
        !extra.nome.trim() ||
        !extra.valor.trim() ||
        !Number.isFinite(Number(extra.valor)) ||
        Number(extra.valor) <= 0,
    );

    if (hasInvalidExtra) {
      toast.error("Preencha corretamente todos os serviços extras");
      return;
    }

    const extraNames = extras.map((extra) => extra.nome.trim());
    const servicoDescricao = [servico, ...extraNames].join(" + ");

    onSave({
      valor: total,
      formaPagamento,
      servicoDescricao,
      observacoes: observacoes.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-appointment-title"
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <div className="mb-5">
          <h2
            id="finish-appointment-title"
            className="text-xl font-bold text-slate-900"
          >
            Finalizar atendimento
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Confirme os serviços realizados e o valor total.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl bg-slate-100 p-3 text-sm sm:grid-cols-3">
            <p>
              <strong>Pet:</strong> {pet}
            </p>

            <p>
              <strong>Porte:</strong> {porte || "Não informado"}
            </p>

            <p>
              <strong>Serviço:</strong> {servico}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Valor principal
              <input
                type="number"
                min="0"
                step="0.01"
                value={valorPrincipal}
                onChange={(event) => setValorPrincipal(event.target.value)}
                className="w-full rounded-xl border p-3 font-normal"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Forma de pagamento
              <select
                value={formaPagamento}
                onChange={(event) => setFormaPagamento(event.target.value)}
                className="w-full rounded-xl border p-3 font-normal"
              >
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
              </select>
            </label>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Serviços extras</h3>
                <p className="text-sm text-slate-500">
                  Adicione serviços realizados além do agendamento principal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExtra}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#8A0EEA] px-3 py-2 text-sm font-semibold text-[#8A0EEA] transition hover:bg-[#8A0EEA]/10 sm:w-auto"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {extras.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
                  Nenhum serviço extra adicionado
                </div>
              ) : (
                extras.map((extra) => (
                  <div
                    key={extra.id}
                    className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_160px_auto]"
                  >
                    <input
                      value={extra.nome}
                      onChange={(event) =>
                        handleUpdateExtra(extra.id, "nome", event.target.value)
                      }
                      placeholder="Nome do serviço"
                      className="w-full rounded-xl border p-3"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extra.valor}
                      onChange={(event) =>
                        handleUpdateExtra(
                          extra.id,
                          "valor",
                          event.target.value,
                        )
                      }
                      placeholder="Valor"
                      className="w-full rounded-xl border p-3"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="inline-flex items-center justify-center rounded-xl bg-red-50 p-3 text-red-600 transition hover:bg-red-100"
                      aria-label="Remover serviço extra"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Observações
            <textarea
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              rows={3}
              placeholder="Exemplo: pet sensível, hidratação cortesia, desconto aplicado..."
              className="w-full resize-none rounded-xl border p-3 font-normal"
            />
          </label>

          <div className="rounded-2xl bg-[#8A0EEA]/10 p-4">
            <p className="text-sm font-medium text-[#8A0EEA]">Valor total</p>
            <p className="text-2xl font-bold text-[#8A0EEA]">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onSave({
                valor: 0,
                formaPagamento,
                servicoDescricao: servico,
                observacoes: "CANCEL_MODAL",
              })}
              className="w-full rounded-xl border px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white transition hover:bg-[#7600d1] sm:w-auto"
            >
              Finalizar atendimento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}