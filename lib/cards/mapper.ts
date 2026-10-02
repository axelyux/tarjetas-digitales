import type { ButtonIcon } from "./constants";
import type { CardInput } from "./schema";
import {
  isHttpUrl, normalizeFacebook, normalizeInstagram, normalizeWhatsapp, onlyDigits,
} from "./links";
import type { AdminCard, CardButton, DigitalCardData } from "./types";

/** Columnas publicas (anon no puede leer is_paid ni otras administrativas). */
export const PUBLIC_COLUMNS = [
  "id", "slug", "business_name", "description", "category", "address", "schedule", "extra_info",
  "logo_url", "cover_image_url", "phone", "whatsapp", "whatsapp_message", "instagram_url",
  "facebook_url", "google_maps_url", "website_url", "booking_url",
  "primary_color", "secondary_color", "background_color", "text_color", "accent_color",
  "template", "layout_variant", "actions_layout", "border_radius", "button_style", "card_style",
  "shadow_style", "logo_size", "logo_shape", "font", "background_mode", "background_image_url",
  "background_overlay", "show_qr", "is_active", "published_at", "updated_at",
].join(",");

export const PUBLIC_BUTTON_COLUMNS = "id,card_id,label,url,icon,position,is_active";

type Nullable<T> = T | null;

export type CardRow = {
  id: string;
  slug: string;
  business_name: string;
  description: Nullable<string>;
  category: Nullable<string>;
  address: Nullable<string>;
  schedule: Nullable<string>;
  extra_info: Nullable<string>;
  logo_url: Nullable<string>;
  cover_image_url: Nullable<string>;
  phone: Nullable<string>;
  whatsapp: Nullable<string>;
  whatsapp_message: Nullable<string>;
  instagram_url: Nullable<string>;
  facebook_url: Nullable<string>;
  google_maps_url: Nullable<string>;
  website_url: Nullable<string>;
  booking_url: Nullable<string>;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  template: DigitalCardData["template"];
  layout_variant: DigitalCardData["layoutVariant"];
  actions_layout: DigitalCardData["actionsLayout"];
  border_radius: DigitalCardData["borderRadius"];
  button_style: DigitalCardData["buttonStyle"];
  card_style: DigitalCardData["cardStyle"];
  shadow_style: DigitalCardData["shadowStyle"];
  logo_size: DigitalCardData["logoSize"];
  logo_shape: DigitalCardData["logoShape"];
  font: DigitalCardData["font"];
  background_mode: DigitalCardData["backgroundMode"];
  background_image_url: Nullable<string>;
  background_overlay: number;
  show_qr: boolean;
  is_active: boolean;
  is_paid?: boolean;
  published_at: Nullable<string>;
  created_at?: string;
  updated_at: string;
  card_buttons?: ButtonRow[] | null;
};

export type ButtonRow = {
  id: string;
  label: string;
  url: string;
  icon: string;
  position: number;
  is_active: boolean;
};

const opt = (v: Nullable<string> | undefined): string | undefined => (v ? v : undefined);

function mapButton(row: ButtonRow): CardButton {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    icon: row.icon as ButtonIcon,
    position: row.position,
    isActive: row.is_active,
  };
}

export function rowToCardData(row: CardRow): DigitalCardData {
  return {
    slug: row.slug,
    businessName: row.business_name,
    description: opt(row.description),
    category: opt(row.category),
    address: opt(row.address),
    schedule: opt(row.schedule),
    extraInfo: opt(row.extra_info),
    logoUrl: opt(row.logo_url),
    coverImageUrl: opt(row.cover_image_url),
    phone: opt(row.phone),
    whatsapp: opt(row.whatsapp),
    whatsappMessage: opt(row.whatsapp_message),
    instagramUrl: opt(row.instagram_url),
    facebookUrl: opt(row.facebook_url),
    googleMapsUrl: opt(row.google_maps_url),
    websiteUrl: opt(row.website_url),
    bookingUrl: opt(row.booking_url),
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    accentColor: row.accent_color,
    template: row.template,
    layoutVariant: row.layout_variant,
    actionsLayout: row.actions_layout,
    borderRadius: row.border_radius,
    buttonStyle: row.button_style,
    cardStyle: row.card_style,
    shadowStyle: row.shadow_style,
    logoSize: row.logo_size,
    logoShape: row.logo_shape,
    font: row.font,
    backgroundMode: row.background_mode,
    backgroundImageUrl: opt(row.background_image_url),
    backgroundOverlay: row.background_overlay,
    showQr: row.show_qr,
    buttons: (row.card_buttons ?? [])
      .map(mapButton)
      .filter((b) => b.isActive)
      .sort((a, b) => a.position - b.position),
  };
}

export function rowToAdminCard(row: CardRow): AdminCard {
  const data = rowToCardData(row);
  return {
    ...data,
    buttons: (row.card_buttons ?? []).map(mapButton).sort((a, b) => a.position - b.position),
    id: row.id,
    isActive: row.is_active,
    isPaid: row.is_paid ?? false,
    createdAt: row.created_at ?? row.updated_at,
    updatedAt: row.updated_at,
    publishedAt: opt(row.published_at),
  };
}

/** AdminCard -> valores del formulario (strings vacios en lugar de undefined). */
export function adminCardToInput(card: AdminCard): CardInput {
  return {
    id: card.id,
    slug: card.slug,
    businessName: card.businessName,
    description: card.description ?? "",
    category: card.category ?? "",
    address: card.address ?? "",
    schedule: card.schedule ?? "",
    extraInfo: card.extraInfo ?? "",
    logoUrl: card.logoUrl ?? "",
    coverImageUrl: card.coverImageUrl ?? "",
    backgroundImageUrl: card.backgroundImageUrl ?? "",
    phone: card.phone ?? "",
    whatsapp: card.whatsapp ?? "",
    whatsappMessage: card.whatsappMessage ?? "",
    instagramUrl: card.instagramUrl ?? "",
    facebookUrl: card.facebookUrl ?? "",
    googleMapsUrl: card.googleMapsUrl ?? "",
    websiteUrl: card.websiteUrl ?? "",
    bookingUrl: card.bookingUrl ?? "",
    primaryColor: card.primaryColor,
    secondaryColor: card.secondaryColor,
    backgroundColor: card.backgroundColor,
    textColor: card.textColor,
    accentColor: card.accentColor,
    template: card.template,
    layoutVariant: card.layoutVariant,
    actionsLayout: card.actionsLayout,
    borderRadius: card.borderRadius,
    buttonStyle: card.buttonStyle,
    cardStyle: card.cardStyle,
    shadowStyle: card.shadowStyle,
    logoSize: card.logoSize,
    logoShape: card.logoShape,
    font: card.font,
    backgroundMode: card.backgroundMode,
    backgroundOverlay: card.backgroundOverlay,
    showQr: card.showQr,
    isActive: card.isActive,
    isPaid: card.isPaid,
    buttons: card.buttons.map((b) => ({ label: b.label, url: b.url, icon: b.icon, isActive: b.isActive })),
  };
}

/** Valores del formulario (ya validados) -> DigitalCardData para el preview en vivo. */
export function inputToCardData(input: CardInput): DigitalCardData {
  const safeUrl = (v: string) => (v && isHttpUrl(v) ? v : undefined);
  return {
    slug: input.slug,
    businessName: input.businessName,
    description: opt(input.description),
    category: opt(input.category),
    address: opt(input.address),
    schedule: opt(input.schedule),
    extraInfo: opt(input.extraInfo),
    logoUrl: safeUrl(input.logoUrl),
    coverImageUrl: safeUrl(input.coverImageUrl),
    phone: opt(input.phone),
    whatsapp: input.whatsapp && onlyDigits(input.whatsapp).length >= 8 ? input.whatsapp : undefined,
    whatsappMessage: opt(input.whatsappMessage),
    instagramUrl: opt(input.instagramUrl),
    facebookUrl: opt(input.facebookUrl),
    googleMapsUrl: safeUrl(input.googleMapsUrl),
    websiteUrl: safeUrl(input.websiteUrl),
    bookingUrl: safeUrl(input.bookingUrl),
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    backgroundColor: input.backgroundColor,
    textColor: input.textColor,
    accentColor: input.accentColor,
    template: input.template,
    layoutVariant: input.layoutVariant,
    actionsLayout: input.actionsLayout,
    borderRadius: input.borderRadius,
    buttonStyle: input.buttonStyle,
    cardStyle: input.cardStyle,
    shadowStyle: input.shadowStyle,
    logoSize: input.logoSize,
    logoShape: input.logoShape,
    font: input.font,
    backgroundMode: input.backgroundMode,
    backgroundImageUrl: safeUrl(input.backgroundImageUrl),
    backgroundOverlay: input.backgroundOverlay,
    showQr: input.showQr,
    buttons: input.buttons
      .filter((b) => b.isActive && b.label && isHttpUrl(b.url))
      .map((b, i) => ({ id: `preview-${i}`, label: b.label, url: b.url, icon: b.icon, position: i, isActive: true })),
  };
}

const nullIfEmpty = (v: string): string | null => (v.trim() === "" ? null : v.trim());

/** CardInput validado -> fila de la tabla cards (normaliza redes y telefonos). */
export function inputToRow(input: CardInput) {
  return {
    id: input.id,
    slug: input.slug,
    business_name: input.businessName,
    description: nullIfEmpty(input.description),
    category: nullIfEmpty(input.category),
    address: nullIfEmpty(input.address),
    schedule: nullIfEmpty(input.schedule),
    extra_info: nullIfEmpty(input.extraInfo),
    logo_url: nullIfEmpty(input.logoUrl),
    cover_image_url: nullIfEmpty(input.coverImageUrl),
    background_image_url: nullIfEmpty(input.backgroundImageUrl),
    phone: nullIfEmpty(input.phone),
    whatsapp: input.whatsapp.trim() ? normalizeWhatsapp(input.whatsapp) : null,
    whatsapp_message: nullIfEmpty(input.whatsappMessage),
    instagram_url: input.instagramUrl.trim() ? normalizeInstagram(input.instagramUrl) : null,
    facebook_url: input.facebookUrl.trim() ? normalizeFacebook(input.facebookUrl) : null,
    google_maps_url: nullIfEmpty(input.googleMapsUrl),
    website_url: nullIfEmpty(input.websiteUrl),
    booking_url: nullIfEmpty(input.bookingUrl),
    primary_color: input.primaryColor,
    secondary_color: input.secondaryColor,
    background_color: input.backgroundColor,
    text_color: input.textColor,
    accent_color: input.accentColor,
    template: input.template,
    layout_variant: input.layoutVariant,
    actions_layout: input.actionsLayout,
    border_radius: input.borderRadius,
    button_style: input.buttonStyle,
    card_style: input.cardStyle,
    shadow_style: input.shadowStyle,
    logo_size: input.logoSize,
    logo_shape: input.logoShape,
    font: input.font,
    background_mode: input.backgroundMode,
    background_overlay: input.backgroundOverlay,
    show_qr: input.showQr,
    is_active: input.isActive,
    is_paid: input.isPaid,
  };
}

export function inputButtonsToRows(cardId: string, buttons: CardInput["buttons"]) {
  return buttons.map((b, position) => ({
    card_id: cardId,
    label: b.label,
    url: b.url,
    icon: b.icon,
    position,
    is_active: b.isActive,
  }));
}
