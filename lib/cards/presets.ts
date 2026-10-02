import type { CardInput } from "./schema";

export type PresetKey = "classic" | "midnight" | "luxury" | "fresh" | "minimal" | "warm";

export type PresetValues = Pick<
  CardInput,
  | "primaryColor" | "secondaryColor" | "backgroundColor" | "textColor" | "accentColor" | "coverColor2"
  | "template" | "borderRadius" | "buttonStyle" | "shadowStyle" | "font"
>;

export const PRESETS: Record<PresetKey, { label: string; values: PresetValues }> = {
  classic: {
    label: "Classic",
    values: {
      primaryColor: "#1e293b", secondaryColor: "#f1f5f9", backgroundColor: "#ffffff",
      textColor: "#0f172a", accentColor: "#2563eb", coverColor2: "#2563eb",
      template: "modern", borderRadius: "md", buttonStyle: "solid", shadowStyle: "soft", font: "inter",
    },
  },
  midnight: {
    label: "Midnight",
    values: {
      primaryColor: "#38bdf8", secondaryColor: "#1e293b", backgroundColor: "#0b1220",
      textColor: "#e2e8f0", accentColor: "#38bdf8", coverColor2: "#38bdf8",
      template: "bold", borderRadius: "lg", buttonStyle: "solid", shadowStyle: "strong", font: "space-grotesk",
    },
  },
  luxury: {
    label: "Luxury",
    values: {
      primaryColor: "#1c1917", secondaryColor: "#f5f0e6", backgroundColor: "#faf7f0",
      textColor: "#1c1917", accentColor: "#a8812f", coverColor2: "#a8812f",
      template: "elegant", borderRadius: "none", buttonStyle: "outline", shadowStyle: "none", font: "playfair",
    },
  },
  fresh: {
    label: "Fresh",
    values: {
      primaryColor: "#047857", secondaryColor: "#ecfdf5", backgroundColor: "#f7fffb",
      textColor: "#064e3b", accentColor: "#10b981", coverColor2: "#10b981",
      template: "soft", borderRadius: "full", buttonStyle: "soft", shadowStyle: "soft", font: "poppins",
    },
  },
  minimal: {
    label: "Minimal",
    values: {
      primaryColor: "#18181b", secondaryColor: "#f4f4f5", backgroundColor: "#ffffff",
      textColor: "#18181b", accentColor: "#52525b", coverColor2: "#52525b",
      template: "minimal", borderRadius: "sm", buttonStyle: "outline", shadowStyle: "none", font: "dm-sans",
    },
  },
  warm: {
    label: "Warm",
    values: {
      primaryColor: "#7c2d12", secondaryColor: "#fef3e8", backgroundColor: "#fffaf5",
      textColor: "#431407", accentColor: "#ea580c", coverColor2: "#ea580c",
      template: "editorial", borderRadius: "md", buttonStyle: "solid", shadowStyle: "soft", font: "playfair",
    },
  },
};

export const PRESET_KEYS = Object.keys(PRESETS) as PresetKey[];
