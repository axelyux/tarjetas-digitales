/** URL base publica. Centralizada: cambiar NEXT_PUBLIC_SITE_URL cambia QR, canonical y sitemap. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Punto unico para construir la URL de una tarjeta (hoy /slug; manana subdominio). */
export function cardUrl(slug: string): string {
  return `${getSiteUrl()}/${slug}`;
}
