import { SLUG_REGEX } from "@/lib/cards/slug";
import { qrPngFor, qrSvgFor } from "@/lib/qr";

/** GET /api/qr/{slug}?format=svg|png&download=1 — QR dinámico hacia la URL pública de la tarjeta. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_REGEX.test(slug) || slug.length > 60) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "png" ? "png" : "svg";
  const download = url.searchParams.get("download") === "1";
  const headers: Record<string, string> = {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",
    "X-Content-Type-Options": "nosniff",
  };
  if (download) headers["Content-Disposition"] = `attachment; filename="qr-${slug}.${format}"`;

  if (format === "png") {
    const png = await qrPngFor(slug);
    return new Response(new Uint8Array(png), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const svg = await qrSvgFor(slug);
  return new Response(svg, { headers: { ...headers, "Content-Type": "image/svg+xml" } });
}
