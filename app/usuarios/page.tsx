"use client";

import { Search, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserModal } from "@/components/users/UserModal";
import { useMountEffect } from "@/hooks/useMountEffect";
import { accessModuleLabels } from "@/lib/access-control";
import {
  createUser,
  fetchUsers,
  updateUser,
  type UserInput,
} from "@/services/users";
import type { UserProfile } from "@/types/domain";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return users;
    }

    return users.filter(
      (user) =>
        user.nome.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [search, users]);

  async function loadUsers() {
    setLoading(true);
    setLoadError("");

    try {
      setUsers(await fetchUsers());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar usuários.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  useMountEffect(() => {
    loadUsers();
  });

  async function handleCreate(input: UserInput) {
    try {
      await createUser(input);
      toast.success("Usuário criado com sucesso!");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar usuário.";
      toast.error(message);
      throw error;
    }
  }

  async function handleUpdate(input: UserInput) {
    try {
      await updateUser(input);
      toast.success("Usuário atualizado com sucesso!");
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar usuário.";
      toast.error(message);
      throw error;
    }
  }

  const activeUsers = users.filter((user) => user.ativo).length;
  const administrators = users.filter((user) => user.is_admin).length;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Usuários
              </h1>
              <p className="text-slate-500">
                Controle contas e acessos aos módulos
              </p>
            </div>
            <UserModal onSave={handleCreate} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={<Users size={22} />}
              label="Total"
              value={users.length}
            />
            <SummaryCard
              icon={<UserRoundCheck size={22} />}
              label="Ativos"
              value={activeUsers}
            />
            <SummaryCard
              icon={<ShieldCheck size={22} />}
              label="Administradores"
              value={administrators}
            />
          </div>

          <label className="flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 sm:max-w-md">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou email"
              className="min-w-0 flex-1 outline-none"
            />
          </label>

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">
              Carregando usuários...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[840px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 text-left">Usuário</th>
                      <th className="p-4 text-left">Perfil</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Acessos</th>
                      <th className="p-4 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-sm text-slate-500"
                        >
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const allowedModules = user.user_permissions
                          ?.filter((permission) => permission.can_access)
                          .map(
                            (permission) =>
                              accessModuleLabels[permission.module],
                          );

                        return (
                          <tr key={user.id} className="border-t">
                            <td className="p-4">
                              <p className="font-medium">{user.nome}</p>
                              <p className="text-sm text-slate-500">
                                {user.email}
                              </p>
                            </td>
                            <td className="p-4">
                              {user.is_admin ? "Administrador" : "Usuário"}
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-sm ${
                                  user.ativo
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {user.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="max-w-sm p-4 text-sm text-slate-600">
                              {user.is_admin
                                ? "Todos os módulos"
                                : allowedModules?.join(", ") || "Nenhum módulo"}
                            </td>
                            <td className="p-4">
                              <UserModal user={user} onSave={handleUpdate} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
