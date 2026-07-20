"use client";

import type { IScannerControls } from "@zxing/browser";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScannerModal({ open, onClose, onDetected }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    detectedRef.current = false;
    let cancelled = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled || !videoRef.current) return;
        setError("");
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 120,
          delayBetweenScanSuccess: 700,
        });
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
          videoRef.current,
          (result) => {
            const code = result?.getText().replace(/\D/g, "") || "";
            if (!detectedRef.current && /^\d{8,14}$/.test(code)) {
              detectedRef.current = true;
              controlsRef.current?.stop();
              navigator.vibrate?.(100);
              onDetected(code);
            }
          },
        );
      } catch (cameraError) {
        console.error(cameraError);
        setError("Não foi possível abrir a câmera. Verifique a permissão do navegador e use HTTPS.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetected, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between p-4">
          <div>
            <h3 className="flex items-center gap-2 font-bold"><Camera size={19} /> Ler código de barras</h3>
            <p className="text-sm text-slate-500">Aponte a câmera traseira e mantenha o código dentro do quadro.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar câmera" className="rounded-xl border p-2"><X size={20} /></button>
        </div>
        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-[8%] top-1/2 h-28 -translate-y-1/2 rounded-xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-x-2 top-1/2 h-0.5 bg-red-500" />
          </div>
        </div>
        <div className="p-4">
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : <p className="text-center text-sm text-slate-500">A leitura acontece automaticamente.</p>}
        </div>
      </div>
    </div>
  );
}
