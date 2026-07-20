"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  FileKey2,
  ShieldCheck,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
import {
  deleteFiscalCredentials,
  fetchFiscalCredentialStatus,
  type FiscalCredentialStatus,
  saveFiscalCredentials,
} from "@/services/fiscal-config";
import {
  fetchClinicSettings,
  updateClinicSettings,
  updateProfessionalProfile,
} from "@/services/settings";
import type { ClinicSettings } from "@/types/domain";

const initialSettings: ClinicSettings = {
  id: 1,
  nome: "PET MAIA ERP",
  razao_social: "",
  cnpj: "",
  telefone: "",
  endereco: "",
  pix_key: "",
  pix_recipient_name: "",
  pix_city: "",
  inscricao_estadual: "",
  uf: "CE",
  codigo_municipio_ibge: "2304400",
  regime_tributario: "",
  fiscal_environment: "homologacao",
  nfce_series: 1,
  nfce_next_number: 1,
};

export default function SettingsPage() {
  const { profile } = useAccess();
  const [settings, setSettings] = useState<ClinicSettings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [crmv, setCrmv] = useState(profile?.crmv || "");
  const [especialidade, setEspecialidade] = useState(
    profile?.especialidade || "",
  );
  const [crmvState, setCrmvState] = useState(profile?.crmv_state || "");
  const [mapaRegistration, setMapaRegistration] = useState(
    profile?.mapa_registration || "",
  );
  const [signatureText, setSignatureText] = useState(
    profile?.signature_text || profile?.nome || "",
  );
  const [savingProfessional, setSavingProfessional] = useState(false);
  const [fiscalStatus, setFiscalStatus] = useState<FiscalCredentialStatus>({
    configured: false,
    certificateName: null,
    certificateExpiresAt: null,
    certificateSubject: null,
    cscId: null,
    configuredAt: null,
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [csc, setCsc] = useState("");
  const [cscId, setCscId] = useState("");
  const [savingFiscal, setSavingFiscal] = useState(false);

  async function loadSettings() {
    setLoading(true);
    setLoadError("");

    const { data, error } = await fetchClinicSettings();

    if (error) {
      console.error(error);
      setLoadError(
        "Não foi possível carregar as configurações. Verifique se o script 002_clinic_settings.sql foi executado.",
      );
      setLoading(false);
      return;
    }

    setSettings(data as ClinicSettings);
    setLoading(false);
  }

  async function loadFiscalStatus() {
    try {
      setFiscalStatus(await fetchFiscalCredentialStatus());
    } catch (error) {
      console.error(error);
    }
  }

  useMountEffect(() => {
    loadSettings();
    if (profile?.is_admin) {
      loadFiscalStatus();
    }
  });

  function updateField(field: keyof ClinicSettings, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    if (!profile?.is_admin) {
      toast.error("Somente administradores podem alterar as configurações");
      return;
    }

    if (!settings.nome.trim()) {
      toast.error("Informe o nome da clínica");
      return;
    }

    setSaving(true);
    const { error } = await updateClinicSettings(settings);
    setSaving(false);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    toast.success("Configurações salvas com sucesso!");
    await loadSettings();
  }

  async function handleSaveProfessional() {
    setSavingProfessional(true);
    const { error } = await updateProfessionalProfile({
      crmv,
      especialidade,
      crmvState,
      mapaRegistration,
      signatureText,
    });
    setSavingProfessional(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Perfil profissional atualizado!");
  }

  async function handleSaveFiscalCredentials() {
    if (!certificateFile) {
      toast.error("Selecione o certificado digital A1 (.pfx ou .p12)");
      return;
    }

    const formData = new FormData();
    formData.set("certificate", certificateFile);
    formData.set("certificatePassword", certificatePassword);
    formData.set("csc", csc);
    formData.set("cscId", cscId);

    setSavingFiscal(true);
    try {
      const status = await saveFiscalCredentials(formData);
      setFiscalStatus(status);
      setCertificateFile(null);
      setCertificatePassword("");
      setCsc("");
      setCscId("");
      toast.success("Certificado e CSC salvos com segurança!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro fiscal");
    } finally {
      setSavingFiscal(false);
    }
  }

  async function handleDeleteFiscalCredentials() {
    setSavingFiscal(true);
    try {
      setFiscalStatus(await deleteFiscalCredentials());
      toast.success("Credenciais fiscais removidas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro fiscal");
    } finally {
      setSavingFiscal(false);
    }
  }

  const readOnly = !profile?.is_admin || loading;

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-slate-50">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-50">
        <Header />

        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#8A0EEA] sm:text-3xl">
                Configurações
              </h1>
              <p className="text-slate-500">
                Dados da clínica, recibos e pagamentos PIX
              </p>
            </div>

            {profile?.is_admin && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full rounded-xl bg-[#8A0EEA] px-5 py-2 text-white disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Salvando..." : "Salvar configurações"}
              </button>
            )}
          </div>

          {profile?.is_admin && (
          <SettingsSection
            icon={<FileKey2 size={22} />}
            title="NFC-e (cupom fiscal)"
            description="Configuração segura para emissão da NFC-e modelo 65 no Ceará. Comece em homologação."
          >
            <a
              href="/manual-configuracao-nfce-pet-maia.pdf"
              download
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 font-semibold text-[#8A0EEA]"
            >
              <Download size={18} /> Baixar manual de configuração (PDF)
            </a>
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsInput
                  label="Inscrição estadual"
                  value={settings.inscricao_estadual || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("inscricao_estadual", value)}
                />
                <SettingsInput
                  label="UF"
                  value={settings.uf || "CE"}
                  readOnly={readOnly}
                  onChange={(value) => updateField("uf", value.toUpperCase())}
                />
                <SettingsInput
                  label="Código IBGE do município"
                  value={settings.codigo_municipio_ibge || ""}
                  readOnly={readOnly}
                  onChange={(value) =>
                    updateField("codigo_municipio_ibge", value)
                  }
                />
                <label className="grid gap-2 text-sm font-medium">
                  Regime tributário
                  <select
                    value={settings.regime_tributario || ""}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateField("regime_tributario", event.target.value)
                    }
                    className="rounded-xl border bg-white p-3 font-normal disabled:bg-slate-50"
                  >
                    <option value="">Selecione</option>
                    <option value="1">Simples Nacional</option>
                    <option value="2">Simples Nacional - excesso</option>
                    <option value="3">Regime normal</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Ambiente
                  <select
                    value={settings.fiscal_environment || "homologacao"}
                    disabled={readOnly}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        fiscal_environment: event.target.value as
                          | "homologacao"
                          | "producao",
                      }))
                    }
                    className="rounded-xl border bg-white p-3 font-normal disabled:bg-slate-50"
                  >
                    <option value="homologacao">Homologação (testes)</option>
                    <option value="producao">Produção</option>
                  </select>
                </label>
                <SettingsInput
                  label="Série NFC-e"
                  value={String(settings.nfce_series || 1)}
                  readOnly={readOnly}
                  onChange={(value) =>
                    setSettings((current) => ({
                      ...current,
                      nfce_series: Number(value),
                    }))
                  }
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Certificado e CSC
                    </h3>
                    <p className="text-sm text-slate-500">
                      Arquivos disponíveis somente no servidor administrativo.
                    </p>
                  </div>
                  {fiscalStatus.configured && (
                    <CheckCircle2 className="text-emerald-600" size={24} />
                  )}
                </div>

                {fiscalStatus.configured ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-white p-3 text-sm">
                      <p className="font-semibold text-slate-900">
                        {fiscalStatus.certificateSubject}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {fiscalStatus.certificateName} · CSC ID {fiscalStatus.cscId}
                      </p>
                      {fiscalStatus.certificateExpiresAt && (
                        <p className="mt-1 text-slate-500">
                          Validade: {new Date(fiscalStatus.certificateExpiresAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteFiscalCredentials}
                      disabled={savingFiscal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={17} /> Remover e substituir
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    <label className="grid gap-1 text-sm font-medium">
                      Certificado A1 (.pfx ou .p12)
                      <input
                        type="file"
                        accept=".pfx,.p12,application/x-pkcs12"
                        disabled={readOnly || savingFiscal}
                        onChange={(event) =>
                          setCertificateFile(event.target.files?.[0] || null)
                        }
                        className="rounded-xl border bg-white p-3 font-normal"
                      />
                    </label>
                    <SettingsInput
                      label="Senha do certificado"
                      value={certificatePassword}
                      readOnly={readOnly || savingFiscal}
                      onChange={setCertificatePassword}
                      type="password"
                    />
                    <SettingsInput
                      label="CSC"
                      value={csc}
                      readOnly={readOnly || savingFiscal}
                      onChange={setCsc}
                      type="password"
                    />
                    <SettingsInput
                      label="CSC ID"
                      value={cscId}
                      readOnly={readOnly || savingFiscal}
                      onChange={setCscId}
                    />
                    <button
                      type="button"
                      onClick={handleSaveFiscalCredentials}
                      disabled={readOnly || savingFiscal}
                      className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {savingFiscal ? "Validando..." : "Validar e salvar credenciais"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <FiscalReadiness settings={settings} status={fiscalStatus} />
          </SettingsSection>
          )}

          {loadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {loadError}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <SettingsSection
              icon={<Building2 size={22} />}
              title="Dados da clínica"
              description="Informações exibidas nos recibos e relatórios."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsInput
                  label="Nome da clínica"
                  value={settings.nome}
                  readOnly={readOnly}
                  onChange={(value) => updateField("nome", value)}
                />
                <SettingsInput
                  label="Razão social"
                  value={settings.razao_social || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("razao_social", value)}
                />
                <SettingsInput
                  label="CNPJ"
                  value={settings.cnpj || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("cnpj", value)}
                />
                <SettingsInput
                  label="Telefone"
                  value={settings.telefone || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("telefone", value)}
                />
                <div className="sm:col-span-2">
                  <SettingsInput
                    label="Endereço"
                    value={settings.endereco || ""}
                    readOnly={readOnly}
                    onChange={(value) => updateField("endereco", value)}
                  />
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={<CreditCard size={22} />}
              title="Pagamento PIX"
              description="Dados utilizados para gerar o QR Code de cobrança."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <SettingsInput
                    label="Chave PIX"
                    value={settings.pix_key || ""}
                    readOnly={readOnly}
                    onChange={(value) => updateField("pix_key", value)}
                  />
                </div>
                <SettingsInput
                  label="Nome do beneficiário"
                  value={settings.pix_recipient_name || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("pix_recipient_name", value)}
                />
                <SettingsInput
                  label="Cidade do beneficiário"
                  value={settings.pix_city || ""}
                  readOnly={readOnly}
                  onChange={(value) => updateField("pix_city", value)}
                />
              </div>
            </SettingsSection>
          </div>

          <SettingsSection
            icon={<Stethoscope size={22} />}
            title="Perfil profissional"
            description="Identificação exibida em receitas e documentos clínicos."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SettingsInput
                label="CRMV"
                value={crmv}
                readOnly={false}
                onChange={setCrmv}
              />
              <SettingsInput
                label="UF do CRMV"
                value={crmvState}
                readOnly={false}
                onChange={setCrmvState}
              />
              <SettingsInput
                label="Especialidade"
                value={especialidade}
                readOnly={false}
                onChange={setEspecialidade}
              />
              <SettingsInput
                label="Registro MAPA"
                value={mapaRegistration}
                readOnly={false}
                onChange={setMapaRegistration}
              />
              <div className="sm:col-span-2">
                <SettingsInput
                  label="Texto da assinatura eletrônica"
                  value={signatureText}
                  readOnly={false}
                  onChange={setSignatureText}
                />
              </div>
              <button
                type="button"
                onClick={handleSaveProfessional}
                disabled={savingProfessional}
                className="rounded-xl bg-[#8A0EEA] px-5 py-3 text-white disabled:opacity-60 sm:col-span-2 sm:justify-self-end"
              >
                {savingProfessional ? "Salvando..." : "Salvar perfil"}
              </button>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={<ShieldCheck size={22} />}
            title="Acesso"
            description={
              profile?.is_admin
                ? "Você possui acesso administrativo para editar estas informações."
                : "Seu perfil possui acesso somente para consulta."
            }
          />
        </div>
      </main>
    </div>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA]">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

function SettingsInput({
  label,
  value,
  readOnly,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  type?: "text" | "password";
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border bg-white p-3 font-normal read-only:bg-slate-50 read-only:text-slate-500"
      />
    </label>
  );
}

function FiscalReadiness({
  settings,
  status,
}: {
  settings: ClinicSettings;
  status: FiscalCredentialStatus;
}) {
  const requirements = [
    ["CNPJ", Boolean(settings.cnpj?.trim())],
    ["Inscrição estadual", Boolean(settings.inscricao_estadual?.trim())],
    ["UF e município IBGE", Boolean(settings.uf && settings.codigo_municipio_ibge)],
    ["Regime tributário", Boolean(settings.regime_tributario)],
    ["Certificado A1 e CSC", status.configured],
  ] as const;
  const ready = requirements.every(([, complete]) => complete);

  return (
    <div
      className={`mt-5 rounded-2xl border p-4 ${
        ready
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {ready ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={20} />
        ) : (
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={20} />
        )}
        <div>
          <p className="font-bold">
            {ready
              ? "Configuração básica pronta para homologação"
              : "Complete os dados antes dos testes de emissão"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {requirements.map(([label, complete]) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  complete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-white text-amber-800"
                }`}
              >
                {complete ? "✓" : "○"} {label}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs opacity-75">
            A emissão só será liberada após cadastrar também NCM e tributação dos produtos e validar uma NFC-e no ambiente de homologação.
          </p>
        </div>
      </div>
    </div>
  );
}
