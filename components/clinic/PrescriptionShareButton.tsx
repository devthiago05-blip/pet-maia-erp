"use client";

import {
  ChevronDown,
  History,
  Link,
  Link2Off,
  RotateCcw,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getPrescriptionDocumentRuleSummary } from "@/lib/prescription-document-rules";
import {
  rotatePrescriptionShareToken,
  setPrescriptionSharing,
} from "@/services/clinical";
import type { ClinicalPrescriptionDocument } from "@/types/domain";

export function PrescriptionShareButton({
  document,
  onChanged,
}: {
  document: ClinicalPrescriptionDocument;
  onChanged?: () => Promise<void>;
}) {
  const [enabled, setEnabled] = useState(document.share_enabled);
  const [token, setToken] = useState(document.share_token || "");
  const [saving, setSaving] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reissueReason, setReissueReason] = useState("");
  const [reissueCount, setReissueCount] = useState(document.reissue_count || 0);
  const [lastReissuedAt, setLastReissuedAt] = useState(
    document.last_reissued_at || "",
  );
  const missingProfessionalData =
    !document.professional_name?.trim() || !document.professional_crmv?.trim();
  const ruleSummary = getPrescriptionDocumentRuleSummary({
    document,
    prescriptions: document.clinical_prescriptions || [],
  });
  const disabledReason =
    document.status !== "emitida"
      ? "Emita a receita antes de compartilhar"
      : missingProfessionalData
        ? "Informe o profissional e CRMV antes de compartilhar"
        : ruleSummary.critical[0] || "";
  const canRotate = enabled && token && !disabledReason;
  const lastReissue = document.clinical_prescription_reissues
    ?.slice()
    .sort((a, b) => b.reissued_at.localeCompare(a.reissued_at))[0];
  const reissues = document.clinical_prescription_reissues
    ?.slice()
    .sort((a, b) => b.reissued_at.localeCompare(a.reissued_at));

  async function copyLink(currentToken: string) {
    await navigator.clipboard.writeText(
      `${window.location.origin}/receita/${currentToken}`,
    );
  }

  async function enableAndCopy() {
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }

    setSaving(true);
    let currentToken = token;

    if (!enabled || !currentToken) {
      const { data, error } = await setPrescriptionSharing(document.id, true);
      if (error || !data?.share_token) {
        setSaving(false);
        toast.error(error?.message || "Nao foi possivel gerar o link");
        return;
      }
      currentToken = data.share_token;
      setToken(currentToken);
      setEnabled(true);
      await onChanged?.();
    }

    try {
      await copyLink(currentToken);
      toast.success("Link da receita copiado");
    } catch {
      toast.error("Nao foi possivel copiar o link");
    } finally {
      setSaving(false);
    }
  }

  async function reissueAndCopy() {
    if (!canRotate) {
      toast.error("Gere o link da receita antes de reemitir");
      return;
    }

    setSaving(true);
    const { data, error } = await rotatePrescriptionShareToken(
      document.id,
      reissueReason,
    );

    if (error || !data?.share_token) {
      setSaving(false);
      toast.error(error?.message || "Nao foi possivel reemitir o link");
      return;
    }

    setToken(data.share_token);
    setEnabled(true);
    setReissueCount(data.reissue_count);
    setLastReissuedAt(data.last_reissued_at || "");
    setReissueReason("");
    setReissueOpen(false);

    try {
      await copyLink(data.share_token);
      toast.success("Novo link da receita copiado");
    } catch {
      toast.success("Link reemitido. Copie novamente pelo botao.");
    } finally {
      setSaving(false);
    }

    await onChanged?.();
  }

  async function disableSharing() {
    setSaving(true);
    const { error } = await setPrescriptionSharing(document.id, false);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEnabled(false);
    toast.success("Compartilhamento desativado");
    await onChanged?.();
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={enableAndCopy}
            disabled={saving || Boolean(disabledReason)}
            title={disabledReason || undefined}
            className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[#8A0EEA] disabled:opacity-50"
          >
            <Link size={16} />
            {saving ? "Gerando..." : enabled ? "Copiar link" : "Compartilhar"}
          </button>
          {enabled && (
            <button
              type="button"
              onClick={() => setReissueOpen(true)}
              disabled={saving || !canRotate}
              aria-label="Reemitir link da receita"
              title="Reemitir link da receita"
              className="rounded-lg border p-2 text-[#8A0EEA] hover:bg-purple-50 disabled:opacity-50"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {Boolean(reissues?.length) && (
            <button
              type="button"
              onClick={() => setHistoryOpen((current) => !current)}
              aria-expanded={historyOpen}
              aria-label="Ver historico de reemissoes"
              title="Ver historico de reemissoes"
              className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50"
            >
              <History size={16} />
            </button>
          )}
          {enabled && (
            <button
              type="button"
              onClick={disableSharing}
              disabled={saving}
              aria-label="Desativar compartilhamento"
              title="Desativar compartilhamento"
              className="rounded-lg border p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <Link2Off size={16} />
            </button>
          )}
        </div>
        {(reissueCount > 0 || lastReissue) && (
          <p className="text-[11px] text-slate-500">
            {reissueCount} {reissueCount === 1 ? "reemissao" : "reemissoes"}
            {lastReissuedAt
              ? ` - ultima em ${new Date(lastReissuedAt).toLocaleDateString("pt-BR")}`
              : ""}
            {lastReissue?.reason ? ` - ${lastReissue.reason}` : ""}
          </p>
        )}
        {historyOpen && Boolean(reissues?.length) && (
          <div className="rounded-lg border bg-white p-3 text-xs shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-700">
                Historico de reemissoes
              </p>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Recolher historico"
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {reissues?.map((reissue, index) => (
                <div
                  key={reissue.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-700">
                      Reemissao #{reissues.length - index}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(reissue.reissued_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <p className="mt-1 text-slate-600">
                    {reissue.reason || "Sem motivo informado"}
                  </p>
                  <p className="mt-1 break-all text-[11px] text-slate-400">
                    Token: {formatToken(reissue.previous_share_token)} para{" "}
                    {formatToken(reissue.new_share_token)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {reissueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-bold">Reemitir link da receita</h3>
                <p className="mt-1 text-xs text-slate-500">
                  O link antigo deixara de abrir a receita.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReissueOpen(false)}
                aria-label="Fechar reemissao"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <label className="grid gap-2 text-sm font-medium">
                Motivo da reemissao
                <textarea
                  rows={3}
                  value={reissueReason}
                  onChange={(event) => setReissueReason(event.target.value)}
                  placeholder="Ex.: tutor solicitou novo envio"
                  className="resize-y rounded-lg border p-3 font-normal"
                />
              </label>
            </div>
            <div className="grid gap-3 border-t p-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setReissueOpen(false)}
                className="rounded-lg border py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={reissueAndCopy}
                disabled={saving}
                className="rounded-lg bg-[#8A0EEA] py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Reemitindo..." : "Reemitir e copiar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatToken(token?: string) {
  if (!token) return "sem token anterior";
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}
