"use client";

import { GroomingSupplyBatchEntryForm } from "@/components/grooming/GroomingSupplyBatchEntryForm";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function GroomingSupplyBatchEntryPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Entrada por nota
            </h1>
            <p className="text-slate-500">
              Cadastre vários insumos de uma mesma compra.
            </p>
          </div>

          <GroomingSupplyBatchEntryForm />
        </div>
      </main>
    </div>
  );
}
