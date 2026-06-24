"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email ou senha inválidos.");
      setLoading(false);
      return;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <BrandLogo priority className="mx-auto max-w-[320px]" />
          <p className="mt-2 text-slate-500">
            Entre para acessar o painel administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="min-w-0 flex-1 outline-none"
                placeholder="voce@email.com"
              />
            </div>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Senha
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <LockKeyhole size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="min-w-0 flex-1 outline-none"
                placeholder="Sua senha"
              />
            </div>
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#8A0EEA] px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
