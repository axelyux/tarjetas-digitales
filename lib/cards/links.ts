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

function handleOf(value: string): string {
  return value.trim().replace(/^@/, "").replace(/\/+$/, "");
}

/** Acepta "@usuario", "usuario" o una URL completa. */
export function normalizeInstagram(value: string): string {
  const v = value.trim();
  if (isHttpUrl(v)) return v;
  return `https://instagram.com/${handleOf(v)}`;
}

export function normalizeFacebook(value: string): string {
  const v = value.trim();
  if (isHttpUrl(v)) return v;
  return `https://facebook.com/${handleOf(v)}`;
}

const HANDLE_REGEX = /^@?[A-Za-z0-9._-]{2,60}$/;
export function isSocialInput(value: string): boolean {
  return isHttpUrl(value) || HANDLE_REGEX.test(value);
}

export function mapsLinkFromAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
