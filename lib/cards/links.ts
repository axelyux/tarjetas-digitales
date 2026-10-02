export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normaliza un numero a formato internacional para wa.me (default Mexico: 10 digitos -> 52 + n). */
export function normalizeWhatsapp(value: string): string {
  let digits = onlyDigits(value);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 13 && digits.startsWith("521")) return `52${digits.slice(3)}`;
  return digits;
}

export function isValidPhoneNumber(value: string): boolean {
  if (!/^[+\d\s().-]+$/.test(value)) return false;
  const n = onlyDigits(value).length;
  return n >= 8 && n <= 15;
}

export function whatsappLink(whatsapp: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsapp(whatsapp)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(phone: string): string {
  const digits = onlyDigits(phone);
  const hasPlus = phone.trim().startsWith("+");
  return `tel:${hasPlus ? "+" : ""}${digits}`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+([/?#:].*)?$/;

/**
 * Devuelve una URL http(s) segura o null.
 * - "instagram.com/negocio" -> "https://instagram.com/negocio"
 * - cualquier otro esquema (javascript:, data:, vbscript:, file:...) -> null
 */
export function normalizeUrlInput(raw: string): string | null {
  const v = raw.trim();
  if (!v || /\s/.test(v)) return null;
  if (HAS_SCHEME.test(v)) return isHttpUrl(v) ? v : null;
  if (!BARE_DOMAIN.test(v)) return null;
  const candidate = `https://${v}`;
  return isHttpUrl(candidate) ? candidate : null;
}

const HANDLE_REGEX = /^@?[A-Za-z0-9._-]{2,60}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function mapsLinkFromAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Acepta un @usuario o una URL; devuelve URL segura o null. */
export function socialHref(value: string, base: string): string | null {
  const v = value.trim();
  const isHandle = v.startsWith("@") ? HANDLE_REGEX.test(v) : HANDLE_REGEX.test(v) && !BARE_DOMAIN.test(v);
  if (isHandle) return `${base}${v.replace(/^@/, "")}`;
  return normalizeUrlInput(v);
}

/** Maps: URL o direccion escrita. */
export function mapsHref(value: string): string | null {
  const v = value.trim();
  if (v.length < 3) return null;
  const asUrl = normalizeUrlInput(v);
  if (asUrl) return asUrl;
  if (HAS_SCHEME.test(v) && !/\s/.test(v)) return null; // esquema peligroso sin espacios (javascript:...)
  if (/^(javascript|data|vbscript|file):/i.test(v)) return null;
  return mapsLinkFromAddress(v);
}

/** Imágenes de demostración incluidas en la propia app (/demo/*.svg). */
export function isOwnDemoAsset(value: string): boolean {
  return /^\/demo\/[\w.-]+\.(svg|webp|png|jpg)$/.test(value);
}

/** URL de imagen segura: http(s) o un asset de demostración propio. */
export function isImageUrl(value: string): boolean {
  return isOwnDemoAsset(value) || isHttpUrl(value);
}
