"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { fiscalApi } from "@/services/fiscal-module";

interface ConfigurationDiagnostics {
  enabled: boolean;
  environment: string;
  provider: string;
  payment: { enabled: boolean; provider: string };
}

interface FiscalCompany extends Record<
  string,
  string | number | null | undefined
> {
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  regime_tributario?: string;
  uf?: string;
  municipio?: string;
  codigo_municipio_ibge?: string;
  cep?: string;
  endereco?: string;
  endereco_numero?: string;
  bairro?: string;
  fiscal_environment?: string;
  nfce_series?: number;
  nfce_next_number?: number;
}

interface CompanyResponse {
  company: FiscalCompany;
  credentialsConfigured?: boolean;
}

const companyFields = [
  ["razao_social", "Razão social"],
  ["nome_fantasia", "Nome fantasia"],
  ["cnpj", "CNPJ"],
  ["inscricao_estadual", "Inscrição Estadual"],
  ["uf", "UF"],
  ["municipio", "Município"],
  ["codigo_municipio_ibge", "Código IBGE"],
  ["cep", "CEP"],
  ["endereco", "Endereço"],
  ["endereco_numero", "Número"],
  ["bairro", "Bairro"],
] as const;

export default function FiscalConfigurationPage() {
  const [data, setData] = useState<ConfigurationDiagnostics | null>(null);
  const [company, setCompany] = useState<FiscalCompany>({});
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  useEffect(() => {
    Promise.all([
      fiscalApi<ConfigurationDiagnostics>("/api/fiscal/diagnostics"),
      fiscalApi<CompanyResponse>("/api/fiscal/company"),
    ])
      .then(([diagnostics, companyResponse]) => {
        setData(diagnostics);
        setCompany(companyResponse.company || {});
        setCredentialsConfigured(
          companyResponse.credentialsConfigured === true,
        );
      })
      .catch(() => undefined);
  }, []);
  async function saveCompany() {
    try {
      const response = await fiscalApi<CompanyResponse>("/api/fiscal/company", {
        method: "PATCH",
        body: JSON.stringify(company),
      });
      setCompany(response.company);
      toast.success("Configuração fiscal de homologação salva.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar.");
    }
  }
  return (
    <FiscalShell
      title="Configurações fiscais"
      description="Ambiente, emitente, certificado e CSC"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-bold">Feature flags do servidor</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>NFC-e</dt>
              <dd className="font-bold">
                {data?.enabled ? "ATIVA" : "DESATIVADA"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Ambiente</dt>
              <dd className="font-bold">{data?.environment || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Provider fiscal</dt>
              <dd className="font-bold">{data?.provider || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pagamento integrado</dt>
              <dd className="font-bold">
                {data?.payment?.enabled ? "ATIVO" : "DESATIVADO"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Provider de pagamento</dt>
              <dd className="font-bold">{data?.payment?.provider || "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="font-bold">Dados fiscais e credenciais</h2>
          <p className="mt-3 text-sm text-slate-600">
            Razão social, CNPJ, IE, município, endereço, regime, série,
            certificado A1 e CSC permanecem na área administrativa segura já
            existente. Senha e CSC nunca são devolvidos ao navegador.
          </p>
          <Link
            href="/settings"
            className="mt-5 inline-flex rounded-xl bg-purple-600 px-4 py-3 font-bold text-white"
          >
            Abrir cadastro fiscal da empresa
          </Link>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bold">Dados do emitente</h2>
            <p className="mt-1 text-sm text-slate-500">
              Editáveis para validação do contador. Produção permanece
              bloqueada.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${credentialsConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}
          >
            Certificado/CSC:{" "}
            {credentialsConfigured ? "configurado" : "não configurado"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {companyFields.map(([key, label]) => (
            <label key={key} className="text-sm font-semibold">
              {label}
              <input
                value={company[key] ?? ""}
                onChange={(event) =>
                  setCompany({ ...company, [key]: event.target.value })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
              />
            </label>
          ))}
          <label className="text-sm font-semibold">
            CRT / regime
            <select
              value={company.regime_tributario || ""}
              onChange={(event) =>
                setCompany({
                  ...company,
                  regime_tributario: event.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            >
              <option value="">Selecione</option>
              <option value="1">1 — Simples Nacional</option>
              <option value="2">2 — Simples excesso de sublimite</option>
              <option value="3">3 — Regime normal</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Série NFC-e
            <input
              type="number"
              min={1}
              value={company.nfce_series || 1}
              onChange={(event) =>
                setCompany({
                  ...company,
                  nfce_series: Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            />
          </label>
          <label className="text-sm font-semibold">
            Próximo número
            <input
              type="number"
              min={1}
              value={company.nfce_next_number || 1}
              onChange={(event) =>
                setCompany({
                  ...company,
                  nfce_next_number: Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"
            />
          </label>
        </div>
        <button
          onClick={saveCompany}
          className="mt-5 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white"
        >
          Salvar configuração de homologação
        </button>
      </div>
    </FiscalShell>
  );
}
