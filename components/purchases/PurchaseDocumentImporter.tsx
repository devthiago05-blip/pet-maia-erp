"use client";

import { FileSearch, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import {
  findDuplicatePurchaseDocument,
  type PurchaseDocumentFile,
} from "@/services/purchase-recognition";
import type { RecognizedPurchaseDocument } from "@/types/purchase-recognition";

export function PurchaseDocumentImporter({
  onRecognized,
}: {
  onRecognized: (
    document: RecognizedPurchaseDocument,
    source: PurchaseDocumentFile,
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  async function recognize(file?: File) {
    if (!file) return;
    setReading(true);
    try {
      const hashBuffer = await crypto.subtle.digest(
        "SHA-256",
        await file.arrayBuffer(),
      );
      const hash = Array.from(new Uint8Array(hashBuffer), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      const duplicate = await findDuplicatePurchaseDocument(hash);
      if (duplicate.error) throw duplicate.error;
      if (duplicate.data) {
        const area =
          duplicate.data.destination_kind === "pdv" ? "PDV" : "Banho e Tosa";
        throw new Error(
          `Este documento já foi importado em ${area}${duplicate.data.document_number ? ` (nota ${duplicate.data.document_number})` : ""}.`,
        );
      }

      const form = new FormData();
      form.append("file", file);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Entre novamente.");
      const response = await fetch("/api/purchases/recognize", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha na leitura.");
      onRecognized(result, { file, hash });
      toast.success(
        `${result.items.length} item(ns) reconhecido(s). Confira antes de salvar.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o documento.",
      );
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/60 p-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xml,.pdf,.txt,image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => void recognize(event.target.files?.[0])}
        className="hidden"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white p-3 text-[#8A0EEA]">
            {reading ? (
              <FileSearch className="animate-pulse" size={22} />
            ) : (
              <Upload size={22} />
            )}
          </span>
          <div>
            <p className="font-bold">Importar nota ou recibo</p>
            <p className="text-sm text-slate-500">
              XML, PDF ou foto pelo celular · máximo 15 MB
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={reading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl bg-[#8A0EEA] px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {reading ? "Reconhecendo..." : "Selecionar arquivo"}
        </button>
      </div>
    </div>
  );
}
