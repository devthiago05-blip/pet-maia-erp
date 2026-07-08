"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export function PrescriptionDeleteButton({
  medication,
  onDelete,
}: {
  medication: string;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Excluir ${medication}`}
        title="Excluir prescrição"
        className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
      >
        <Trash2 size={16} />
      </button>
      <ConfirmationDialog
        isOpen={confirming}
        title="Excluir item da receita?"
        description={`O item “${medication}” será removido do prontuário.`}
        confirmText={deleting ? "Excluindo..." : "Excluir item"}
        onCancel={() => !deleting && setConfirming(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
