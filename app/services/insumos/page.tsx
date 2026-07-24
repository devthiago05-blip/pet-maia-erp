"use client";

import Link from "next/link";

import { GroomingSuppliesManager } from "@/components/grooming/GroomingSuppliesManager";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function GroomingSuppliesPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-x-hidden bg-slate-50">
        <Header />

        <div className="max-w-full space-y-6 p-4 pb-28 sm:p-6 sm:pb-8 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Banho e Tosa
            </h1>
            <p className="text-slate-500">
              Controle de insumos, validade, estoque e diárias.
            </p>
          </div>

          <div className="flex justify-end">
            <Link
              href="/services/insumos/entrada"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#8A0EEA] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#7609c9] sm:w-auto"
            >
              Entrada por nota com vários produtos
            </Link>
          </div>

          <GroomingSuppliesManager />
        </div>
      </main>
    </div>
  );
}
