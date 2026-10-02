import type { CardInput } from "./schema";

export type PresetKey =
  | "classic" | "midnight" | "luxury" | "fresh" | "minimal" | "warm"
  | "ocean" | "sunset" | "forest" | "rose" | "graphite" | "sand" | "violet" | "citrus";

/** Una combinación completa: colores + template + estructura + estilo de banner y botones. */
export type PresetValues = Pick<
  CardInput,
  | "primaryColor" | "secondaryColor" | "backgroundColor" | "textColor" | "accentColor" | "coverColor2"
  | "template" | "layoutVariant" | "actionsLayout" | "coverMode" | "coverFade"
  | "borderRadius" | "buttonStyle" | "shadowStyle" | "font" | "logoShape"
>;

export const PRESETS: Record<PresetKey, { label: string; values: PresetValues }> = {
  classic: {
    label: "Classic",
    values: {
      primaryColor: "#1e293b", secondaryColor: "#f1f5f9", backgroundColor: "#ffffff",
      textColor: "#0f172a", accentColor: "#2563eb", coverColor2: "#2563eb",
      template: "modern", layoutVariant: "centered", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "md", buttonStyle: "solid", shadowStyle: "soft", font: "inter", logoShape: "circle",
    },
  },
  midnight: {
    label: "Midnight",
    values: {
      primaryColor: "#38bdf8", secondaryColor: "#1e293b", backgroundColor: "#0b1220",
      textColor: "#e2e8f0", accentColor: "#38bdf8", coverColor2: "#6366f1",
      template: "bold", layoutVariant: "hero", actionsLayout: "stack", coverMode: "gradient", coverFade: true,
      borderRadius: "lg", buttonStyle: "solid", shadowStyle: "strong", font: "space-grotesk", logoShape: "rounded",
    },
  },
  luxury: {
    label: "Luxury",
    values: {
      primaryColor: "#1c1917", secondaryColor: "#f5f0e6", backgroundColor: "#faf7f0",
      textColor: "#1c1917", accentColor: "#a8812f", coverColor2: "#a8812f",
      template: "elegant", layoutVariant: "centered", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "none", buttonStyle: "outline", shadowStyle: "none", font: "playfair", logoShape: "circle",
    },
  },
  fresh: {
    label: "Fresh",
    values: {
      primaryColor: "#047857", secondaryColor: "#ecfdf5", backgroundColor: "#f7fffb",
      textColor: "#064e3b", accentColor: "#10b981", coverColor2: "#6ee7b7",
      template: "soft", layoutVariant: "hero", actionsLayout: "grid", coverMode: "gradient", coverFade: true,
      borderRadius: "full", buttonStyle: "soft", shadowStyle: "soft", font: "poppins", logoShape: "circle",
    },
  },
  minimal: {
    label: "Minimal",
    values: {
      primaryColor: "#18181b", secondaryColor: "#f4f4f5", backgroundColor: "#ffffff",
      textColor: "#18181b", accentColor: "#52525b", coverColor2: "#52525b",
      template: "minimal", layoutVariant: "left", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "sm", buttonStyle: "outline", shadowStyle: "none", font: "dm-sans", logoShape: "circle",
    },
  },
  warm: {
    label: "Warm",
    values: {
      primaryColor: "#7c2d12", secondaryColor: "#fef3e8", backgroundColor: "#fffaf5",
      textColor: "#431407", accentColor: "#ea580c", coverColor2: "#ea580c",
      template: "editorial", layoutVariant: "centered", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "md", buttonStyle: "solid", shadowStyle: "soft", font: "playfair", logoShape: "circle",
    },
  },
  ocean: {
    label: "Ocean",
    values: {
      primaryColor: "#0c4a6e", secondaryColor: "#e0f2fe", backgroundColor: "#f0f9ff",
      textColor: "#0c4a6e", accentColor: "#0891b2", coverColor2: "#06b6d4",
      template: "modern", layoutVariant: "hero", actionsLayout: "grid", coverMode: "gradient", coverFade: true,
      borderRadius: "md", buttonStyle: "solid", shadowStyle: "soft", font: "dm-sans", logoShape: "circle",
    },
  },
  sunset: {
    label: "Sunset",
    values: {
      primaryColor: "#be123c", secondaryColor: "#fff1f2", backgroundColor: "#fffaf5",
      textColor: "#4c0519", accentColor: "#ea580c", coverColor2: "#f59e0b",
      template: "soft", layoutVariant: "hero", actionsLayout: "stack", coverMode: "gradient", coverFade: true,
      borderRadius: "lg", buttonStyle: "solid", shadowStyle: "soft", font: "poppins", logoShape: "circle",
    },
  },
  forest: {
    label: "Forest",
    values: {
      primaryColor: "#14532d", secondaryColor: "#f0fdf4", backgroundColor: "#fafdf7",
      textColor: "#14532d", accentColor: "#4d7c0f", coverColor2: "#4d7c0f",
      template: "elegant", layoutVariant: "centered", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "sm", buttonStyle: "outline", shadowStyle: "none", font: "playfair", logoShape: "square",
    },
  },
  rose: {
    label: "Rose",
    values: {
      primaryColor: "#9f1239", secondaryColor: "#ffe4e6", backgroundColor: "#ffffff",
      textColor: "#3f0d1a", accentColor: "#e11d48", coverColor2: "#fb7185",
      template: "soft", layoutVariant: "compact", actionsLayout: "stack", coverMode: "color", coverFade: false,
      borderRadius: "full", buttonStyle: "soft", shadowStyle: "soft", font: "poppins", logoShape: "circle",
    },
  },
  graphite: {
    label: "Graphite",
    values: {
      primaryColor: "#18181b", secondaryColor: "#e4e4e7", backgroundColor: "#fafafa",
      textColor: "#18181b", accentColor: "#dc2626", coverColor2: "#dc2626",
      template: "bold", layoutVariant: "left", actionsLayout: "grid", coverMode: "color", coverFade: false,
      borderRadius: "none", buttonStyle: "solid", shadowStyle: "strong", font: "space-grotesk", logoShape: "square",
    },
  },
  sand: {
    label: "Sand",
    values: {
      primaryColor: "#78350f", secondaryColor: "#fef3c7", backgroundColor: "#fffbeb",
      textColor: "#451a03", accentColor: "#d97706", coverColor2: "#fbbf24",
      template: "editorial", layoutVariant: "hero", actionsLayout: "stack", coverMode: "gradient", coverFade: true,
      borderRadius: "sm", buttonStyle: "outline", shadowStyle: "none", font: "playfair", logoShape: "circle",
    },
  },
  violet: {
    label: "Violet",
    values: {
      primaryColor: "#4c1d95", secondaryColor: "#f5f3ff", backgroundColor: "#ffffff",
      textColor: "#2e1065", accentColor: "#7c3aed", coverColor2: "#db2777",
      template: "modern", layoutVariant: "hero", actionsLayout: "stack", coverMode: "gradient", coverFade: true,
      borderRadius: "lg", buttonStyle: "solid", shadowStyle: "soft", font: "inter", logoShape: "rounded",
    },
  },
  citrus: {
    label: "Citrus",
    values: {
      primaryColor: "#1a2e05", secondaryColor: "#ecfccb", backgroundColor: "#f7fee7",
      textColor: "#1a2e05", accentColor: "#65a30d", coverColor2: "#84cc16",
      template: "bold", layoutVariant: "compact", actionsLayout: "grid", coverMode: "color", coverFade: false,
      borderRadius: "none", buttonStyle: "solid", shadowStyle: "none", font: "dm-sans", logoShape: "square",
    },
  },
};

export const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];
