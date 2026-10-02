import QRCode from "qrcode";
import { cardUrl } from "./site";

const OPTIONS = { margin: 1, errorCorrectionLevel: "M" as const };

/** QR como SVG (texto). Se genera al vuelo: no se almacena nada. */
export function qrSvgFor(slug: string): Promise<string> {
  return QRCode.toString(cardUrl(slug), { ...OPTIONS, type: "svg", color: { dark: "#000000", light: "#ffffff" } });
}

export function qrPngFor(slug: string): Promise<Buffer> {
  return QRCode.toBuffer(cardUrl(slug), { ...OPTIONS, width: 1024 });
}

/** data URI listo para <img src>: cero JavaScript en el cliente. */
export async function qrDataUriFor(slug: string): Promise<string> {
  const svg = await qrSvgFor(slug);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
