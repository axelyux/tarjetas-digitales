import type { FontKey } from "./constants";

export const FONT_STACK: Record<FontKey, string> = {
  inter: "var(--font-inter), system-ui, sans-serif",
  poppins: "var(--font-poppins), system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  "space-grotesk": "var(--font-space-grotesk), system-ui, sans-serif",
  "dm-sans": "var(--font-dm-sans), system-ui, sans-serif",
};
