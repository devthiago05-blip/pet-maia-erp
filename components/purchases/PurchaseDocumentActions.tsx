"use client";

import { Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { XmlPurchaseViewer } from "@/components/purchases/XmlPurchaseViewer";
import { createPurchaseDocumentUrl } from "@/services/purchase-recognition";
import type { PurchaseDocumentArchive } from "@/types/purchase-recognition";

export function PurchaseDocumentActions({
  document,
}: {
  document?: PurchaseDocumentArchive;
}) {
  const [opening, setOpening] = useState(false);
  const [xmlOpen, setXmlOpen] = useState(false);

  if (!document) {
    return <span className="text-xs text-slate-400">Sem arquivo</span>;
  }

  async function openDocument(download: boolean) {
    const isXml =
      document!.mime_type.includes("xml") ||
      document!.original_name.toLowerCase().endsWith(".xml");
    if (!download && isXml) {
      setXmlOpen(true);
      return;
    }
    setOpening(true);
    const previewWindow = download ? null : window.open("", "_blank");
    const response = await createPurchaseDocumentUrl(document!, download);
    setOpening(false);

    if (response.error || !response.data?.signedUrl) {
      previewWindow?.close();
      toast.error("Não foi possível abrir o documento.");
      return;
    }

    if (download) {
      const link = window.document.createElement("a");
      link.href = response.data.signedUrl;
      link.download = document!.original_name;
      link.click();
    } else if (previewWindow) {
      previewWindow.location.href = response.data.signedUrl;
    } else {
      window.location.href = response.data.signedUrl;
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <span
          className="mr-1 inline-flex max-w-32 items-center gap-1 truncate text-xs text-slate-500"
          title={document.original_name}
        >
          <FileText size={14} className="shrink-0" />
          {document.original_name}
        </span>
        <button
          type="button"
          disabled={opening}
          onClick={() => void openDocument(false)}
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          title="Visualizar documento"
        >
          <Eye size={14} />
          Ver
        </button>
        <button
          type="button"
          disabled={opening}
          onClick={() => void openDocument(true)}
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold text-[#8A0EEA] hover:bg-purple-50 disabled:opacity-50"
          title="Baixar documento"
        >
          <Download size={14} />
          Baixar
        </button>
      </div>
      {xmlOpen && (
        <XmlPurchaseViewer
          document={document}
          onClose={() => setXmlOpen(false)}
        />
      )}
    </>
  );
}
