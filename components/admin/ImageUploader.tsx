"use client";

import { FileText, ImagePlus, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { uploadCardAsset } from "@/lib/cards/actions";
import { prepareImage } from "@/lib/image-resize";
import {
  ALLOWED_IMAGE_TYPES, MAX_IMAGE_DIMENSION, MAX_PDF_BYTES, MIN_IMAGE_DIMENSION,
} from "@/lib/cards/upload-validation";

type Kind = "logo" | "cover" | "background" | "pdf";

type Props = {
  cardId: string;
  kind: Kind;
  label: string;
  value: string;
  /** `ratio` (ancho/alto) solo para imágenes. */
  onChange: (url: string, ratio?: number) => void;
  maxDimension?: number;
  /** Solo botón (sin miniatura), para PDF dentro de una acción. */
  compact?: boolean;
};

const RAW_LIMIT = 15 * 1024 * 1024;

export function ImageUploader({ cardId, kind, label, value, onChange, maxDimension = 1600, compact = false }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPdf = kind === "pdf";

  async function handleFile(file: File) {
    setError(null);
    if (isPdf) {
      if (file.type !== "application/pdf") return setError("Solo se permiten archivos PDF");
      if (file.size > MAX_PDF_BYTES) return setError("El PDF supera 5 MB");
    } else {
      if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
        return setError("Formato no permitido (PNG, JPG, WEBP o SVG)");
      }
      if (file.size > RAW_LIMIT) return setError("El archivo es demasiado grande (máx. 15 MB)");
    }

    setBusy(true);
    try {
      let upload = file;
      let ratio: number | undefined;
      if (!isPdf) {
        const bitmap = await createImageBitmap(file).catch(() => null);
        if (!bitmap) throw new Error("invalid-image");
        const { width, height } = bitmap;
        bitmap.close();
        if (Math.min(width, height) < MIN_IMAGE_DIMENSION) throw new Error("small");
        if (Math.max(width, height) > MAX_IMAGE_DIMENSION) throw new Error("large");
        ratio = width / height;
        upload = await prepareImage(file, maxDimension);
      }
      const formData = new FormData();
      formData.set("cardId", cardId);
      formData.set("kind", kind);
      formData.set("file", upload);
      const result = await uploadCardAsset(formData);
      if (result.ok) onChange(result.data.url, ratio);
      else setError(result.error);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(
        code === "small" ? "La imagen es demasiado pequeña."
        : code === "large" ? "La imagen es demasiado grande (máx. 8000 px)."
        : code === "invalid-image" ? "El archivo no es una imagen válida."
        : "No se pudo subir el archivo. Intenta nuevamente.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={isPdf ? "application/pdf" : ALLOWED_IMAGE_TYPES.join(",")}
      className="sr-only"
      aria-label={label}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) void handleFile(file);
      }}
    />
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        {input}
        <button type="button" className="btn btn-sm self-start" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <FileText size={14} aria-hidden="true" />}
          {busy ? "Subiendo..." : label}
        </button>
        {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-paper">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview de una URL ya subida
            <img src={value} alt="" className="size-full object-contain" />
          ) : (
            <ImagePlus size={20} className="text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {input}
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
            {busy ? "Subiendo..." : value ? "Cambiar" : "Subir imagen"}
          </button>
          {value && !busy ? (
            <button type="button" className="btn btn-sm" onClick={() => onChange("", 1)} aria-label={`Quitar ${label}`}>
              <X size={14} aria-hidden="true" /> Quitar
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          No se pudo subir la imagen. {error}
        </p>
      ) : (
        <p className="text-xs text-muted">PNG, JPG, WEBP o SVG. Se optimiza automáticamente; se respeta la transparencia.</p>
      )}
    </div>
  );
}
