export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const ALLOWED_UPLOAD_TYPES = [...IMAGE_TYPES, "application/pdf"] as const;
export const ALLOWED_IMAGE_TYPES = IMAGE_TYPES;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 8000;
export const MIN_IMAGE_DIMENSION = 16;

export type UploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];

export const EXTENSIONS: Record<UploadType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export type UploadCheck = { ok: true; type: UploadType } | { ok: false; error: string };
export type ImageCheck = UploadCheck;

/** Valida tamaño, tipo declarado y firma real (magic bytes). `allowPdf` solo para botones PDF. */
export function validateUpload(bytes: Uint8Array, declaredType: string, allowPdf = false): UploadCheck {
  if (bytes.length === 0) return { ok: false, error: "El archivo está vacío" };

  const type = ALLOWED_UPLOAD_TYPES.find((t) => t === declaredType);
  if (!type || (type === "application/pdf" && !allowPdf)) {
    return { ok: false, error: allowPdf ? "Formato no permitido (PDF)" : "Formato no permitido (PNG, JPG, WEBP o SVG)" };
  }
  if (allowPdf && type !== "application/pdf") return { ok: false, error: "Solo se permiten archivos PDF" };
  if (type === "application/pdf" ? bytes.length > MAX_PDF_BYTES : bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, error: type === "application/pdf" ? "El PDF supera 5 MB" : "La imagen supera 2 MB" };
  }

  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));

  if (type === "image/png" && !startsWith([0x89, 0x50, 0x4e, 0x47])) return { ok: false, error: "PNG corrupto" };
  if (type === "image/jpeg" && !startsWith([0xff, 0xd8, 0xff])) return { ok: false, error: "JPG corrupto" };
  if (type === "image/webp" && !(ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")) {
    return { ok: false, error: "WEBP corrupto" };
  }
  if (type === "application/pdf" && ascii(0, 5) !== "%PDF-") return { ok: false, error: "PDF corrupto" };
  if (type === "image/svg+xml") {
    const text = new TextDecoder().decode(bytes).toLowerCase();
    const looksSvg = text.includes("<svg");
    const dangerous = /<script|on[a-z]+\s*=|javascript:|<foreignobject|<iframe|<!entity/.test(text);
    if (!looksSvg || dangerous) return { ok: false, error: "SVG no permitido (contiene scripts o es inválido)" };
  }
  return { ok: true, type };
}

/** Compatibilidad: valida solo imágenes. */
export function validateImage(bytes: Uint8Array, declaredType: string): UploadCheck {
  return validateUpload(bytes, declaredType, false);
}

/** La extensión del nombre debe coincidir con el tipo declarado. */
export function extensionMatches(fileName: string, type: UploadType): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const expected = EXTENSIONS[type];
  return ext === expected || (type === "image/jpeg" && ext === "jpeg");
}
