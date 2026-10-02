import type { ActionType, ButtonIcon } from "./constants";
import {
  isEmail, isValidPhoneNumber, mapsHref, normalizeUrlInput, socialHref, telLink, whatsappLink,
} from "./links";

export type ActionIconKey = ActionType | ButtonIcon | "map" | "booking" | "website";

export type ActionConfig = {
  /** Nombre en el panel y etiqueta por defecto en la tarjeta. */
  label: string;
  icon: ActionIconKey;
  placeholder: string;
  hint?: string;
  /** Se muestra en la fila de redes (iconos) y no en la lista principal. */
  social: boolean;
  /** El cliente decide el texto del boton. */
  labelRequired: boolean;
  /** Permite elegir icono manualmente. */
  customIcon: boolean;
  invalidMessage: string;
};

export const ACTION_CONFIG: Record<ActionType, ActionConfig> = {
  whatsapp: { label: "WhatsApp", icon: "whatsapp", placeholder: "55 1234 5678", hint: "10 dígitos; se agrega el código de México (52).", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa un número válido (8 a 15 dígitos)." },
  phone: { label: "Llamar", icon: "phone", placeholder: "55 1234 5678", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa un teléfono válido (8 a 15 dígitos)." },
  email: { label: "Correo", icon: "mail", placeholder: "contacto@negocio.com", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa un correo válido." },
  instagram: { label: "Instagram", icon: "instagram", placeholder: "@negocio o instagram.com/negocio", social: true, labelRequired: false, customIcon: false, invalidMessage: "Usa @usuario o una URL válida." },
  facebook: { label: "Facebook", icon: "facebook", placeholder: "negocio o facebook.com/negocio", social: true, labelRequired: false, customIcon: false, invalidMessage: "Usa el nombre de la página o una URL válida." },
  maps: { label: "Cómo llegar", icon: "map", placeholder: "Enlace de Google Maps o dirección", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa un enlace de Maps o una dirección." },
  website: { label: "Sitio web", icon: "website", placeholder: "https://minegocio.com", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa una URL válida." },
  booking: { label: "Agendar cita", icon: "booking", placeholder: "https://calendly.com/...", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa una URL válida." },
  custom_url: { label: "Enlace personalizado", icon: "link", placeholder: "https://...", hint: "Menú, tienda, Mercado Libre, formulario... cualquier enlace.", social: false, labelRequired: true, customIcon: true, invalidMessage: "Ingresa una URL válida." },
  pdf: { label: "Descargar PDF", icon: "file-text", placeholder: "https://... o sube un PDF", social: false, labelRequired: false, customIcon: false, invalidMessage: "Ingresa una URL válida o sube un PDF." },
  catalog: { label: "Ver catálogo", icon: "book-open", placeholder: "https://...", social: false, labelRequired: false, customIcon: true, invalidMessage: "Ingresa una URL válida." },
  youtube: { label: "YouTube", icon: "video", placeholder: "https://youtube.com/@canal", social: true, labelRequired: false, customIcon: false, invalidMessage: "Ingresa una URL válida." },
  tiktok: { label: "TikTok", icon: "video", placeholder: "@usuario o tiktok.com/@usuario", social: true, labelRequired: false, customIcon: false, invalidMessage: "Usa @usuario o una URL válida." },
  linkedin: { label: "LinkedIn", icon: "globe", placeholder: "https://linkedin.com/in/...", social: true, labelRequired: false, customIcon: false, invalidMessage: "Ingresa una URL válida." },
};

type Metadata = { message?: string } | null | undefined;

/** Convierte (tipo, valor) en un href seguro, o null si la configuración está incompleta o es peligrosa. */
export function resolveActionHref(type: ActionType, value: string, metadata?: Metadata): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  switch (type) {
    case "whatsapp":
      if (/^https?:\/\//i.test(v)) return normalizeUrlInput(v);
      return isValidPhoneNumber(v) ? whatsappLink(v, metadata?.message?.trim() || undefined) : null;
    case "phone":
      return isValidPhoneNumber(v) ? telLink(v) : null;
    case "email":
      return isEmail(v) ? `mailto:${v}` : null;
    case "instagram":
      return socialHref(v, "https://instagram.com/");
    case "facebook":
      return socialHref(v, "https://facebook.com/");
    case "tiktok":
      return socialHref(v, "https://tiktok.com/@");
    case "maps":
      return mapsHref(v);
    default:
      return normalizeUrlInput(v);
  }
}

export function isExternalHref(href: string): boolean {
  return /^https?:/i.test(href);
}
