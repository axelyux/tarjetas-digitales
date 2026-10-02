export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const EXTENSIONS: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export type ImageCheck = { ok: true; type: (typeof ALLOWED_IMAGE_TYPES)[number] } | { ok: false; error: string };

/** Valida tamano, tipo declarado y firma real (magic bytes) del archivo. */
export function validateImage(bytes: Uint8Array, declaredType: string): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: "El archivo está vacío" };
  if (bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: "La imagen supera 2 MB" };

  const type = ALLOWED_IMAGE_TYPES.find((t) => t === declaredType);
  if (!type) return { ok: false, error: "Formato no permitido (PNG, JPG, WEBP o SVG)" };

  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));

  if (type === "image/png" && !startsWith([0x89, 0x50, 0x4e, 0x47])) return { ok: false, error: "PNG corrupto" };
  if (type === "image/jpeg" && !startsWith([0xff, 0xd8, 0xff])) return { ok: false, error: "JPG corrupto" };
  if (type === "image/webp" && !(ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP")) {
    return { ok: false, error: "WEBP corrupto" };
  }
  if (type === "image/svg+xml") {
    const text = new TextDecoder().decode(bytes).toLowerCase();
    const looksSvg = text.includes("<svg");
    const dangerous = /<script|on[a-z]+\s*=|javascript:|<foreignobject|<iframe|<!entity/.test(text);
    if (!looksSvg || dangerous) return { ok: false, error: "SVG no permitido (contiene scripts o es inválido)" };
  }
  return { ok: true, type };
}
