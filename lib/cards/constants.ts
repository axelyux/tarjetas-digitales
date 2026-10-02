export const TEMPLATES = ["minimal", "modern", "elegant", "bold", "soft", "editorial"] as const;
export const LAYOUT_VARIANTS = ["centered", "left", "hero", "compact"] as const;
export const ACTIONS_LAYOUTS = ["stack", "grid"] as const;
export const BORDER_RADII = ["none", "sm", "md", "lg", "full"] as const;
export const BUTTON_STYLES = ["solid", "outline", "soft"] as const;
export const CARD_STYLES = ["flat", "bordered", "raised"] as const;
export const SHADOW_STYLES = ["none", "soft", "strong"] as const;
export const LOGO_SIZES = ["sm", "md", "lg"] as const;
export const LOGO_SHAPES = ["circle", "rounded", "square"] as const;
export const FONTS = ["inter", "poppins", "playfair", "space-grotesk", "dm-sans"] as const;
export const BACKGROUND_MODES = ["color", "image"] as const;
export const BUTTON_ICONS = [
  "link", "menu", "tag", "calendar", "shopping-bag", "star", "gift", "clock",
  "map-pin", "phone", "mail", "globe", "camera", "heart", "book-open", "truck",
] as const;

export type Template = (typeof TEMPLATES)[number];
export type LayoutVariant = (typeof LAYOUT_VARIANTS)[number];
export type ActionsLayout = (typeof ACTIONS_LAYOUTS)[number];
export type BorderRadius = (typeof BORDER_RADII)[number];
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export type CardStyle = (typeof CARD_STYLES)[number];
export type ShadowStyle = (typeof SHADOW_STYLES)[number];
export type LogoSize = (typeof LOGO_SIZES)[number];
export type LogoShape = (typeof LOGO_SHAPES)[number];
export type FontKey = (typeof FONTS)[number];
export type BackgroundMode = (typeof BACKGROUND_MODES)[number];
export type ButtonIcon = (typeof BUTTON_ICONS)[number];

export const TEMPLATE_LABELS: Record<Template, string> = {
  minimal: "Minimal",
  modern: "Modern",
  elegant: "Elegant",
  bold: "Bold",
  soft: "Soft",
  editorial: "Editorial",
};

export const LAYOUT_LABELS: Record<LayoutVariant, string> = {
  centered: "Centrado",
  left: "Perfil a la izquierda",
  hero: "Portada",
  compact: "Compacto",
};

export const FONT_LABELS: Record<FontKey, string> = {
  inter: "Inter",
  poppins: "Poppins",
  playfair: "Playfair Display",
  "space-grotesk": "Space Grotesk",
  "dm-sans": "DM Sans",
};

export const RADIUS_VALUES: Record<BorderRadius, string> = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "18px",
  full: "999px",
};

export const SHADOW_VALUES: Record<ShadowStyle, string> = {
  none: "none",
  soft: "0 6px 20px -8px rgb(0 0 0 / 0.25)",
  strong: "0 14px 34px -10px rgb(0 0 0 / 0.45)",
};

export const LOGO_PX: Record<LogoSize, number> = { sm: 64, md: 88, lg: 116 };

export const RESERVED_SLUGS = [
  "admin", "api", "demo", "login", "logout", "auth", "_next", "static", "public",
  "sitemap", "robots", "favicon", "icon", "app", "dashboard", "cards", "new", "www",
] as const;

export const MAX_CUSTOM_BUTTONS = 8;
export const PAGE_SIZE = 25;
