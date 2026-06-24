"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  type AccessModule,
  accessModuleLabels,
  accessModules,
} from "@/lib/access-control";
import type { UserInput } from "@/services/users";
import type { UserProfile } from "@/types/domain";

interface UserModalProps {
  user?: UserProfile | null;
  onSave: (input: UserInput) => Promise<void>;
}

export function UserModal({ user, onSave }: UserModalProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [ativo, setAtivo] = useState(user?.ativo ?? true);
  const [isAdmin, setIsAdmin] = useState(user?.is_admin ?? false);
  const [permissions, setPermissions] = useState<AccessModule[]>(
    user?.user_permissions
      ?.filter((permission) => permission.can_access)
      .map((permission) => permission.module) || ["dashboard"],
  );
  const [saving, setSaving] = useState(false);

  function resetNewUserForm() {
    if (user) {
      return;
    }

    setNome("");
    setEmail("");
    setPassword("");
    setAtivo(true);
    setIsAdmin(false);
    setPermissions(["dashboard"]);
  }

  function togglePermission(module: AccessModule) {
    setPermissions((current) =>
      current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module],
    );
  }

  async function handleSave() {
    if (!nome.trim() || !email.trim()) {
      toast.error("Informe nome e email");
      return;
    }

    if (!user && password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (user && password && password.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        id: user?.id,
        nome: nome.trim(),
        email: email.trim(),
        password: password || undefined,
        ativo,
        is_admin: isAdmin,
        permissions: isAdmin ? [...accessModules] : permissions,
      });
      setOpen(false);
      resetNewUserForm();
    } catch {
      return;
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          user
            ? "text-blue-600"
            : "w-full rounded-xl bg-[#8A0EEA] px-4 py-2 text-white sm:w-auto"
        }
      >
        {user ? "Editar" : "Novo usuário"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6">
            <h2 className="mb-5 text-xl font-bold">
              {user ? "Editar usuário" : "Novo usuário"}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Nome
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                {user ? "Nova senha (opcional)" : "Senha"}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border p-3 font-normal"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="flex items-center gap-3 rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                />
                <span className="text-sm font-medium">Usuário ativo</span>
              </label>

              <label className="flex items-center gap-3 rounded-xl border p-3">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(event) => setIsAdmin(event.target.checked)}
                />
                <span className="text-sm font-medium">Administrador</span>
              </label>
            </div>

            <fieldset className="mt-5 rounded-xl border p-4">
              <legend className="px-2 font-semibold">Módulos permitidos</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accessModules.map((module) => (
                  <label
                    key={module}
                    className="flex items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={isAdmin || permissions.includes(module)}
                      disabled={isAdmin}
                      onChange={() => togglePermission(module)}
                    />
                    {accessModuleLabels[module]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="w-full rounded-xl border py-2 sm:flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl bg-[#8A0EEA] py-2 text-white disabled:opacity-60 sm:flex-1"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
