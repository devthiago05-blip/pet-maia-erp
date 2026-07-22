"use client";

import { Crop, RotateCcw, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface CropEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const emptyCrop: CropEdges = { top: 0, right: 0, bottom: 0, left: 0 };

export function PurchaseImageEditor({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropEdges>(emptyCrop);
  const [processing, setProcessing] = useState(false);
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function rotate(direction: 1 | -1) {
    setRotation((current) => (current + direction * 90 + 360) % 360);
    setCrop(emptyCrop);
  }

  async function confirm() {
    setProcessing(true);
    try {
      const edited = await transformImage(file, rotation, crop);
      onConfirm(edited);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível ajustar a foto.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ajustar foto da nota
            </h2>
            <p className="text-sm text-slate-500">
              Deixe somente a folha visível e os textos na posição correta.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border p-2 text-slate-500"
            aria-label="Fechar editor"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative flex h-[42dvh] min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Prévia da nota"
              className="max-h-full max-w-full object-contain transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
          <CropShade crop={crop} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => rotate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
          >
            <RotateCcw size={17} /> Girar à esquerda
          </button>
          <button
            type="button"
            onClick={() => rotate(1)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
          >
            <RotateCw size={17} /> Girar à direita
          </button>
          <button
            type="button"
            onClick={() => setCrop(emptyCrop)}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
          >
            <Crop size={17} /> Limpar recorte
          </button>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border bg-slate-50 p-3 sm:grid-cols-2">
          <CropSlider
            label="Cortar acima"
            value={crop.top}
            onChange={(top) => setCrop((current) => ({ ...current, top }))}
          />
          <CropSlider
            label="Cortar abaixo"
            value={crop.bottom}
            onChange={(bottom) =>
              setCrop((current) => ({ ...current, bottom }))
            }
          />
          <CropSlider
            label="Cortar à esquerda"
            value={crop.left}
            onChange={(left) => setCrop((current) => ({ ...current, left }))}
          />
          <CropSlider
            label="Cortar à direita"
            value={crop.right}
            onChange={(right) => setCrop((current) => ({ ...current, right }))}
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2.5 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={() => void confirm()}
            className="rounded-xl bg-[#8A0EEA] px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {processing ? "Preparando..." : "Usar esta foto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CropSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-slate-600">
      <span className="flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={35}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-[#8A0EEA]"
      />
    </label>
  );
}

function CropShade({ crop }: { crop: CropEdges }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-x-0 top-0 bg-black/60"
        style={{ height: `${crop.top}%` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-black/60"
        style={{ height: `${crop.bottom}%` }}
      />
      <div
        className="absolute bottom-0 left-0 top-0 bg-black/60"
        style={{
          width: `${crop.left}%`,
          top: `${crop.top}%`,
          bottom: `${crop.bottom}%`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 top-0 bg-black/60"
        style={{
          width: `${crop.right}%`,
          top: `${crop.top}%`,
          bottom: `${crop.bottom}%`,
        }}
      />
    </div>
  );
}

async function transformImage(file: File, rotation: number, crop: CropEdges) {
  const bitmap = await createImageBitmap(file);
  const sideways = rotation === 90 || rotation === 270;
  const rotatedWidth = sideways ? bitmap.height : bitmap.width;
  const rotatedHeight = sideways ? bitmap.width : bitmap.height;
  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  const context = rotatedCanvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponível");
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  bitmap.close();

  const sourceX = Math.round((crop.left / 100) * rotatedWidth);
  const sourceY = Math.round((crop.top / 100) * rotatedHeight);
  const sourceWidth = Math.max(
    100,
    Math.round(rotatedWidth * (1 - (crop.left + crop.right) / 100)),
  );
  const sourceHeight = Math.max(
    100,
    Math.round(rotatedHeight * (1 - (crop.top + crop.bottom) / 100)),
  );
  const scale = Math.min(1, 1800 / Math.max(sourceWidth, sourceHeight));
  const output = document.createElement("canvas");
  output.width = Math.round(sourceWidth * scale);
  output.height = Math.round(sourceHeight * scale);
  const outputContext = output.getContext("2d");
  if (!outputContext) throw new Error("Canvas indisponível");
  outputContext.drawImage(
    rotatedCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    output.width,
    output.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) =>
    output.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Falha ao gerar imagem")),
      "image/jpeg",
      0.9,
    ),
  );
  const baseName = file.name.replace(/\.[^.]+$/, "") || "nota";
  return new File([blob], `${baseName}-ajustada.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
