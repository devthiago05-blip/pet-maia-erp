import { Building2, ShieldCheck, UserRound } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
              Configurações
            </h1>
            <p className="text-slate-500">
              Revise informações gerais do sistema
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <section className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <Building2 size={22} />
              </div>
              <h2 className="text-lg font-bold">Clínica</h2>
              <p className="mt-2 text-sm text-slate-500">
                PET MAIA ERP configurado para gestão veterinária.
              </p>
            </section>

            <section className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <UserRound size={22} />
              </div>
              <h2 className="text-lg font-bold">Usuário</h2>
              <p className="mt-2 text-sm text-slate-500">
                Perfil administrativo padrão ativo.
              </p>
            </section>

            <section className="rounded-2xl border bg-white p-4 sm:p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
                <ShieldCheck size={22} />
              </div>
              <h2 className="text-lg font-bold">Segurança</h2>
              <p className="mt-2 text-sm text-slate-500">
                Autenticação dedicada ainda não configurada.
              </p>
            </section>
          </div>

          <div className="rounded-2xl border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold">Dados do sistema</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Nome do sistema
                <input
                  readOnly
                  value="PET MAIA ERP"
                  className="w-full rounded-xl border bg-slate-50 px-4 py-2"
                />
              </label>

              <label className="grid gap-2 text-sm">
                Idioma
                <input
                  readOnly
                  value="Português do Brasil"
                  className="w-full rounded-xl border bg-slate-50 px-4 py-2"
                />
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
