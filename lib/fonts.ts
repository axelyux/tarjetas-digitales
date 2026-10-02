import { DM_Sans, Inter, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";
import type { FontKey } from "@/lib/cards/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false });

/** Clases que declaran las variables CSS de todas las fuentes (el navegador solo descarga la usada). */
export const fontVariables = [inter, poppins, playfair, spaceGrotesk, dmSans].map((f) => f.variable).join(" ");

export const FONT_STACK: Record<FontKey, string> = {
  inter: "var(--font-inter), system-ui, sans-serif",
  poppins: "var(--font-poppins), system-ui, sans-serif",
  playfair: "var(--font-playfair), Georgia, serif",
  "space-grotesk": "var(--font-space-grotesk), system-ui, sans-serif",
  "dm-sans": "var(--font-dm-sans), system-ui, sans-serif",
};
