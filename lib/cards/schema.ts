import { z } from "zod";
import {
  ACTIONS_LAYOUTS, BACKGROUND_MODES, BORDER_RADII, BUTTON_ICONS, BUTTON_STYLES, CARD_STYLES,
  FONTS, LAYOUT_VARIANTS, LOGO_SHAPES, LOGO_SIZES, MAX_CUSTOM_BUTTONS, SHADOW_STYLES, TEMPLATES,
} from "./constants";
import { isHttpUrl, isSocialInput, onlyDigits } from "./links";
import { SLUG_REGEX, isReservedSlug } from "./slug";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (#RRGGBB)");

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

const optionalUrl = z
  .string()
  .trim()
  .max(500, "URL demasiado larga")
  .refine((v) => v === "" || isHttpUrl(v), "Debe ser una URL http(s) válida");

const optionalSocial = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || isSocialInput(v), "Usa @usuario o una URL válida");

const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => {
    if (v === "") return true;
    if (!/^[+\d\s().-]+$/.test(v)) return false;
    const n = onlyDigits(v).length;
    return n >= 8 && n <= 15;
  }, "Teléfono inválido (8 a 15 dígitos)");

/** Un asset (logo/portada/fondo) solo puede venir de nuestro proyecto de Supabase. */
const assetUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    if (v === "") return true;
    if (!isHttpUrl(v)) return false;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return base ? new URL(v).hostname === new URL(base).hostname : true;
  }, "Imagen no válida");

export const customButtonSchema = z.object({
  label: z.string().trim().min(1, "Requerido").max(30, "Máximo 30 caracteres"),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => isHttpUrl(v), "Debe ser una URL http(s) válida"),
  icon: z.enum(BUTTON_ICONS),
  isActive: z.boolean(),
});

export const cardInputSchema = z.object({
  id: z.uuid("ID inválido"),
  slug: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres")
    .regex(SLUG_REGEX, "Solo minúsculas, números y guiones")
    .refine((v) => !isReservedSlug(v), "Ese slug está reservado"),
  businessName: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  description: optionalText(400),
  category: optionalText(40),
  address: optionalText(200),
  schedule: optionalText(300),
  extraInfo: optionalText(600),

  logoUrl: assetUrl,
  coverImageUrl: assetUrl,
  backgroundImageUrl: assetUrl,

  phone: optionalPhone,
  whatsapp: optionalPhone,
  whatsappMessage: optionalText(200),
  instagramUrl: optionalSocial,
  facebookUrl: optionalSocial,
  googleMapsUrl: optionalUrl,
  websiteUrl: optionalUrl,
  bookingUrl: optionalUrl,

  primaryColor: hexColor,
  secondaryColor: hexColor,
  backgroundColor: hexColor,
  textColor: hexColor,
  accentColor: hexColor,

  template: z.enum(TEMPLATES),
  layoutVariant: z.enum(LAYOUT_VARIANTS),
  actionsLayout: z.enum(ACTIONS_LAYOUTS),
  borderRadius: z.enum(BORDER_RADII),
  buttonStyle: z.enum(BUTTON_STYLES),
  cardStyle: z.enum(CARD_STYLES),
  shadowStyle: z.enum(SHADOW_STYLES),
  logoSize: z.enum(LOGO_SIZES),
  logoShape: z.enum(LOGO_SHAPES),
  font: z.enum(FONTS),
  backgroundMode: z.enum(BACKGROUND_MODES),
  backgroundOverlay: z.number().int().min(0).max(90),
  showQr: z.boolean(),

  isActive: z.boolean(),
  isPaid: z.boolean(),

  buttons: z.array(customButtonSchema).max(MAX_CUSTOM_BUTTONS, `Máximo ${MAX_CUSTOM_BUTTONS} botones`),
});

export type CardInput = z.infer<typeof cardInputSchema>;

export const uuidSchema = z.uuid("ID inválido");
