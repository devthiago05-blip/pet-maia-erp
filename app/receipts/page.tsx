import { FileText, Printer, ReceiptText } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function ReceiptsPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Recibos
            </h1>
            <p className="text-slate-500">
              Consulte e organize os comprovantes emitidos
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <ReceiptText size={22} />
              </div>
              <p className="text-sm text-slate-500">Recibos emitidos</p>
              <h2 className="mt-2 text-2xl font-bold">0</h2>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <Printer size={22} />
              </div>
              <p className="text-sm text-slate-500">Prontos para impressão</p>
              <h2 className="mt-2 text-2xl font-bold">0</h2>
            </div>

            <div className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <FileText size={22} />
              </div>
              <p className="text-sm text-slate-500">Pendentes</p>
              <h2 className="mt-2 text-2xl font-bold">0</h2>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white">
            <div className="w-full overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 text-left sm:p-4">Número</th>
                    <th className="p-3 text-left sm:p-4">Cliente</th>
                    <th className="p-3 text-left sm:p-4">Data</th>
                    <th className="p-3 text-left sm:p-4">Valor</th>
                    <th className="p-3 text-left sm:p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-sm text-slate-500"
                    >
                      Nenhum recibo emitido até o momento.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
