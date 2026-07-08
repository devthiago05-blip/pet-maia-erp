"use client";

import { Building2, CreditCard, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAccess } from "@/components/auth/AccessContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useMountEffect } from "@/hooks/useMountEffect";
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

  useMountEffect(() => {
    loadSettings();
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
}: {
  label: string;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border bg-white p-3 font-normal read-only:bg-slate-50 read-only:text-slate-500"
      />
    </label>
  );
}
