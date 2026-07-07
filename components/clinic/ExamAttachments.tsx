"use client";

import { Eye, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  createClinicalAttachmentUrl,
  deleteClinicalAttachment,
  fetchClinicalAttachments,
  uploadClinicalAttachment,
} from "@/services/clinical";
import type { ClinicalAttachment } from "@/types/domain";

const acceptedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const maxFileSize = 10 * 1024 * 1024;

export function ExamAttachments({
  petId,
  examId,
}: {
  petId: number;
  examId: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] =
    useState<ClinicalAttachment | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAttachments() {
      const { data, error } = await fetchClinicalAttachments(examId);

      if (!active) {
        return;
      }

      if (error) {
        console.error(error);
      } else {
        setAttachments(data || []);
      }

      setLoading(false);
    }

    loadAttachments();

    return () => {
      active = false;
    };
  }, [examId]);

  async function handleUpload(file?: File) {
    if (!file) {
      return;
    }

    if (!acceptedTypes.includes(file.type)) {
      toast.error("Envie um arquivo PDF, JPG, PNG ou WebP.");
      return;
    }

    if (file.size > maxFileSize) {
      toast.error("O arquivo deve ter no máximo 10 MB.");
      return;
    }

    setUploading(true);
    const { data, error } = await uploadClinicalAttachment({
      petId,
      examId,
      file,
    });
    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    if (error || !data) {
      toast.error(error?.message || "Não foi possível enviar o arquivo.");
      return;
    }

    setAttachments((current) => [data, ...current]);
    toast.success("Arquivo anexado ao exame!");
  }

  async function handleOpen(attachment: ClinicalAttachment) {
    const { data, error } = await createClinicalAttachmentUrl(
      attachment.storage_path,
    );

    if (error || !data?.signedUrl) {
      toast.error("Não foi possível abrir o arquivo.");
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDelete() {
    if (!attachmentToDelete) {
      return;
    }

    const attachment = attachmentToDelete;
    setAttachmentToDelete(null);
    const { error } = await deleteClinicalAttachment(attachment);

    if (error) {
      toast.error(error.message);
      return;
    }

    setAttachments((current) =>
      current.filter((item) => item.id !== attachment.id),
    );
    toast.success("Anexo excluído.");
  }

  return (
    <div className="border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Paperclip size={16} className="text-[#8A0EEA]" />
          <h5 className="text-sm font-semibold">Anexos</h5>
          {!loading && (
            <span className="text-xs text-slate-500">{attachments.length}</span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => void handleUpload(event.target.files?.[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-[#8A0EEA] disabled:opacity-50"
        >
          <Upload size={15} />
          {uploading ? "Enviando..." : "Anexar arquivo"}
        </button>
      </div>

      {!loading && attachments.length > 0 && (
        <div className="mt-3 divide-y rounded-lg border">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={17} className="shrink-0 text-slate-400" />
                <span className="truncate text-sm">{attachment.file_name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => void handleOpen(attachment)}
                  aria-label={`Abrir ${attachment.file_name}`}
                  className="rounded-lg p-2 text-[#8A0EEA] hover:bg-purple-50"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentToDelete(attachment)}
                  aria-label={`Excluir ${attachment.file_name}`}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(attachmentToDelete)}
        title="Excluir anexo"
        description={`Deseja excluir ${attachmentToDelete?.file_name || "este arquivo"}?`}
        confirmText="Excluir"
        onCancel={() => setAttachmentToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
