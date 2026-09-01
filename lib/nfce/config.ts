import "server-only";

import type {
  NfceConfig,
  NfceDiagnosticItem,
  NfceEnvironment,
} from "@/lib/nfce/types";

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function environment(value: string | undefined): NfceEnvironment {
  if (value === "homologacao" || value === "producao") return value;
  return "mock";
}

export function getNfceConfig(
  env: Record<string, string | undefined> = process.env,
): NfceConfig {
  return {
    enabled: env.NFCE_ENABLED === "true",
    environment: environment(env.NFCE_ENV),
    provider: env.NFCE_PROVIDER === "sefaz" ? "sefaz" : "mock",
    certificateMode: env.NFCE_CERT_MODE === "a1" ? "a1" : "mock",
    certificatePath: env.NFCE_CERT_PATH?.trim() || undefined,
    certificatePassword: env.NFCE_CERT_PASSWORD || undefined,
    cnpj: env.NFCE_CNPJ?.replace(/\D/g, "") || undefined,
    stateRegistration: env.NFCE_IE?.replace(/\D/g, "") || undefined,
    cscId: env.NFCE_CSC_ID?.trim() || undefined,
    cscToken: env.NFCE_CSC_TOKEN || undefined,
    uf: (env.NFCE_UF || "CE").trim().toUpperCase(),
    series: positiveInteger(env.NFCE_SERIE, 1),
    initialNumber: positiveInteger(env.NFCE_INITIAL_NUMBER, 1),
    municipalCode: env.NFCE_MUNICIPAL_CODE?.replace(/\D/g, "") || undefined,
    taxRegime: env.NFCE_TAX_REGIME?.trim() || undefined,
  };
}

export function assertNfceEnvironmentIsSafe(config: NfceConfig) {
  if (config.environment !== "producao") return;

  const missing = [
    ["NFCE_PROVIDER=sefaz", config.provider === "sefaz"],
    ["NFCE_CERT_MODE=a1", config.certificateMode === "a1"],
    ["NFCE_CERT_PATH", Boolean(config.certificatePath)],
    ["NFCE_CERT_PASSWORD", Boolean(config.certificatePassword)],
    ["NFCE_CNPJ", /^\d{14}$/.test(config.cnpj || "")],
    ["NFCE_IE", Boolean(config.stateRegistration)],
    ["NFCE_CSC_ID", Boolean(config.cscId)],
    ["NFCE_CSC_TOKEN", Boolean(config.cscToken)],
    ["NFCE_UF", /^[A-Z]{2}$/.test(config.uf)],
    ["NFCE_MUNICIPAL_CODE", /^\d{7}$/.test(config.municipalCode || "")],
    ["NFCE_TAX_REGIME", Boolean(config.taxRegime)],
    ["FISCAL_SECRETS_KEY", (process.env.FISCAL_SECRETS_KEY?.length || 0) >= 32],
  ].filter(([, ready]) => !ready);

  if (missing.length) {
    throw new Error(
      `Emissão NFC-e em produção bloqueada. Configuração ausente: ${missing
        .map(([name]) => name)
        .join(", ")}.`,
    );
  }
}

export function getNfceDiagnostics(
  config = getNfceConfig(),
): NfceDiagnosticItem[] {
  const mock = config.provider === "mock";
  return [
    {
      key: "environment",
      label: "Ambiente",
      status: config.environment === "producao" ? "error" : "ok",
      detail: config.enabled ? config.environment.toUpperCase() : "DESATIVADO",
    },
    {
      key: "certificate",
      label: "Assinatura",
      status:
        config.certificateMode === "mock" || config.certificatePath
          ? "ok"
          : "not_configured",
      detail: config.certificateMode === "mock" ? "MOCK" : "A1",
    },
    {
      key: "csc",
      label: "CSC",
      status: mock || config.cscId ? "ok" : "not_configured",
      detail: mock ? "MOCK" : "Configurado no servidor",
    },
    {
      key: "sefaz",
      label: "SEFAZ",
      status: mock ? "ok" : "not_configured",
      detail: mock ? "MOCK" : "Adapter oficial ainda desativado",
    },
  ];
}
