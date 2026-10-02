import { resolveActionHref } from "./action-types";
import {
  ACTION_TYPES, ACTIONS_LAYOUTS, BACKGROUND_MODES, BORDER_RADII, BUTTON_ICONS, BUTTON_STYLES, CARD_STYLES,
  FONTS, LAYOUT_VARIANTS, LOGO_SHAPES, LOGO_SIZES, PAYMENT_STATUSES, PUBLICATION_STATUSES, SHADOW_STYLES, TEMPLATES,
} from "./constants";
import { sanitizeHours } from "./hours";
import { isHttpUrl, normalizeWhatsapp } from "./links";
import type { CardInput } from "./schema";
import type { AdminCard, AdminListItem, CardAction, CardBranch, DigitalCardData } from "./types";

/** Columnas publicas: anon no puede leer is_paid, estados de pago, tokens ni campos legacy. */
export const PUBLIC_COLUMNS = [
  "id", "slug", "business_name", "description", "category", "address", "schedule", "extra_info",
  "logo_url", "cover_image_url", "logo_ratio", "hours",
  "primary_color", "secondary_color", "background_color", "text_color", "accent_color",
  "template", "layout_variant", "actions_layout", "border_radius", "button_style", "card_style",
  "shadow_style", "logo_size", "logo_shape", "font", "background_mode", "background_image_url",
  "background_overlay", "show_qr", "published_at", "updated_at",
].join(",");
export const PUBLIC_ACTION_COLUMNS = "id,card_id,type,label,value,icon,metadata,sort_order,enabled";
export const PUBLIC_BRANCH_COLUMNS = "id,card_id,name,address,maps_url,phone,whatsapp,hours,enabled,sort_order";
export const PUBLIC_SELECT = `${PUBLIC_COLUMNS},card_actions(${PUBLIC_ACTION_COLUMNS}),card_branches(${PUBLIC_BRANCH_COLUMNS})`;

type Nullable<T> = T | null | undefined;

/** Fila tal como llega de PostgREST / get_card_preview. Todo es "no confiable": se sanea al mapear. */
export type CardRow = Record<string, unknown> & {
  id?: string;
  card_actions?: Record<string, unknown>[] | null;
  card_branches?: Record<string, unknown>[] | null;
};

// ───────── Saneamiento tolerante (datos corruptos nunca deben romper el render) ─────────
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
const pick = <T extends string>(list: readonly T[], v: unknown, fallback: T): T =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback;
const color = (v: unknown, fallback: string): string =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const safeAsset = (v: unknown): string | undefined => {
  const s = str(v);
  return s && isHttpUrl(s) ? s : undefined;
};

/** Orden estable aunque sort_order este duplicado, nulo o corrupto. */
function stableSort<T extends { sortOrder: number }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.sortOrder - b.item.sortOrder || a.index - b.index)
    .map((x) => x.item);
}

function mapAction(row: Record<string, unknown>, index: number): CardAction | null {
  const type = pick(ACTION_TYPES, row.type, "custom_url");
  const value = str(row.value);
  if (!value) return null;
  const metadata = typeof row.metadata === "object" && row.metadata !== null ? (row.metadata as Record<string, unknown>) : {};
  return {
    id: str(row.id) ?? `action-${index}`,
    type,
    label: typeof row.label === "string" ? row.label.slice(0, 30) : "",
    value,
    icon: pick(BUTTON_ICONS, row.icon, "link"),
    metadata: { message: str(metadata.message) },
    enabled: bool(row.enabled, true),
    sortOrder: num(row.sort_order, index, -32768, 32767),
  };
}

function mapBranch(row: Record<string, unknown>, index: number): CardBranch | null {
  const name = str(row.name);
  if (!name) return null;
  return {
    id: str(row.id) ?? `branch-${index}`,
    name,
    address: str(row.address),
    mapsUrl: str(row.maps_url),
    phone: str(row.phone),
    whatsapp: str(row.whatsapp),
    hours: sanitizeHours(row.hours),
    enabled: bool(row.enabled, true),
    sortOrder: num(row.sort_order, index, -32768, 32767),
  };
}

function mapActions(rows: Nullable<Record<string, unknown>[]>): CardAction[] {
  return stableSort((rows ?? []).map(mapAction).filter((a): a is CardAction => a !== null));
}
function mapBranches(rows: Nullable<Record<string, unknown>[]>): CardBranch[] {
  return stableSort((rows ?? []).map(mapBranch).filter((b): b is CardBranch => b !== null));
}

/** Fila -> datos de tarjeta publica. Solo acciones/sucursales habilitadas. */
export function rowToCardData(row: CardRow): DigitalCardData {
  return {
    slug: str(row.slug) ?? "",
    businessName: str(row.business_name) ?? "Tarjeta digital",
    description: str(row.description),
    category: str(row.category),
    address: str(row.address),
    schedule: str(row.schedule),
    extraInfo: str(row.extra_info),
    hours: sanitizeHours(row.hours),
    logoUrl: safeAsset(row.logo_url),
    logoRatio: num(row.logo_ratio, 1, 0.05, 19.9),
    coverImageUrl: safeAsset(row.cover_image_url),
    primaryColor: color(row.primary_color, "#1e293b"),
    secondaryColor: color(row.secondary_color, "#f1f5f9"),
    backgroundColor: color(row.background_color, "#ffffff"),
    textColor: color(row.text_color, "#0f172a"),
    accentColor: color(row.accent_color, "#2563eb"),
    template: pick(TEMPLATES, row.template, "modern"),
    layoutVariant: pick(LAYOUT_VARIANTS, row.layout_variant, "centered"),
    actionsLayout: pick(ACTIONS_LAYOUTS, row.actions_layout, "stack"),
    borderRadius: pick(BORDER_RADII, row.border_radius, "md"),
    buttonStyle: pick(BUTTON_STYLES, row.button_style, "solid"),
    cardStyle: pick(CARD_STYLES, row.card_style, "flat"),
    shadowStyle: pick(SHADOW_STYLES, row.shadow_style, "soft"),
    logoSize: pick(LOGO_SIZES, row.logo_size, "md"),
    logoShape: pick(LOGO_SHAPES, row.logo_shape, "circle"),
    font: pick(FONTS, row.font, "inter"),
    backgroundMode: pick(BACKGROUND_MODES, row.background_mode, "color"),
    backgroundImageUrl: safeAsset(row.background_image_url),
    backgroundOverlay: Math.round(num(row.background_overlay, 40, 0, 90)),
    showQr: bool(row.show_qr, true),
    actions: mapActions(row.card_actions).filter((a) => a.enabled),
    branches: mapBranches(row.card_branches).filter((b) => b.enabled),
  };
}

/** Fila completa del panel (incluye acciones/sucursales deshabilitadas). */
export function rowToAdminCard(row: CardRow): AdminCard {
  const data = rowToCardData(row);
  const updatedAt = str(row.updated_at) ?? "";
  return {
    ...data,
    actions: mapActions(row.card_actions),
    branches: mapBranches(row.card_branches),
    id: str(row.id) ?? "",
    customerName: str(row.customer_name),
    publicationStatus: pick(PUBLICATION_STATUSES, row.publication_status, "draft"),
    paymentStatus: pick(PAYMENT_STATUSES, row.payment_status, "pending"),
    previewToken: str(row.preview_token) ?? "",
    createdAt: str(row.created_at) ?? updatedAt,
    updatedAt,
    publishedAt: str(row.published_at),
  };
}

export const LIST_COLUMNS = "id,slug,business_name,category,customer_name,template,publication_status,payment_status,created_at";

export function rowToListItem(row: CardRow): AdminListItem {
  return {
    id: str(row.id) ?? "",
    slug: str(row.slug) ?? "",
    businessName: str(row.business_name) ?? "",
    category: str(row.category),
    customerName: str(row.customer_name),
    template: pick(TEMPLATES, row.template, "modern"),
    publicationStatus: pick(PUBLICATION_STATUSES, row.publication_status, "draft"),
    paymentStatus: pick(PAYMENT_STATUSES, row.payment_status, "pending"),
    createdAt: str(row.created_at) ?? "",
  };
}

// ───────── AdminCard <-> formulario <-> BD ─────────
export function adminCardToInput(card: AdminCard): CardInput {
  return {
    id: card.id,
    slug: card.slug,
    businessName: card.businessName,
    customerName: card.customerName ?? "",
    description: card.description ?? "",
    category: card.category ?? "",
    address: card.address ?? "",
    schedule: card.schedule ?? "",
    extraInfo: card.extraInfo ?? "",
    hours: card.hours,
    logoUrl: card.logoUrl ?? "",
    logoRatio: card.logoRatio,
    coverImageUrl: card.coverImageUrl ?? "",
    backgroundImageUrl: card.backgroundImageUrl ?? "",
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
    publicationStatus: card.publicationStatus,
    paymentStatus: card.paymentStatus,
    actions: card.actions.map((a) => ({
      type: a.type, label: a.label, value: a.value, icon: a.icon, message: a.metadata.message ?? "", enabled: a.enabled,
    })),
    branches: card.branches.map((b) => ({
      name: b.name, address: b.address ?? "", mapsUrl: b.mapsUrl ?? "", phone: b.phone ?? "",
      whatsapp: b.whatsapp ?? "", hours: b.hours, enabled: b.enabled,
    })),
  };
}

/** Valores del formulario -> DigitalCardData para el preview en vivo (tolerante a entradas a medias). */
export function inputToCardData(input: CardInput): DigitalCardData {
  const opt = (v: string) => (v.trim() ? v : undefined);
  return {
    slug: input.slug,
    businessName: input.businessName || "Nombre del negocio",
    description: opt(input.description),
    category: opt(input.category),
    address: opt(input.address),
    schedule: opt(input.schedule),
    extraInfo: opt(input.extraInfo),
    hours: input.hours,
    logoUrl: safeAsset(input.logoUrl),
    logoRatio: input.logoRatio || 1,
    coverImageUrl: safeAsset(input.coverImageUrl),
    primaryColor: color(input.primaryColor, "#1e293b"),
    secondaryColor: color(input.secondaryColor, "#f1f5f9"),
    backgroundColor: color(input.backgroundColor, "#ffffff"),
    textColor: color(input.textColor, "#0f172a"),
    accentColor: color(input.accentColor, "#2563eb"),
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
    backgroundImageUrl: safeAsset(input.backgroundImageUrl),
    backgroundOverlay: input.backgroundOverlay,
    showQr: input.showQr,
    actions: input.actions
      .map((a, i): CardAction => ({
        id: `preview-${i}`, type: a.type, label: a.label, value: a.value, icon: a.icon,
        metadata: { message: opt(a.message) }, enabled: a.enabled, sortOrder: i,
      })),
    branches: input.branches.map((b, i): CardBranch => ({
      id: `preview-b-${i}`, name: b.name || "Sucursal", address: opt(b.address), mapsUrl: opt(b.mapsUrl),
      phone: opt(b.phone), whatsapp: opt(b.whatsapp), hours: b.hours, enabled: b.enabled, sortOrder: i,
    })).filter((b) => b.enabled),
  };
}

const nullIfEmpty = (v: string): string | null => (v.trim() === "" ? null : v.trim());

/** CardInput validado -> JSON de la tarjeta para save_card (solo columnas gestionadas). */
export function inputToCardRow(input: CardInput) {
  return {
    id: input.id,
    slug: input.slug,
    business_name: input.businessName,
    customer_name: nullIfEmpty(input.customerName),
    description: nullIfEmpty(input.description),
    category: nullIfEmpty(input.category),
    address: nullIfEmpty(input.address),
    schedule: nullIfEmpty(input.schedule),
    extra_info: nullIfEmpty(input.extraInfo),
    hours: input.hours,
    logo_url: nullIfEmpty(input.logoUrl),
    logo_ratio: input.logoUrl ? input.logoRatio : 1,
    cover_image_url: nullIfEmpty(input.coverImageUrl),
    background_image_url: nullIfEmpty(input.backgroundImageUrl),
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
    publication_status: input.publicationStatus,
    payment_status: input.paymentStatus,
  };
}

/** Normaliza el valor que se guarda (la tarjeta lo vuelve a resolver al renderizar). */
function storedValue(a: CardInput["actions"][number]): string {
  if (a.type === "whatsapp" && !/^https?:\/\//i.test(a.value)) return normalizeWhatsapp(a.value);
  if (a.type === "maps" || a.type === "phone" || a.type === "email") return a.value.trim();
  return resolveActionHref(a.type, a.value, { message: a.message }) ?? a.value.trim();
}

export function inputToActionRows(actions: CardInput["actions"]) {
  return actions.map((a) => ({
    type: a.type,
    label: a.label.trim(),
    value: storedValue(a),
    icon: a.icon,
    metadata: a.message.trim() ? { message: a.message.trim() } : {},
    enabled: a.enabled,
  }));
}

export function inputToBranchRows(branches: CardInput["branches"]) {
  return branches.map((b) => ({
    name: b.name,
    address: nullIfEmpty(b.address),
    maps_url: nullIfEmpty(b.mapsUrl),
    phone: nullIfEmpty(b.phone),
    whatsapp: nullIfEmpty(b.whatsapp),
    hours: b.hours,
    enabled: b.enabled,
  }));
}
