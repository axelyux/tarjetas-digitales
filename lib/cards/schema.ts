import { z } from "zod";
import { ACTION_CONFIG, resolveActionHref } from "./action-types";
import {
  ACTION_TYPES, ACTIONS_LAYOUTS, BACKGROUND_MODES, BORDER_RADII, BUTTON_ICONS, BUTTON_STYLES, CARD_STYLES,
  FONTS, LAYOUT_VARIANTS, LOGO_SHAPES, LOGO_SIZES, MAX_ACTIONS, MAX_BRANCHES, PAYMENT_STATUSES,
  PUBLICATION_STATUSES, SHADOW_STYLES, TEMPLATES,
} from "./constants";
import { hoursSchema } from "./hours";
import { isHttpUrl, isValidPhoneNumber } from "./links";
import { SLUG_REGEX, isReservedSlug } from "./slug";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido (#RRGGBB)");

const optionalText = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

const optionalPhone = z
  .string()
  .trim()
  .max(30)
  .refine((v) => v === "" || isValidPhoneNumber(v), "Teléfono inválido (8 a 15 dígitos)");

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

export const actionSchema = z
  .object({
    type: z.enum(ACTION_TYPES),
    label: z.string().trim().max(30, "Máximo 30 caracteres"),
    value: z.string().trim().max(500, "Demasiado largo"),
    icon: z.enum(BUTTON_ICONS),
    message: z.string().trim().max(200, "Máximo 200 caracteres"),
    enabled: z.boolean(),
  })
  .superRefine((a, ctx) => {
    const config = ACTION_CONFIG[a.type];
    if (config.labelRequired && !a.label) {
      ctx.addIssue({ code: "custom", path: ["label"], message: "Escribe el texto del botón." });
    }
    if (!a.value) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Falta el destino de este botón." });
    } else if (
      !resolveActionHref(a.type, a.value, { message: a.message }) ||
      (a.type === "pdf" && !isHttpUrl(a.value))
    ) {
      ctx.addIssue({ code: "custom", path: ["value"], message: config.invalidMessage });
    }
  });

export const branchSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la sucursal").max(60, "Máximo 60 caracteres"),
  address: optionalText(200),
  mapsUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || resolveActionHref("maps", v) !== null, "Ingresa un enlace de Maps válido."),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  hours: hoursSchema,
  enabled: z.boolean(),
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
  customerName: optionalText(80),
  description: optionalText(400),
  category: optionalText(40),
  address: optionalText(200),
  schedule: optionalText(300),
  extraInfo: optionalText(600),
  hours: hoursSchema,

  logoUrl: assetUrl,
  logoRatio: z.number().min(0.05).max(19.9),
  coverImageUrl: assetUrl,
  backgroundImageUrl: assetUrl,

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

  publicationStatus: z.enum(PUBLICATION_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),

  actions: z.array(actionSchema).max(MAX_ACTIONS, `Máximo ${MAX_ACTIONS} botones`),
  branches: z.array(branchSchema).max(MAX_BRANCHES, `Máximo ${MAX_BRANCHES} sucursales`),
});

export type CardInput = z.infer<typeof cardInputSchema>;
export type ActionInput = z.infer<typeof actionSchema>;
export type BranchInput = z.infer<typeof branchSchema>;

export const uuidSchema = z.uuid("ID inválido");
