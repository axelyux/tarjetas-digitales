import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Tarjetas Digitales", template: "%s" },
  description: "Tarjetas digitales interactivas para negocios locales.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
