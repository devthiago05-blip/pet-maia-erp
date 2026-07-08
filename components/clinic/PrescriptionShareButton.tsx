"use client";

import { Link, Link2Off } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { setPrescriptionSharing } from "@/services/clinical";
import type { ClinicalPrescriptionDocument } from "@/types/domain";

export function PrescriptionShareButton({
  document,
}: {
  document: ClinicalPrescriptionDocument;
}) {
  const [enabled, setEnabled] = useState(document.share_enabled);
  const [token, setToken] = useState(document.share_token || "");
  const [saving, setSaving] = useState(false);

  async function enableAndCopy() {
    setSaving(true);
    let currentToken = token;

    if (!enabled || !currentToken) {
      const { data, error } = await setPrescriptionSharing(document.id, true);
      if (error || !data?.share_token) {
        setSaving(false);
        toast.error(error?.message || "Não foi possível gerar o link");
        return;
      }
      currentToken = data.share_token;
      setToken(currentToken);
      setEnabled(true);
    }

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/receita/${currentToken}`,
      );
      toast.success("Link da receita copiado");
    } catch {
      toast.error("Não foi possível copiar o link");
    } finally {
      setSaving(false);
    }
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
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={enableAndCopy}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-[#8A0EEA] disabled:opacity-50"
      >
        <Link size={16} />
        {saving ? "Gerando..." : enabled ? "Copiar link" : "Compartilhar"}
      </button>
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
  );
}
