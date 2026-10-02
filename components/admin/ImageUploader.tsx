"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { uploadCardAsset } from "@/lib/cards/actions";
import { prepareImage } from "@/lib/image-resize";
import { ALLOWED_IMAGE_TYPES } from "@/lib/cards/upload-validation";

type Props = {
  cardId: string;
  kind: "logo" | "cover" | "background";
  label: string;
  value: string;
  onChange: (url: string) => void;
  maxDimension?: number;
};

const RAW_LIMIT = 15 * 1024 * 1024;

export function ImageUploader({ cardId, kind, label, value, onChange, maxDimension = 1600 }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError("Formato no permitido (PNG, JPG, WEBP o SVG)");
      return;
    }
    if (file.size > RAW_LIMIT) {
      setError("El archivo es demasiado grande (máx. 15 MB)");
      return;
    }
    setBusy(true);
    try {
      const prepared = await prepareImage(file, maxDimension);
      const formData = new FormData();
      formData.set("cardId", cardId);
      formData.set("kind", kind);
      formData.set("file", prepared);
      const result = await uploadCardAsset(formData);
      if (result.ok) onChange(result.data.url);
      else setError(result.error);
    } catch {
      setError("No se pudo subir la imagen");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium" id={`${inputId}-label`}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-paper">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview de una URL ya subida
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-muted" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="sr-only"
            aria-labelledby={`${inputId}-label`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
            {busy ? "Subiendo..." : value ? "Cambiar" : "Subir imagen"}
          </button>
          {value && !busy ? (
            <button type="button" className="btn btn-sm" onClick={() => onChange("")} aria-label={`Quitar ${label}`}>
              <X size={14} aria-hidden="true" /> Quitar
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted">PNG, JPG, WEBP o SVG. Se optimiza automáticamente.</p>
      )}
    </div>
  );
}
