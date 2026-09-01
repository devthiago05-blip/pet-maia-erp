"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import type { PaymentResult } from "@/lib/payments/types";
import { fiscalApi } from "@/services/fiscal-module";

export default function FiscalPaymentsPage() {
  const [amount, setAmount] = useState("150.00");
  const [paymentType, setPaymentType] = useState("PIX");
  const [scenario, setScenario] = useState("approved");
  const [result, setResult] = useState<PaymentResult | null>(null);
  async function simulate() {
    try {
      const response = await fiscalApi<{ result: PaymentResult }>(
        "/api/fiscal/payments/mock",
        {
          method: "POST",
          body: JSON.stringify({
            amount: Number(amount),
            paymentType,
            scenario,
          }),
        },
      );
      setResult(response.result);
      toast.success("Simulação concluída.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha");
    }
  }
  return (
    <FiscalShell
      title="Pagamentos integrados"
      description="SmartPOS desacoplado e seguro"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-bold">MockSmartPOS</h2>
          <div className="mt-4 grid gap-3">
            <label>
              Valor
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                className="mt-1 w-full rounded-xl border p-3"
              />
            </label>
            <label>
              Pagamento
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="mt-1 w-full rounded-xl border p-3"
              >
                <option>PIX</option>
                <option>Crédito</option>
                <option>Débito</option>
                <option>Voucher</option>
              </select>
            </label>
            <label>
              Cenário
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="mt-1 w-full rounded-xl border p-3"
              >
                <option value="approved">Aprovado</option>
                <option value="declined">Negado</option>
                <option value="cancelled">Cancelado</option>
                <option value="pending">Pendente</option>
                <option value="timeout">Timeout</option>
                <option value="connection_error">Erro de conexão</option>
              </select>
            </label>
            <button
              onClick={simulate}
              className="rounded-xl bg-purple-600 p-3 font-bold text-white"
            >
              Enviar valor ao SmartPOS MOCK
            </button>
          </div>
        </div>
        <div className="rounded-2xl border bg-slate-950 p-5 text-sm text-emerald-300">
          <h2 className="font-bold text-white">Resposta normalizada</h2>
          <pre className="mt-4 whitespace-pre-wrap">
            {result
              ? JSON.stringify(result, null, 2)
              : "Nenhuma simulação executada."}
          </pre>
        </div>
      </div>
    </FiscalShell>
  );
}
